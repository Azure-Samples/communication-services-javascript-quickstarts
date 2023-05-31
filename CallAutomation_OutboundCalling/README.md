|page_type|languages|products
|---|---|---|
|sample|<table><tr><td>Typescript</tr></td></table>|<table><tr><td>azure</td><td>azure-communication-services</td></tr></table>|

# Call Automation - Quick Start Sample

This sample application shows how the Azure Communication Services  - Call Automation SDK can be used to build IVR related solutions. 
It makes an outbound call to a phone number, performs DTMF recognition, plays a different audio message based on the key pressed by the callee and hangs-up the call. 
This sample application configured for accepting tone 1 (tone1), 2 (tone2) , If the callee pressed any other key than expected, the call will be disconnected.
This sample application is also capable of making multiple concurrent outbound calls. The application is a web-based application built on Express.js framework.

# Design

![design](./data/OutboundCallDesign.png)

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio (2022 v17.4.0 and above)](https://visualstudio.microsoft.com/vs/)
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=programming-language-csharp)
- Enable Visual studio dev tunneling for local development. For details, see [Enable dev tunnel] (https://learn.microsoft.com/en-us/connectors/custom-connectors/port-tunneling)
	- To enable dev tunneling, Click `Tools` -> `Options` in Visual Studio 2022
	- In the search bar type tunnel, Click the checkbox under `Environment` -> `Preview Features` called `Enable dev tunnels for Web Application`
	- ![EnableDevTunnel](./data/EnableDevTunnel.png) 
	- Login into your account under `Dev Tunnels` -> `General`
	- ![LogInDevTunnel](./data/AddAccountForTunnel.png) 

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you would like to clone the sample to.
2. git clone `https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.
3. cd into the `CallAutomation_OutboundCalling` folder.
4. From the root of the above folder, and with node installed, run `npm install`

### Configuring application

Open the `.env` file to configure the following settings

1. `CONNECTION_STRING`: Azure Communication Service resource's connection string.
2. `ACS_RESOURCE_PHONE_NUMBER`: Phone number associated with the Azure Communication Service resource. For e.g. "+1425XXXAAAA"
3. `TARGET_PHONE_NUMBER`: Target phone number to add in the call. For e.g. "+1425XXXAAAA"
4. `CALLBACK_URI`: Base url of the app. (For local development replace the dev tunnel url)
5. `MEDIA_CALLBACK_URI`: Url where audio file is served.

### Run app locally

1. Open a new Powershell window, and run `npm run dev`
2. Browser should pop up with the below page. If not navigate it to `http://http://localhost:<PORT>/`
3. To initiate the call, click on the `Place a call!` button

![design](./data/Webpage.png)