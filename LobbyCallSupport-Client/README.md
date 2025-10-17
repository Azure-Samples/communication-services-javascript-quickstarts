| page_type | languages                                    | products                                                                    |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Sample    | <table><tr><td>Java Script</tr></td></table> | <table><tr><td>azure</td><td>azure-communication-services</td></tr></table> |

# Call Automation - Lobby Call Support Client Sample

- This sample is used to establish a target call between two ACS users and then waits for Lobby call users to connect the target call.
- The target call user can then choose to accept or reject the lobby user joining the target call upon receiving an alert.
- The sample uses a web socket to communicate the confirmation back to a server application at [DotNet-LobbyCallSupportSample](https://github.com/Azure-Samples/communication-services-dotnet-quickstarts/tree/users/v-kuppu/LobbyCallSupportSample/LobbyCallSupportSample) that handles incoming call events and send notifications to the client application.

# Design

![Lobby Call Support](./Resources/Lobby_Call_Support_Scenario.jpg)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- A deployed Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- A server application at [DotNet-LobbyCallSupportSample](https://github.com/Azure-Samples/communication-services-dotnet-quickstarts/tree/users/v-kuppu/LobbyCallSupportSample/LobbyCallSupportSample) that can handle incoming call events and send notifications to the client application.

## Before running the sample for the first time

1. Open the web client app and sign in with your Azure Communication Services identity.
2. Clone the sample repository by running `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. Navigate to the `LobbyCallSupport-Client` folder in the cloned repository.
   ```bash
   cd communication-services-javascript-quickstarts/LobbyCallSupport-Client
   ```
4. Install the required dependencies:
   ```bash
   npm install
   ```
5. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the `WEBSOCKET_URL` with your WebSocket server URL
   - Optionally set `ENABLE_WEBSOCKET` to `true` or `false`

### Configuring application

#### Environment Variables

Create a `.env` file in the project root with the following variables:

- `WEBSOCKET_URL`: WebSocket URL configured in the server application to send lobby call notifications to the client app
- `ENABLE_WEBSOCKET`: Set to `true` to enable WebSocket functionality, `false` to disable

Example `.env` file:

```
WEBSOCKET_URL=ws://your-websocket-server-url:port/ws
ENABLE_WEBSOCKET=true
```

## Run app locally

1. Run the application with
   `npx webpack serve --config webpack.config.js`.
2. Enter the token (User id and token generated in Azure) in the input box and click on `Connect` button.
3. Once connected, you can start making calls to the target user.
   Start the target call in Client application,
   - Add token of target call sender(token would be generated in Azure user & tokens section).
   - Add user id of the target call receiver <ACS_GENERATED_ID_FOR_LOBBY_CALL_RECEIVER>.
   - Click on Start Call button to initiate the call.
4. Also start a lobby call by entering the `<acsGeneratedIdForLobbyCallReceiver>` in other ACS Test client app at `https://acssampleapp.azurewebsites.net/`.
5. Once the lobby call is started, you can hear the lobby call message followed by a confirm dialog saying `"A user is waiting in lobby, do you want to add the lobby user to your call?` in this JS Client application.
6. The web socket configured in the application sends your answer to the server app which determines whether move the lobby call participant to the target call running in this session.
