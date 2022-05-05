# UI Library Sample - File Sharing using UI Chat Composite

This is a complete sample showcasing integration of file sharing feature
into an [Azure Communication Services][docs-root] powered [React] application.

For a step-by-step guide to building this sample yourself, see the associated tutorial at MSDN.

    TODO: Link to tutorial once available.

This sample includes:
* A React based application showcasing file sharing feature using UI chat composite provided by the [Azure Communication Services UI library][docs-ui-library].
* Backend API for uploading file to Azure Blob Storage built using [Typescript Azure Functions][typescript-azure-functions].


[docs-root]: https://docs.microsoft.com/en-us/azure/communication-services/
[docs-ui-library]: https://azure.github.io/communication-ui-library/
[typescript-azure-functions]: https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-typescript
[React]: https://reactjs.org/


## Code organization

* [app/](./app) - This directory contains source code for the React frontend.
  * [app/src/App.tsx](./app/src/App.tsx) - Application entry-point. Built primarily using UI library's [ChatComposite](https://azure.github.io/communication-ui-library/?path=/docs/composites-chat-basicexample--basic-example).
* [api/](./api) - This directory contains the source code for the backend API.
  * [api/UploadFileToAzureBlobStore](./api/UploadFileToAzureBlobStore/index.ts) - Azure Function to upload the file to Azure Blob Store.


### Prerequisites - Azure Resources

You need a few Azure resources before running this sample locally.

* An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
* [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (14.x.x is recommended).
* An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
* An identity with Chat scope. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).
* [Azure Storage Account](https://docs.microsoft.com/en-us/azure/storage/common/storage-account-overview)

### Prerequisites -- Configuration

Once you have these resources setup, you need to replace the placeholders in these two files:

* [api/local.settings.json](./api/local.settings.json)
  * Enter the [connection string for the Azure Storage account](https://docs.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string).
* Enter all the required details in [app/src/App.tsx](./app/src/App.tsx).

### Prerequisites - Developement Environment

Install NPM dependencies

- Install dependencies of Azure Static Web Apps
  `npm install`
- Install dependencies of Azure functions backend
  `cd api && npm install`
- Install dependencies of front-end application
  `cd app && npm install`

### Run the application

You'll need to run the client and server separately:

- Start the front-end application:
  `cd app && npm start`
- Start the azure functions backend:
  `cd api && npm start`
- Start the Static Web Apps proxy:
  `npm run start:dev`


Navigate to your application at `localhost:4280`.

