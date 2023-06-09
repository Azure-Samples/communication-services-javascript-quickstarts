---
page_type: sample
languages:
- Typescript
products:
- azure
- azure/communication-call-automation
---

# Recording APIs Sample

This is a sample application to showcase how the Call Automation SDK can be used to add recording features to any application.

It's a Node JS based application that connects with Azure Communication Services.

A separate branch with end to end implementation is [available](https://github.com/Azure-Samples/communication-services-web-calling-hero/tree/public-preview).

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=platform-azp)
**Note** Phone number is required to successfully run this sample.


## Code structure

- ./ServerRecording/api/controllers/RecordingsController.js : Server app core logic for calling the Recording APIs using Azure Communication Services callautomation SDK
- ./ServerRecording/routes/CallRecordingRoutes.ts : Routes of the application APIs
- ./ServerRecording/server.ts : Entry point for the server app program logic
- ./ServerRecording/package.json : Contains dependencies for running and deploying the application

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.
3. Once you get the config keys add the keys to the **ServerRecording/config.ts**  file found under the Main folder.
	- Input your ACS connection string in the variable: `Connectionstring`
	- Input your ACS AcquiredPhoneNumber in the variable: `ACSAcquiredPhoneNumber`
	- Input Outbound call TargetPhoneNumber in the variable `TargetPhoneNumber`
	- Input recording callback url for start recording api in the variable `CallbackUri`
4. CallbackUri is your devtunnel url or ngrok url for tunneling.

## Locally running the sample app

1. Go to call-recording folder and open terminal window in Visual Studio code
2. Run command `tsc -w` in the terminal. After all the .ts files are converted to .js files, close the build using command `ctrl + c`
3. Run command `npm run start` in the terminal
4. Use postman or any debugging tool and open url -http://localhost:{port}/

# Step by step guid for testing recording APIs via postman.

Once App is running local,
1. Step 1. Start a call invoke OutboundCall using postman. 
	- Send HttpGet request with url -{CallbackUri}/outboundCall.
	- Accept the call on Target PSTN Phone number, Keep call running.
2. Step 2. Start Recording.
	- Send HttpGet request with url -{CallbackUri}/startRecording.
	- Recording would be started.
3. Step 3. (Optional) pauseRecording and then resumeRecording,getRecordingState.
4. Step 4. Send  HttpDelete Request for stop the recording with  url -{CallbackUri}/stopRecording.
5. Step 5. Send  HttpGet Request for downloading the recording from server with url -{CallbackUri}/downloadRecording, only last recorded file will be downloaded.
6. Step 6. Send  HttpDelete Request for delete the recording at server with url -{CallbackUri}/deleteRecording.
## Deploying the sample app on Azure

- Follow this to create azure resource group - [Create an Azure resource group](https://docs.microsoft.com/azure/azure-resource-manager/management/manage-resource-groups-portal)

- Follow the steps mentioned in the [Microsoft documentation](https://docs.microsoft.com/azure/developer/javascript/how-to/deploy-web-app)
to deploy the application to Azure.

- After successful deployment, we get the url of the application.


### Troubleshooting

1. Solution doesn't build, it throws errors during build

	- Check if the azure SDK is installed.
	- Check if all the dependencies are installed as mentioned in package.json file
	- Check if using correct command to run the sample.


**Note**: While you may use http://localhost for local testing, Some of the features will work only after deployment on Azure.

## Additional Reading

- [Azure Communication Calling SDK](https://docs.microsoft.com/azure/communication-services/concepts/voice-video-calling/calling-sdk-features) - To learn more about the Calling Web SDK
