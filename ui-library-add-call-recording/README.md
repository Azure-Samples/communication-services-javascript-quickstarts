# Azure Communication Services application with call recording

This is a complete sample showcasing integration of [call recording][call-recording-quickstart] ability
into an [Azure Communication Services][docs-root] powered [React] application.

This sample includes:

* A React frontend built using the UI composites provided by the [Azure Communication Services UI library][docs-ui-library].
* Backend API for call recording integration built using [C# class library Azure Functions][dotnet-azure-functions].

[call-recording-quickstart]: https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/call-recording-sample?pivots=programming-language-csharp
[docs-root]: https://docs.microsoft.com/en-us/azure/communication-services/
[docs-ui-library]: https://azure.github.io/communication-ui-library/
[dotnet-azure-functions]: https://docs.microsoft.com/en-us/azure/azure-functions/functions-dotnet-class-library
[React]: https://reactjs.org/

## Code organization

* [app/](./app) - This directory contains source code for the React frontend.
  * [app/src/App.tsx](./app/src/App.tsx) - Application entry-point. Built primarily using UI library's [CallComposite](https://azure.github.io/communication-ui-library/?path=/docs/composites-call-basicexample--basic-example).
  * [app/src/RecordingButton.tsx](./app/src/RecordingButton.tsx) - A custom button for starting and stopping recording, injected into the CallComposite.
  * [app/src/RecordingList.tsx](./app/src/RecordingList.tsx) - A simple React component to list recordings as they become available.
  * [app/src/Api.ts](./app/src/Api.ts) - client side bindings to interact with the backend API from [api/](./api).
* [api/](./api) - This directory contains the source code for the backend API.
  * [api/startRecording.cs](./api/startRecording.cs) - Azure Function to start recording an ongoing call.
  * [api/stopRecording.cs](./api/stopRecording.cs) - Azure Function to stop recording an ongoing call.
  * [api/onRecordingFileStatusUpdated.cs](./api/onRecordingFileStatusUpdated.cs) - Azure Function used as a webhook to process recordings that become available, copying them from temporary storage in Azure Communication Services to [Azure Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/).
  * [api/listRecordings.cs](./api/listRecordings) - Azure Function to list recordings transferred to Azure Blob Storage.

Aditionally, [package.json](./package.json) provides some helper scripts to aid local development, using the developer tooling for [Azure Statid Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/).

## Local development

### Prerequisites - Azure Resources

You need a few Azure resources before running this sample locally.

* [Azure Communication Services Resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource)
  * Needed to connect to Azure Communication Services backed calls.
  * Needed to access the call recording API
* [Azure Storage Account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview)
  * Needed to transfer the finished recordings to permanent storage. [Create a Blob Storage Container](https://docs.microsoft.com/en-us/azure/storage/blobs/blob-containers-cli) for this purpose.

Finally, you need to create an EventGrid subscription to be notified when recordings become available for download.

* Add a subscription for the [Microsoft.Communication.RecordingFileStatusUpdated event](https://docs.microsoft.com/en-us/azure/event-grid/communication-services-voice-video-events) in the Azure Communication Services resource you created.
  * For local development, you will use a webhook handler, setting the URL to a publicly available endpoint for the Azure Functions you will run below (e.g. `https://<url>/api/onRecordingFileStatusUpdated`). This requires the endpoint from your local development machine to be publicly exposed. There are a many ways to do this, e.g. using [ngrok](https://ngrok.com/). [GitHub Codespaces](https://github.com/features/codespaces) natively support exposing local ports publicly.

### Prerequisites -- Configuration

Once you have these resources setup, you need to update a couple files with authentication secrets.

* [api/local.settings.json](./api/local.settings.json)
  * Enter the [connection string for the Azure Communication Service resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource?tabs=windows&pivots=platform-azp#access-your-connection-strings-and-service-endpoints).
  * Enter the [connection string for the Azure Storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string).
  * Enter the name of the Blob Storage container you created.
* [app/src/Secrets.ts](./app/src/Secrets.ts)
  * [Generate a Azure Communication Service user and token](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/identity/quick-create-identity) in your Azure Communication Services resource with VOIP scope and enter the details.

### Prerequisites - Developement Environment

This sample uses the [local development server for Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/local-development).

Install the local development server by running

```sh
npm install -g azure-functions-core-tools
```

Install NPM dependencies

* Install dependencies of Azure Static Web Apps

  ```sh
  npm install
  ```

* Install dependencies of front-end application

  ```sh
  cd app && npm install
  ```

### Run (or jog, if that's your style)

The setup allows you to debug each service separately, but requires some orchestration. You'll need three terminals:

* Start the azure functions backend:
  `cd api && func start`
* Start the static app server:
  `cd app && npm start`
* Start the Static Web Apps proxy (this assumes that default ports were used to run the servers in the previous steps):
  `npm run start:dev`

In either case, navigate to your app at `localhost:4280`.

In this case, the Azure Functions will be served at `localhost:7071`. You will need to expose this port publicly to be able to register it as a webhook with EventGrid.
