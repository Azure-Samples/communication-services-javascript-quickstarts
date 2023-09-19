---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Add 1 on 1 voice calling to your application

This code sample walks through the process of integration Azure Communication Services voice calling into your JavaScript application.

This quickstart sample includes the code that is explained as part of [this document](https://docs.microsoft.com/azure/communication-services/quickstarts/voice-video-calling/getting-started-with-calling?pivots=platform-web). See that document for additional details on how this sample works.

## Prerequisites
- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- You need to have [Node.js 18](https://nodejs.org/dist/v18.18.0/). You can use the msi installer to install it.
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- A User Access Token to instantiate the call client. [Learn how to create and manage user access tokens](https://docs.microsoft.com/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript).

## Run the code
1. Run `npm i` on the directory of the project to install dependencies
2. Use the webpack serve command to build and run the app on a local server:
`npx webpack serve --config webpack.config.js`
3. Once the local server starts up, open your browser and navigate to http://localhost:8080/. You'll see the calling application:
![Render of sample application](../media/1-on-1-voice-calling.png)
To make an 1:1 outgoing video call, first provide user access token to initiate the call agent, then provide a ACS user ID in the text field and clicking the Start Call button. When the callee answers the call, call will be connected and youll hear each other

