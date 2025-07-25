
|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Lobbay Call Sample using Call Automation SDK

In this quickstart sample, we cover how you can use the Call Automation SDK to perform lobby calls using Azure Communication Services (ACS) calls. This involves creating and managing several outgoing calls simultaneously and dynamically moving participants between these active calls.

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

1. Open a new Powershell window, cd into the `callautomation-lobbycall-sample` folder and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://localhost:8080/`
3. Follow the steps.


