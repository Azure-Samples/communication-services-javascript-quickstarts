| page_type | languages                               | products                                                                    |
| --------- | --------------------------------------- | --------------------------------------------------------------------------- |
| sample    | <table><tr><td>DotNet</tr></td></table> | <table><tr><td>azure</td><td>azure-communication-services</td></tr></table> |

# Call Automation - Lobby Call Support Client Sample

In this sample, we cover how you can use Call Automation SDK to support Lobby Call where we join Lobby call users to a target call upon confirmation of admin in the target call(from this client app).

# Design

![Lobby Call Support](./Resources/Lobby_Call_Support_Scenario.jpg)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- A deployed Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- Create Azure AI Multi Service resource. For details, see [Create an Azure AI Multi service](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account).
- Create and host a Azure Dev Tunnel. Instructions [here](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)
- A server application at [DotNet-LobbyCallSupportSample](https://github.com/Azure-Samples/communication-services-dotnet-quickstarts/tree/users/v-kuppu/LobbyCallSupportSample/LobbyCallSupportSample) that can handle incoming call events and send notifications to the client application.

## Before running the sample for the first time

1. Open the web client app and sign in with your Azure Communication Services identity.
2. Clone the sample repository by running `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. Run the application and observe logs at console, keep this application running.

    ```
    npx webpack serve --config webpack.config.js
    ```

### Configuring application

1. `<token>`: Azure Communication Service resource's connection string.
2. `<socket-url>`: Cognitive Service resource's endpoint.
   - This is used to play media to the participants in the call.
   - For more information, see [Create an Azure AI Multi service](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account).

## Run app locally

1. Run the application with 
   ```npx webpack serve --config webpack.config.js```.
2. Enter the `<token>` in the input box and click on `Connect` button.
3. Once connected, you can start making calls to the target user.
4. Also start a lobby call by entering the `<acsGeneratedIdForLobbyCallReceiver>` in other ACS Test client app at `https://acssampleapp.azurewebsites.net/`.
5. Once the lobby call is started, you can hear the lobby call message followed by a confirm dialog saying `You are currently in a lobby call, we will notify the admin that you are waiting.` in the application.
6. The web socket configured in the application sends your answer to the server app which determines whether move the lobby call participant to the target call running in this session.