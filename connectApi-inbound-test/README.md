|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Call Automation - Quick Start Sample

This sample application shows how the Azure Communication Services  - Call Automation SDK can be used accept incoming call and record it with pause on start feature. It can start, pause, resume and stop recording.
Adds microsoft teams user as participant in active call.

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)
- Create Azure AI Multi Service resource. For details, see [Create an Azure AI Multi service](https://learn.microsoft.com/en-us/azure/cognitive-services/cognitive-services-apis-create-account).
- Install ngrok. Instructions [here](https://ngrok.com/)

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `incoming_call_recording` folder.
4. From the root of the above folder, and with node installed, run `npm install`

### Setup and host ngrok

You can run multiple tunnels on ngrok by changing ngrok.yml file as follows:

1. Open the ngrok.yml file from a powershell using the command ngrok config edit
2. Update the ngrok.yml file as follows:
    authtoken: xxxxxxxxxxxxxxxxxxxxxxxxxx
    version: "2"
    region: us
    tunnels:
    first:
        addr: 8080
        proto: http 
        host_header: localhost:8080
    second:
        proto: http
        addr: 5001
        host_header: localhost:5001
NOTE: Make sure the "addr:" field has only the port number, not the localhost url.
3. Start all ngrok tunnels configured using the following command on a powershell - ngrok start --all

### Add a Managed Identity to the ACS Resource that connects to the Cognitive Services Resource

Follow the instructions in the [documentation](https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/azure-communication-services-azure-cognitive-services-integration).

### Configuring application

Open the `.env` file to configure the following settings

1. `CALLBACK_HOST_URI`:  Base url of the app. (For local development replace the above ngrok url from the above for the port 8080).
2. `COGNITIVE_SERVICE_ENDPOINT`: Azure Multi Service endpoint.
3. `ACS_CONNECTION_STRING`: Azure Communication Service resource's connection string.
4. `COMMUNICATION_USR_ID` : Communication user id.
5. `PAUSE_ON_START` : Pause on start attribute for recording either true or false.
6. `TEAMS_USER_ID` : Microsoft teams user AAD object id.

### Run app locally

1. Open a new Powershell window, cd into the `incoming_call_recording` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
3. Register an EventGrid Webhook for the IncomingCall Event that points to your DevTunnel URI endpoint ex `{CALLBACK_HOST_URI}/api/incomingCall` and register Recording File Status Updated event to you recordingstatus api endpoint ex. `{CALLBACK_HOST_URI}/api/recordingFileStatus`. Instructions [here](https://learn.microsoft.com/en-us/azure/communication-services/concepts/call-automation/incoming-call-notification).
4. Create call, Download recording and metadata from browser.