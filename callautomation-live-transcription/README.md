|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Call Automation - Quick Start Sample

This sample application shows how the Azure Communication Services  - Call Automation SDK can be used generate the live transcription between PSTN calls. 
It accepts an incoming call from a phone number, performs DTMF recognition, and transfer the call to agent. You can see the live transcription in websocket during the conversation between agent and user. The application is a web-based application built on .Net7 framework.

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)
- Create Azure AI Multi Service resource. For details, see [Create an Azure AI Multi service](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account).
- Install ngrok. Instructions [here](https://ngrok.com/)
- Setup websocket

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `callautomation-live-transcription` folder.
4. From the root of the above folder, and with node installed, run `npm install`


### Add a Managed Identity to the ACS Resource that connects to the Cognitive Services Resource

Follow the instructions in the [documentation](https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/azure-communication-services-azure-cognitive-services-integration).

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the commands below to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and which allows anonymous access. We will then use this endpoint to notify your application of calling events from the ACS Call Automation service.

```bash
devtunnel create --allow-anonymous
devtunnel port create -p 8080
devtunnel host
```

### Configuring application

Open the `.env` file to configure the following settings

1. `CALLBACK_HOST_URI`:  Base url of the app. (For local development replace the above ngrok url from the above for the port 8080).
1. `COGNITIVE_SERVICE_ENDPOINT`: Azure Multi Service endpoint.
1. `ACS_CONNECTION_STRING`: Azure Communication Service resource's connection string.
2. `ACS_PHONE_NUMBER`: Phone number associated with the Azure Communication Service resource. For e.g. "+1425XXXAAAA"
3. `TRANSPORT_URL`: Ngrok url for the server port (in this example port 5001) make sure to replace https:// with wss://
3. `LOCALE`: Transcription locale
4. `AGENT_PHONE_NUMBER`: Phone number associated to with Agent

### Run app locally

1. Open a new Powershell window, cd into the `callautomation-az-openai-voice` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
3. Register an EventGrid Webhook for the IncomingCall Event that points to your DevTunnel URI endpoint ex `{CALLBACK_HOST_URI}/api/incomingCall` and register Recording File Status Updated event to you recordingstatus api endpoint ex. `{CALLBACK_HOST_URI}/api/recordingFileStatus`. Instructions [here](https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/incoming-call-notification).

Once that's completed you should have a running application. The best way to test this is to place a call to your ACS phone number and talk to your intelligent agent.
