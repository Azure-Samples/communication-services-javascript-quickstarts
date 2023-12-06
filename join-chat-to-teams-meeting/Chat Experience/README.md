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

This code sample walks through the process to join your chat app to a Teams meeting.

This quickstart sample includes the code that is explained as part of [this document](https://docs.microsoft.com/azure/communication-services/quickstarts/chat/meeting-interop). See that document for additional details on how this sample works.

## Prerequisites

- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- A Working [Communication Services chat web app](https://docs.microsoft.com/azure/communication-services/quickstarts/chat/get-started?pivots=programming-language-javascript).
- A [Teams deployment](https://docs.microsoft.com/deployoffice/teams-install)

## Code Structure

- **./index.html:** to configure a basic layout that will allow the user to join a teams meeting.
- **./client.js:** contain the application logic.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. Run this command
    `npm install`
4. With the Communication Services procured in pre-requisites, fetch connection string and update at line# 26 in client.js ```const connectionString = "<SECRET_CONNECTION_STRING>";```.
5. With the Communication Services procured in pre-requisites, fetch end point and update at line# 27 in client.js ```const endpointUrl = "<ENDPOINT_URL>";```.

## Run the code

Webpack users can use the **webpack-dev-server** to build and run your app. Run the following command to bundle your application host on a local web-server:

`npx webpack && npx webpack-dev-server`

open your browser and navigate to <http://localhost:8080/>. You should see the following:

![Render of sample application](../../media/acs-join-teams-meeting-chat-quickstart.png)
