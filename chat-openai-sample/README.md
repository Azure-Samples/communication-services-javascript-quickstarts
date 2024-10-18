|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Chath with Azure OpenAI - Quick Start Sample

This sample application demonstrates how to integrate Azure Communication Services - Chat SDK can be used with Azure OpenAI Service to enable intelligent message analysis. The application listens for user message, processes the text through the Azure OpenAI Service, and generates appropriate analysis. Or optionally developers can replace the logic with their own AI model for message analysis.

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- An Azure OpenAI Resource and Deployed Model. See [instructions](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal).

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `chat-openai-sample` folder.
4. From the root of the above folder, and with node installed, run `npm install`

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the commands below to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and which allows anonymous access. We will then use this endpoint to notify your application of chat events from the ACS Chat service.

```bash
devtunnel create --allow-anonymous
devtunnel port create -p 8080
devtunnel host
```

### Configuring application

Open the `.env` file to configure the following settings

1. `PORT`: Localhost port to run the server app on.
1. `CONNECTION_STRING`: Azure Communication Service resource's connection string.
1. `ACS_URL_ENDPOINT`: Azire Communication Service resource's url endpoint.
1. `AZURE_OPENAI_SERVICE_KEY`: Azure Open AI service key
1. `AZURE_OPENAI_SERVICE_ENDPOINT`: Azure Open AI endpoint
1. `AZURE_OPENAI_DEPLOYMENT_MODEL_NAME`: Azure Open AI deployment name

### Run app locally

1. Open a new Powershell window, cd into the `chat-openai-sample` folder and run `npm run dev`
1. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
1. To test the AI analysis API endpoint on your local machine, in another new Powersehll window for the same directory, run `npm run client` to observe how messages are generated and processed.
1. Register an EventGrid Webhook for the `ChatMessageReceived` Event that points to your DevTunnel URI for `<DevTunnelUri>/api/chatMessageReceived`.

Once that's completed you should have a running application. The best way to test this is to send a message in a chat thread to be analyzed by your intelligent agent.
