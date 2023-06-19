---
page_type: sample
languages:
- Typescript
products:
- azure
- azure/communication-call-automation
---

# Call Recording Sample

This is a sample application to showcase how the Call Automation SDK can be used to add recording features to any application.

It's a Node JS based application that connects with Azure Communication Services.

A separate branch with end to end implementation is [available](https://github.com/Azure-Samples/communication-services-web-calling-hero/tree/public-preview).

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/)
- [Visual Studio Code](https://code.visualstudio.com/download) installed
- [Node.js](https://nodejs.org/en/download) 14.17.3 and above installed
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need to record your resource **connection string** for this sample.
- Get a phone number for your new Azure Communication Services resource. For details, see [Get a phone number](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number?tabs=windows&pivots=platform-azp)
- Download and install [Ngrok](https://www.ngrok.com/download). As the sample is run locally, Ngrok will enable the receiving of all the events.
- Generate Ngrok Url by using below steps
	- Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent on the machine using to run the sample.
	- Navigate to directory path where Ngrok.exe file is located.
	- Run ngrok http {portNumber} (For e.g. ngrok http 8080). Port number in Server.ts file and port number used to generate ngrok url must be same.
	- Get Ngrok Url generated. For e.g. "https://95b6-43-230-212-228.ngrok-free.app"
	
**Note** Phone number is required to successfully run this sample.


## Code structure

- ./call-recording/api/controllers/RecordingsController.ts : Server app core logic for calling the Recording APIs using Azure Communication Services callautomation SDK
- ./call-recording/routes/CallRecordingRoutes.ts : Routes of the application APIs
- ./call-recording/Server.ts : Entry point for the server app program logic
- ./call-recording/package.json : Contains dependencies for running and deploying the application

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. git clone https://github.com/moirf/communication-services-javascript-quickstarts.git.
3. Once you get the config keys, add the keys to the **call-recording/Config.ts**  file.
	- Input your ACS connection string in the variable: `ConnectionString`
	- Input recording callback url for start recording api in the variable `CallbackUri`
	- Input your ACS AcquiredPhoneNumber in the variable: `ACSAcquiredPhoneNumber`
	- Input Outbound call TargetPhoneNumber in the variable `TargetPhoneNumber`

4. CallbackUri is public ngrok url generated.

## Locally running the sample app

1. Go to call-recording folder and open terminal window in Visual Studio code
2. Run below commands in the terminal.
	- `npm install -g typescript` 
	- `npm install`
	- `tsc -w` 
3. After all the .ts files are converted to .js files and files can be found under dist folder generated. close the build using command `ctrl + c`
4. Run command `npm run start` in the terminal
5. Port number get displayed on terminal for, successful app run.

# Step by step guid for testing recording APIs via postman.

Once App is running locally,
1. Create webhook (Follow "Create Webhook for Microsoft.Communication.RecordingFileStatus event" section below )
2. Import the postman collection with RecordingAPIs, available in postman_collection.json file. For details, see [Importing and exporting data](https://learning.postman.com/docs/getting-started/importing-and-exporting-data/)
3. Replace imported collection Request urls with, your CallbackUri and API routes.
4. Start a call invoke outboundCall. 
	- Accept the call on Target PSTN Phone number, Keep call running.
5. Send Request to startRecording.
	- Recording would be started.
6. (Optional) pauseRecording and then resumeRecording,getRecordingState.
7. Send Request for stopRecording.
8. Send Request for downloadRecording from server, only last recorded file will be downloaded. Recorded file found under call-recording folder with name Recording_File.wav.
9. Send Request for deleteRecording at server.

## Create Webhook for Microsoft.Communication.RecordingFileStatus event
Call Recording enables you to record multiple calling scenarios available in Azure Communication Services by providing you with a set of APIs to start, stop, pause and resume recording. To learn more about it, see [this guide](https://learn.microsoft.com/en-us/azure/communication-services/concepts/voice-video-calling/call-recording). 
1. Navigate to your Communication Service resource on Azure portal and select `Events` from the left side blade.
2. Click `+ Event Subscription` to create a new subscription, provide `Name` field value. 
3. Under Topic details, choose a System Topic or create new, no changes required if its already have topic name.  
4. Under `Event Types` Filter for `Recording File Status Updated` event. 
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
