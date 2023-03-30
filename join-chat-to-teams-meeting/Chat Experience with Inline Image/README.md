---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-common
- azure-communication-chat
- azure-communication-calling
- azure-communication-identity
---

# Join your chat app to a Teams meeting

This code sample demonstrates how you can support Teams inline image interoperability with the Azure Chat SDK for JavaScript  

This sample includes the code that is explained as part of [this tutorial](https://docs.microsoft.com/azure/communication-services/tutorials/chat-interop/meeting-interop-features-inline-image), which includes a step by step explanation on how to enable inline image support. 


## Prerequisites
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- A Working [Communication Services chat web app](https://docs.microsoft.com/azure/communication-services/quickstarts/chat/get-started?pivots=programming-language-javascript). 
- A Teams meeting link that was set up by a Teams business account.
- A clear understanding from previous QuickStart - [Join your chat app to a Teams meeting](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/chat/meeting-interop?pivots=platform-web).
- Chat SDK for JavaScript ([@azure/communication-chat](https://www.npmjs.com/package/@azure/communication-chat)) 1.3.2-beta.1 or latest

## Code Structure

- **./join-chat-to-teams-meeting/index.html:** contains a basic layout that will allow the user to join a teams meeting.
- **./join-chat-to-teams-meeting/client.js:** contain the application logic.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. Run these commands 

    npm install @azure/communication-common --save

    npm install @azure/communication-identity --save

    npm install @azure/communication-signaling --save

    npm install @azure/communication-chat --save

    npm install @azure/communication-calling --save

4. Run this command 
    npm install webpack@4.42.0 webpack-cli@3.3.11 webpack-dev-server@3.10.3 --save-dev
5. With the Communication Services procured in pre-requisites, fetch connection string and update at line# 26 in client.js ```const connectionString = "<SECRET_CONNECTION_STRING>";```.
6. With the Communication Services procured in pre-requisites, fetch end point and update at line# 27 in client.js ```const endpointUrl = "<ENDPOINT_URL>";```.

## Run the code
Webpack users can use the **webpack-dev-server** to build and run your app. Run the following command to bundle your application host on a local webserver:

```
npx webpack-dev-server --entry ./client.js --output bundle.js --debug --devtool inline-source-map
```

open your browser and navigate to http://localhost:8080/. You should see the following:

![Render of sample application with preview image](../media/meeting-interop-features-inline-1.png)
![Render of sample application with full scale image](../media/meeting-interop-features-inline-2.png)