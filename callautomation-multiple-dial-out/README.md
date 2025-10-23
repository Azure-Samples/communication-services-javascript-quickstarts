
|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Multiple Dial Out using Call Automation SDK

In this quickstart sample, we cover how you can use the Call Automation SDK to perform multiple dial-outs using Azure Communication Services (ACS) calls. This involves creating and managing several outgoing calls simultaneously and dynamically moving participants between these active calls.

## Features

This sample demonstrates:
- Creating multiple outbound calls
- Managing call connections and participants
- Moving participants between calls
- Real-time UI updates with call status
- Event-driven webhooks for call automation
- Call redirection to ACS Communication Users

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `callautomation-multiple-dial-out` folder.
4. From the root of the above folder, and with node installed, run `npm install`

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the commands below to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and which allows anonymous access. We will then use this endpoint to notify your application of calling events from the ACS Call Automation service.

```bash
devtunnel create --allow-anonymous
devtunnel port create -p 8080
devtunnel host
```

### Configuring application

Create/Open the `.env` file to configure the following settings

1. `PORT`: Assign constant 8080
2. `CONNECTION_STRING`: Azure Communication Service resource's connection string.
3. `ACS_INBOUND_PHONE_NUMBER`: Inbound Phone number associated with the Azure Communication Service resource. For e.g. "+1425XXXAAAA"
4. `ACS_OUTBOUND_PHONE_NUMBER`: Outbound Phone number associated with the Azure Communication Service resource. For e.g. "+1425XXXAAAA"
5. `USER_PHONE_NUMBER`: User phone number to add in the call. For e.g. "+1425XXXAAAA"
6. `ACS_TEST_IDENTITY_2`: An ACS Communication Identifier to add in the call.
7. `ACS_TEST_IDENTITY_3`: Another ACS Communication Identifier to add in the call.
8. `CALLBACK_URI`: Base url of the app. (For local development replace the dev tunnel url)
9. `COGNITIVE_SERVICES_ENDPOINT` : Cognitive service endpoint.

### Run app locally

1. Open a new Powershell window, cd into the `callautomation-multiple-dial-out` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
3. Follow the steps.

## Application Architecture

### Backend (app.ts)

The backend Express.js application provides the following functionality:

#### Key Endpoints:
- **GET /**: Serves the main HTML interface
- **GET /userCallToCallAutomation**: Creates initial call from user to ACS
- **GET /createCall2**: Creates second call that redirects to ACS Test Identity 2
- **GET /createCall3**: Creates third call that redirects to ACS Test Identity 3
- **GET /moveParticipant2**: Moves participant from Call 2 to Call 1
- **GET /moveParticipant3**: Moves participant from Call 3 to Call 1
- **GET /terminateCalls**: Hangs up all active calls
- **GET /call-data**: Returns current call data as JSON
- **POST /api/moveParticipantEvent**: Handles incoming call events and redirections
- **POST /api/callbacks**: Handles call automation events

#### Call Management:
The application manages three types of calls:
1. **Call 1**: User phone → ACS Inbound number (answered by application)
2. **Call 2**: ACS Inbound → ACS Outbound (redirected to ACS Test Identity 2)
3. **Call 3**: ACS Inbound → ACS Outbound (redirected to ACS Test Identity 3)

#### Event Handling:
- Processes incoming call events for call redirection
- Handles call connected/disconnected events
- Supports move participant operations between calls

### Frontend (index.html)

The frontend provides a real-time interface with:

#### UI Features:
- **Two-column layout**: Call Controls (50%) and Call Details (50%)
- **Step-by-step workflow**: Guided process for creating and managing calls
- **Real-time updates**: Automatic fetching of call data every 5 seconds
- **Dynamic button states**: Buttons enable/disable based on call status

#### JavaScript Functionality:
- **Periodic data fetching**: Updates call information automatically
- **Form submission alerts**: User feedback for actions
- **Dynamic UI updates**: Button states and call information refresh
- **Error handling**: Graceful handling of API errors

#### Workflow Steps:
1. Configure environment variables
2. Set up Event Grid webhook
3. Make initial user call
4. Create Call 2 (for ACS Test Identity 2)
5. Create Call 3 (for ACS Test Identity 3)
6. Move participants between calls
7. Terminate all calls

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Serve main HTML interface |
| `/userCallToCallAutomation` | GET | Create initial user call |
| `/createCall2` | GET | Create call for Test Identity 2 |
| `/createCall3` | GET | Create call for Test Identity 3 |
| `/moveParticipant2` | GET | Move participant from Call 2 to Call 1 |
| `/moveParticipant3` | GET | Move participant from Call 3 to Call 1 |
| `/terminateCalls` | GET | Terminate all active calls |
| `/call-data` | GET | Get current call status (JSON) |
| `/api/moveParticipantEvent` | POST | Handle incoming call events |
| `/api/callbacks` | POST | Handle call automation callbacks |

## Event Flow

1. **User initiates call**: User phone → ACS Inbound number
2. **Application answers**: Call 1 established
3. **Create additional calls**: Calls 2 and 3 created to ACS Outbound
4. **Call redirection**: Incoming calls redirected to ACS Test Identities
5. **Participant movement**: Move participants between active calls
6. **Call termination**: End all calls when complete

This sample provides a comprehensive example of managing multiple calls and participants using Azure Communication Services Call Automation SDK.