|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Chat with Azure OpenAI - Quick Start Sample

This sample application demonstrates how to integrate Azure Communication Services Chat SDK with Azure OpenAI Service to enable intelligent message analysis. The application listens for a user message, processes the text through the Azure OpenAI Service, and generates appropriate analysis. Or optionally, developers can replace the logic with their own AI model for message analysis.

- app.ts - Node JS application providing HTTP endpoints for message analysis (including EventGrid webhook endpoint)
- client.ts - script to setup chat messages and test HTTP endpoints locally for message analysis

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/).
- Install [Visual Studio Code](https://code.visualstudio.com/download).
- Install [Node.js](https://nodejs.org/en/download).
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You need to record your resource **connection string** for this sample.
- An Azure OpenAI Resource and Deployed Model. See [instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal).

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory where you want to clone the sample.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `chat-openai-sample` folder.
4. From the root of the `chat-openai-sample` folder run `npm install`.

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the following commands to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and enables anonymous access. We use this endpoint to notify your application of chat events from the Azure Communication Services Chat service.

```bash
// Only needs to be done the first time
devtunnel user login

devtunnel create --allow-anonymous
devtunnel port create -p 8080
devtunnel host
```

### Configuring application

Open the `.env` file to configure the following settings:

1. `PORT`: Localhost port to run the server app on.
2. `CONNECTION_STRING`: Azure Communication Services resource connection string.
3. `ACS_URL_ENDPOINT`: Azure Communication Services resource URL endpoint.
4. `AZURE_OPENAI_SERVICE_KEY`: Azure Open AI service key.
5. `AZURE_OPENAI_SERVICE_ENDPOINT`: Azure Open AI endpoint.
6. `AZURE_OPENAI_DEPLOYMENT_MODEL_NAME`: Azure Open AI deployment name.

### Run app locally

1. Open a new Powershell window, cd into the `chat-openai-sample` folder and run `npm run dev`.
2. The browser displays the following dialog box. If not navigate to `http://localhost:8080/`.
3. To test the AI analysis API endpoint on your local machine, in another new Powersehll window for the same directory, run `npm run client` to observe how messages are generated and processed.
4. (optional) To setup EventGrid, follow [Setup and host your Azure DevTunnel](#setup-and-host-your-azure-devtunnel) and register an EventGrid Webhook for the [ChatMessageReceived event](https://learn.microsoft.com/en-us/azure/event-grid/communication-services-chat-events#microsoftcommunicationchatmessagereceived-event) that points to your DevTunnel URI for `<DevTunnelUri>/api/chatMessageReceived`. See here for Event Grid Webhook configuration example [here](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/events/subscribe-to-events?pivots=platform-azp).

Once that's completed you should have a running application. The best way to test this is to send a message in a chat thread to be analyzed by your intelligent agent.
