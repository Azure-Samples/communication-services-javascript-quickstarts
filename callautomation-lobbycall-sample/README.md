
|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</td></tr></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Call Automation - Lobby Call Support Sample

In this sample, we cover how you can use Call Automation SDK to support Lobby Call where we join Lobby call users to a target call upon confirmation of admin in the target call.

# Design

![Lobby Call Support](./Resources/Lobby_Call_Support_Scenario.jpg)

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `callautomation-lobbycall-sample` folder.
4. From the root of the above folder, and with node installed, run `npm install`

## Running the client App for the sample

1. Open the web client app at [JS Client Sample](https://github.com/Azure-Samples/communication-services-javascript-quickstarts/tree/users/v-kuppu/LobbyCallConfirmSample) and sign in with your Azure Communication Services identity.
2. Clone the sample repository by running `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. Run the application and observe logs at console, keep this application running.

    ```
    npx webpack serve --config webpack.config.js
    ```

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the commands below to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and which allows anonymous access. We will then use this endpoint to notify your application of calling events from the ACS Call Automation service.

```bash
devtunnel create --allow-anonymous
devtunnel port create -p 8443
devtunnel host
```

### Configuring application

Create/Open the `.env` file to configure the following settings

1. `PORT`: Assign constant 8443
2. `CONNECTION_STRING`: Azure Communication Service resource's connection string.
3. `COGNITIVE_SERVICES_ENDPOINT` : Cognitive service endpoint.
4. `CALLBACK_URI`: Base url of the app. (For local development replace the dev tunnel url)
5. `ACS_ID_FOR_LOBBY_CALL_RECEIVER`: ACS Inbound Phone Number
6. `ACS_ID_FOR_TARGET_CALL_RECEIVER`: ACS Phone Number to make the first call, external user number in real time
7. `ACS_ID_FOR_TARGET_CALL_SENDER`: ACS identity generated using web client
8. `SOCKET_TOKEN`: ACS identity generated using web client

### To Run app 

1. Open a new Powershell window, cd into the `callautomation-lobbycall-sample` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8443/`
3. Follow the steps.

## Run app locally

1. Setup EventSubscription(Incoming) with filter for `TO.DATA.RAWID = <ACS_GENERATED_ID_TARGET_CALL_RECEIVER>, <ACS_GENERATED_ID_LOBBY_CALL_RECEIVER>`.
2. Setup the following keys in the config/constants
	 ```"acsConnectionString": "<acsConnectionString>",
	 "cognitiveServiceEndpoint": "<cognitiveServiceEndpoint>",
	 "callbackUriHost": "<callbackUriHost>",
	 "textToPlayToLobbyUser": "You are currently in a lobby call, we will notify the admin that you are waiting.",
	 "confirmMessageToTargetCall": "A user is waiting in lobby, do you want to add the lobby user to your call?",
	 "acsGeneratedIdForLobbyCallReceiver": "<acsGeneratedIdForLobbyCallReceiver>",(Generate Voice Calling Identity in Azure Portal)
	 "acsGeneratedIdForTargetCallReceiver": "<acsGeneratedIdForTargetCallReceiver>",(Generate Voice Calling Identity in Azure Portal)
	 "acsGeneratedIdForTargetCallSender": "<acsGeneratedIdForTargetCallSender>",(Generate Voice Calling Identity in Azure Portal)
	 "socketToken": "<socketToken>"(Token associated with <acsGeneratedIdForTargetCallSender> in Azure Portal)```
3. Define a websocket in your application(program.cs) to send and receive messages from and to client application(JS Hero App in this case).
4. Define a Client application that receives and responds to server notifications. Client application is available at <url>.
5. Enter and validate user token in client app to send calls.
6. Start call to `<acsGeneratedIdForTargetCallReceiver>`.
7. Expect Call Connected evennt in /callbacks
8. Start a call from ACS Test app(angular) to acsGeneratedIdForLobbyCallReceiver
9. Call will be answered and automated voice will be played to lobby user with the text `<textToPlayToLobbyUser>`. 
10. Once the play completed, Target call will be notified with `<confirmMessageToTargetCall>`.
11. Once the Target call confirms from client application, Move `<acsGeneratedIdForLobbyCallReceiver>` in the backend sample.
12. If Target user says no, then no MOVE will be performed.
13. Ensure MoveParticipantSucceeded event is received in `/callbacks` endpoint.
14. Check `/Getparticipants` endpoint be called with Target call id, Target call must have the recent lobby user in the call.