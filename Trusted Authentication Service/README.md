---
page_type: sample
languages:
- javascript
- nodejs
products:
- azure
- azure-functions
---

# Build a trusted authentication service using Azure Functions

This code sample is meant to be used with Azure Functions, to generate a trusted token provision service. As part of the Azure Communication Services architecture, in order to access communication resources, users or applications require to have an `Access Token`. It is recommended that the token provisioning logic is held in a trusted and secure service rather than directly on the client as a resource critical information is needed to generated tokens.The Azure Function will work as a trusted middleman between the user and the Communication Services

This quickstart sample includes the code that is explained as part of [this document](https://docs.microsoft.com/en-us/azure/communication-services/tutorials/trusted-service-tutorial). See that document for additional details on how this sample works.

## Prerequisites

- An Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- [Visual Studio Code](https://code.visualstudio.com/) on one of the [supported platforms](https://code.visualstudio.com/docs/supporting/requirements#_platforms).
- [Azure Functions Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) for Visual Studio Code
- [Node.js](https://nodejs.org/), Active LTS and Maintenance LTS versions (10.14.1 recommended). Use the `node --version` command to check your version. 
- The [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) for Visual Studio Code. 
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource?tabs=windows&pivots=platform-azp).

## Running Sample Locally

1. Ensure to have the Azure Function Extension on Visual Studio. Click into the tab on the left side menu and initialize the project
2. Open a terminal and navigate to the repository directory
3. Run `cd Trusted Authentication Service` to get in the same directory as the function
4. Run `npm i` which will install the dependencies for the sample
5. In Visual Studio Code, click into the `index.js` file and press `F5`
6. Once it runs successfully, on your browser visit: `http://localhost:7071/api/Function`

## Deploy to Azure

To deploy your Azure Function, you can follow [step by step instructions](https://docs.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-csharp?pivots=programming-language-javascript#sign-in-to-azure)

Generally, you will need to:

1. Sign in to Azure from Visual Studio
2. Publish your project to your Azure account. Here you will need to choose an existing subscription.
3. Create a new Azure Function resource using the Visual Studio wizard or use an existing resource. For a new resource, you will need to configure it to your desired region, runtime and unique identifier.
4. Wait for deployment to finalize
5. Run the function 🎉

## Next steps

- [Add voice calling to your app](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/getting-started-with-calling?pivots=platform-web)
- [Add chat to your app](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/chat/get-started?pivots=programming-language-javascript)
- [Learn about client and server architecture](https://docs.microsoft.com/en-us/azure/communication-services/concepts/client-and-server-architecture)
- [Learn about authentication](https://docs.microsoft.com/en-us/azure/communication-services/concepts/authentication?tabs=csharp) 
