# Azure Communication Services application with file sharing

This is a complete sample showcasing integration of [file sharing][file-sharing-quickstart] feature
into an [Azure Communication Services][docs-root] powered [React] application.

For a step-by-step guide to building this sample yourself, see the associated tutorial at MSDN.

    TODO: Link to tutorial once available.

This sample includes:
* A React frontend built using the UI chat composite provided by the [Azure Communication Services UI library][docs-ui-library].
* Backend API for call recording integration built using [Typescript Azure Functions][typesctipt-azure-functions].

[file-sharing-quickstart]:
[docs-root]: https://docs.microsoft.com/en-us/azure/communication-services/
[docs-ui-library]: https://azure.github.io/communication-ui-library/
[typesctipt-azure-functions]: https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-typescript
[React]: https://reactjs.org/


## Code organization

* [app/](./app) - This directory contains source code for the React frontend.
  * [app/src/App.tsx](./app/src/App.tsx) - Application entry-point. Built primarily using UI library's [ChatComposite](https://azure.github.io/communication-ui-library/?path=/docs/composites-chat-basicexample--basic-example).
  * [app/src/Api.ts](./app/src/Api.ts) - client side bindings to interact with the backend API from [api/](./api).
* [api/](./api) - This directory contains the source code for the backend API.
  * [api/UploadFileToAzureBlobStore](./api/UploadFileToAzureBlobStore/index.ts) - Azure Function to upload the file to Azure Blob Store.


### Prerequisites - Azure Resources

You need a few Azure resources before running this sample locally.

* [Azure Communication Services Resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource)
  * Needed to connect to Azure Communication Services backed calls.
* [Azure Storage Account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview)

### Prerequisites -- Configuration

Once you have these resources setup, you need to replace the placeholders in these two files:

* [api/local.settings.json](./api/local.settings.json)
  * Enter the [connection string for the Azure Storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string).
* [app/src/App.tsx](./app/src/App.tsx)
  * [Generate a Azure Communication Service user, token and threadId](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/identity/quick-create-identity) in your Azure Communication Services resource with VOIP scope and enter the details.

### Prerequisites - Developement Environment

Install NPM dependencies

- Install dependencies of Azure functions backend
  `cd api && npm install`
- Install dependencies of front-end application
  `cd app && npm install`

### Run the application

You'll need to run the client and server separately:

- Start the static app server:
  `cd app && npm start`
- Start the azure functions backend:
  `cd api && npm start`


Navigate to your app at `localhost:3000`.

In this case, the Azure Functions will be served at `localhost:7071`. You will need to expose this port publicly to be able to register it as a webhook with EventGrid.
