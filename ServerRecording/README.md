---
page_type: sample
languages:
- Typescript
products:
- azure
- azure-communication-services
---

# Recording APIs Sample

This is a sample application to show how the Azure Communication Services server calling SDK can be used to build a call recording feature.

It's a Node JS based application that connects with Azure Communication Services.

A separate branch with end to end implementation is [available](https://github.com/Azure-Samples/communication-services-web-calling-hero/tree/public-preview).

## Prerequisites

- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node v14.17.*](https://nodejs.org/en/download/) (Make sure to install the version that corresponds with your visual studio code instance, 32 vs 64 bit)
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You'll need to record your resource **connection string** for this quickstart.
- An Azure storage account and container, for details, see [Create a storage account](https://docs.microsoft.com/azure/storage/common/storage-account-create?tabs=azure-portal). You'll need to record your storage **connection string** and **container name** for this quickstart.
- Create a webhook and subscribe to the recording events. For details, see [Create webhook](https://docs.microsoft.com/azure/communication-services/quickstarts/voice-video-calling/download-recording-file-sample)


## Code structure

- ./ServerRecording/api/controllers/CallRecordingController.js : Server app core logic for calling the Recording APIs using Azure Communication Services server calling SDK
- ./ServerRecording/routes/CallRecordingRoutes.ts : Routes of the application Apis
- ./ServerRecording/server.ts : Entry point for the server app program logic
- ./ServerRecording/package.json : Contains dependencies for running and deploying the application

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.
3. Once you get the config keys add the keys to the **ServerRecording/config.ts**  file found under the Main folder.
	- Input your ACS connection string in the variable: `Connectionstring`
	- Input your storage connection string in the variable: `BlobStorageConnectionString`
	- Input blob container name for recorded media in the variable `ContainerName`
	- Input recording callback url for start recording api in the variable `CallbackUri`
	- Input your blob storage account name: `StorageAccountName` ; it can be derived from the `BlobStorageConnectionString`
	- Input your blob storage account key: `StorageAccountKey` ; it can be derived from the `BlobStorageConnectionString`

## Locally running the sample app

1. Go to ServerRecording folder and open terminal window in Visual Studio code
2. Run command `tsc -w` in the terminal. After all the .ts files are converted to .js files, close the build using command `ctrl + c`
3. Run command `npm run start` in the terminal
3. Use postman or any debugging tool and open url -http://localhost:3000/

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
