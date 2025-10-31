
|page_type|languages|products|
|---|---|---|
|sample|<table><tr><td>Typescript</td></tr></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Azure Communication Services Call Automation Outbound Calling Sample

This sample demonstrates how to use the Azure Communication Services (ACS) Call Automation SDK to place outbound phone calls, play dynamic prompts using Azure AI Text-to-Speech, and recognize user voice input with Speech-to-Text. The app is designed for easy local development and secure public callback support, with clear guidance for HTTPS tunneling and production deployment.

# Design

![design](./data/OutboundCallDesign.png)

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)
- Create Azure AI Multi Service resource. For details, see [Create an Azure AI Multi service](https://learn.microsoft.com/azure/cognitive-services/cognitive-services-apis-create-account).
- (Optional) A Microsoft Teams user with a phone license that is `voice` enabled. Teams phone license is required to add Teams users to the call. Learn more about Teams licenses [here](https://www.microsoft.com/microsoft-teams/compare-microsoft-teams-bundle-options).  Learn about enabling phone system with `voice` [here](https://learn.microsoft.com/microsoftteams/setting-up-your-phone-system).   You also need to complete the prerequisite step [Authorization for your Azure Communication Services Resource](https://learn.microsoft.com/azure/communication-services/how-tos/call-automation/teams-interop-call-automation?pivots=programming-language-javascript#step-1-authorization-for-your-azure-communication-services-resource-to-enable-calling-to-microsoft-teams-users) to enable calling to Microsoft Teams users.

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `CallAutomation_OutboundCalling` folder.
4. From the root of the above folder, and with node installed, run `npm install`

### Setup and host your Azure DevTunnel

[Azure DevTunnels](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started?tabs=windows) is an Azure service that enables you to share local web services hosted on the internet. Use the commands below to connect your local development environment to the public internet. This creates a tunnel with a persistent endpoint URL and which allows anonymous access. We will then use this endpoint to notify your application of calling events from the ACS Call Automation service.

```bash
# Install Dev Tunnel CLI (if not already installed)
npm install -g @dev-tunnels/cli

# Sign in to your Azure account
devtunnel user login

# Create a tunnel (anonymous access is OK for dev)
devtunnel create --allow-anonymous

# Forward local port 8080 (or your app port)
devtunnel port create -p 8080

# Start hosting the tunnel
devtunnel host
```

The CLI will display a public HTTPS URL (e.g. `https://<random>.dev.tunnels.ms`). Use this as your `CALLBACK_URI` in `.env`.

**Tip:** You can also use the provided PowerShell script `scripts/start-ngrok-dev.ps1` for ngrok-based tunneling and automatic `.env` updates.

### Configuring application

Open the `.env` file to configure the following settings

1. `CONNECTION_STRING`: Azure Communication Service resource's connection string.
2. `ACS_RESOURCE_PHONE_NUMBER`: Phone number associated with the Azure Communication Service resource. For e.g. "+1425XXXAAAA"
3. `TARGET_PHONE_NUMBER`: Target phone number to add in the call. For e.g. "+1425XXXAAAA"
4. `CALLBACK_URI`: Base url of the app. (For local development replace the dev tunnel url)
5. `COGNITIVE_SERVICES_ENDPOINT` : Cognitive Service endpoint
6. `TARGET_TEAMS_USER_ID`: (Optional) update field with the Microsoft Teams user Id you would like to add to the call. See [Use Graph API to get Teams user Id](https://learn.microsoft.com/azure/communication-services/how-tos/call-automation/teams-interop-call-automation?pivots=programming-language-javascript#step-2-use-the-graph-api-to-get-microsoft-entra-object-id-for-teams-users-and-optionally-check-their-presence).  Uncomment the following code snippet from `app.ts` file:

```typescript
await acsClient.getCallConnection(callConnectionId).addParticipant({
    targetParticipant: { microsoftTeamsUserId: TARGET_TEAMS_USER_ID },
    sourceDisplayName: "Jack (Contoso Tech Support)"
});
```

### Run app locally

1. Open a new Powershell window, cd into the `CallAutomation_OutboundCalling` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
3. To initiate the call, click on the `Place a call!` button or make a Http get request to https://<CALLBACK_URI>/outboundCall

![design](./data/Webpage.png)
