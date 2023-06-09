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
- Download and install Ngrok. As the sample is run locally, Ngrok will enable the receiving of all the events.
- Generate Ngrok Url by using below steps
	- Open command prompt or powershell window on the machine using to run the sample.
	- Navigate to directory path where Ngrok.exe file is located. Then, run:
	- ngrok http {portNumber} (For e.g. ngrok http 8080)
	- Get Ngrok Url generated. Ngrok Url will be in the form of e.g. "https://95b6-43-230-212-228.ngrok-free.app"
	
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
4. CallbackUri is public ngrok url generated for tunneling.

## Locally running the sample app

1. Go to call-recording folder and open terminal window in Visual Studio code
2. Run command `tsc -w` in the terminal. After all the .ts files are converted to .js files and files can be found under dist folder generated, close the build using command `ctrl + c`
3. Run command `npm run start` in the terminal
4. Use postman or any debugging tool and open url -http://localhost:{port}/

# Step by step guid for testing recording APIs via postman.

Once App is running locally,
1. Create webhook (Follow "Create Webhook for Microsoft.Communication.RecordingFileStatus event" section below )
2. Import the postman collection with RecordingAPIs.postman_collection.json file. For details, see [Importing and exporting data](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/)
3. Replace imported collection Request urls with, your CallbackUri.
4. Start a call invoke outboundCall. 
	- Accept the call on Target PSTN Phone number, Keep call running.
5. Send Request to startRecording.
	- Recording would be started.
6. (Optional) pauseRecording and then resumeRecording,getRecordingState.
7. Send Request for stopRecording.
8. Send Request for downloadRecording from server, only last recorded file will be downloaded.
9. Send Request for deleteRecording at server.

## Create Webhook for Microsoft.Communication.RecordingFileStatus event
Call Recording enables you to record multiple calling scenarios available in Azure Communication Services by providing you with a set of APIs to start, stop, pause and resume recording. To learn more about it, see [this guide](https://learn.microsoft.com/en-us/azure/communication-services/concepts/voice-video-calling/call-recording). 
1. Navigate to your Communication Service resource on Azure portal and select `Events` from the left side blade.
2. Click `+ Event Subscription` to create a new subscription, provide `Name` field value. 
3. Under Topic details, choose a System Topic or create new, no changes required if its already have topic name.  
4. Under `Event Types` Filter for `Recording File Status Updated(Preview)` event. 
5. Choose `Endpoint Type` as `Web Hook` and provide the public url generated by Ngrok. It would look like `https://2c0a-49-207-209-111.ngrok-free.app/recordingFileStatus`.  
6. Click `Create` to complete the event grid subscription. The subscription is ready when the provisioning status is marked as succeeded.  
**Note:** Application should be running to able to create the `Web Hook` successfully. 

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
