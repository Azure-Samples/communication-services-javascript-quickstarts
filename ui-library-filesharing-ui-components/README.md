---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---
# UI Library Sample - File Sharing using UI Components

>This Quickstart for FileSharing is not to be confused with the Teams Interopability feature where a ACS user can receive [SharePoint files](https://learn.microsoft.com/microsoft-365/solutions/microsoft-365-limit-sharing?view=o365-worldwide) with proper file permissions shared by a Teams user. This feature is currently available in Public Preview, for more information please refer to [Supplemental Terms of Use for Microsoft Azure Previews.](https://azure.microsoft.com/support/legal/preview-supplemental-terms/)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (14.x.x is recommended).
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- An identity with Chat scope. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).

## Run the code

1. Run `npm install`
2. Follow the steps inside `api/README.md` to configure and start the azure function.
3. Follow the steps inside `app/README.md` to configure and start the react app.
4. Run `npm run start:dev` which starts serving both the azure function and react app through a proxy server. This allows the react app to access the azure function using relative links. It also prevents CORS and HTTPS errors.

The project can then be accessed on `localhost:4280`

## Code organization

* [app/](./app) - This directory contains source code for the React frontend.
  * [app/src/App.tsx](./app/src/App.tsx) - Application entry-point. Built primarily using UI library's [CallComposite](https://azure.github.io/communication-ui-library/?path=/docs/composites-call-basicexample--basic-example). You will need to populate  variables like `userId`, `userAccessToken` etc., in this file.
  * [app/src/ChatComponents.tsx](./app/src/ChatComponents.tsx) - Chat UI built using UI Library components and logic for implementing file sharing.
* [api/](./api) - This directory contains the source code for the backend API (Azure function).
  * [api/UploadFileToAzureBlobStore/index.ts](./api/UploadFileToAzureBlobStore/index.ts) - Azure Function to handle file uploads.

Aditionally, [package.json](./package.json) provides some helper scripts to aid local development, using the developer tooling for [Azure Statid Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/).
