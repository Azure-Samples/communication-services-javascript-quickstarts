
|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</td></tr></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Call Automation - Lobby Call Support Sample

This sample demonstrates how to use Azure Communication Services Call Automation SDK to support a "Lobby Call" scenario, where users wait in a lobby and can be joined to a target call by an admin.

![Lobby Call Support](./Resources/Lobby_Call_Support_Scenario.jpg)

## Prerequisites

- Azure account with active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)

## Setup

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git
   cd communication-services-javascript-quickstarts/callautomation-lobbycall-sample
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the project root with the following keys:
   ```env
   PORT=8443
   CONNECTION_STRING="<your ACS connection string>"
   COGNITIVE_SERVICES_ENDPOINT="<your cognitive services endpoint>"
   CALLBACK_URI="<your dev tunnel or public URL>"
   PMA_ENDPOINT="<your PMA endpoint>"
   ACS_GENERATED_ID="<your ACS identity for lobby call receiver>"
   SOCKET_TOKEN="<your ACS token for authentication>"
   ```

3. **Set up Azure DevTunnels (for webhook callbacks):**
   [Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) enables you to share local web services on the internet for webhook callbacks.
   ```bash
   devtunnel create --allow-anonymous
   devtunnel port create -p 8443
   devtunnel host
   ```
   Update your `CALLBACK_URI` in `.env` with the generated tunnel URL.

## Running the Application

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Access the web interface:**
   - Local: `http://localhost:8443/`
   - Public: Your DevTunnel URL (e.g., `https://your-tunnel.inc1.devtunnels.ms`)

## Web Interface Usage

The web page provides a step-by-step interface for the lobby call workflow:

### Steps:
1. **Configure Environment Variables** - Ensure your `.env` file is properly set up
2. **Configure Webhook** - Point Event Grid webhook to `/api/lobbyCallEventHandler` endpoint
3. **Configure Lobby Call** - Make a lobby call from your ACS client app to the generated ACS identity
4. **Create Target Call** - Enter an ACS Target User ID and click "Create Call!"
5. **Answer User Call** - Answer the call manually from your ACS client app
6. **View Participants** - The right panel shows participant IDs in the target call (auto-refreshed)
7. **Terminate Calls** - Use the "Terminate Calls!" button to end all active calls

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/targetCallToAcsUser?acsTarget=<user_id>` | Initiates a call to the specified ACS user |
| `GET` | `/getParticipants` | Returns participant list in the current target call |
| `GET` | `/terminateCalls` | Terminates all active calls and resets state |
| `POST` | `/api/lobbyCallEventHandler` | Handles incoming Event Grid webhook events for lobby calls |
| `POST` | `/api/callbacks` | Handles ACS call automation callbacks (CallConnected, PlayCompleted, etc.) |
| `GET` | `/` | Serves the main web interface |

## Workflow Overview

1. **Lobby Call Setup**: User calls the ACS generated identity for lobby
2. **Call Answered**: Call Automation answers and plays waiting message
3. **Target Call Creation**: Admin creates a target call via web interface
4. **Automatic Join**: After play completes, lobby user is automatically moved to target call
5. **Participant Management**: View and manage participants through the web interface

## Event Handling

The application handles these key ACS events:
- **IncomingCall**: Automatically answers lobby calls
- **CallConnected**: Records caller information and plays lobby message
- **PlayCompleted**: Triggers automatic move of lobby user to target call
- **MoveParticipantsSucceeded**: Confirms successful participant transfer
- **CallDisconnected**: Handles call cleanup

## Features

- **Automatic Lobby Management**: Users are automatically placed in lobby with custom message
- **Real-time Participant Tracking**: Web interface shows current participants
- **Automatic Call Transfer**: Lobby users automatically join target call after message plays
- **Call State Management**: Proper cleanup and state management for all calls
- **Event Grid Integration**: Webhook support for incoming call events

## Development Notes

- The sample uses HTTP-only communication (no WebSocket client in the web interface)
- Participant information refreshes every 50 seconds automatically
- All call events and operations are logged to the console
- The server handles both HTTP requests and WebSocket upgrade for future extensibility

## Troubleshooting

### Common Issues:
- **Port already in use**: Kill existing Node.js processes with `taskkill /F /IM node.exe`
- **WebSocket connection errors**: Ensure DevTunnel is running and CALLBACK_URI is correct
- **Call not connecting**: Verify ACS connection string and cognitive services endpoint
- **Event Grid webhooks not working**: Check that webhook URL points to your public DevTunnel URL

### Debugging:
- Check browser console for client-side errors
- Monitor server console for API call logs and ACS events
- Verify Event Grid webhook configuration in Azure portal
- Test endpoints individually using tools like Postman

## Architecture

The application consists of:
- **Express.js Backend**: Handles ACS Call Automation and webhook events
- **Web Interface**: Simple HTML/JavaScript frontend for call management
- **Azure Communication Services**: Provides calling capabilities
- **Azure Cognitive Services**: Powers text-to-speech for lobby messages
- **Azure Event Grid**: Delivers incoming call webhooks

## Security Considerations

- Store sensitive keys in environment variables, not in code
- Use HTTPS for production deployments
- Implement proper authentication for production use
- Validate webhook signatures from Azure Event Grid
- Restrict DevTunnel access in production environments