---
page_type: sample
languages:
- javascript
Platform:
- Web
products:
- azure
- azure-communication-services
---


# Place interop group calls with ACS and Teams users

For full instructions on how to build this code sample from scratch, look at [Quickstart: Join your calling app to a Teams meeting](https://docs.microsoft.com/azure/communication-services/quickstarts/voice-video-calling/get-started-teams-interop-group-calls?pivots=platform-web)

## Prerequisites

- A Working [Communication Services calling web app](https://docs.microsoft.com/azure/communication-services/quickstarts/voice-video-calling/getting-started-with-calling?pivots=platform-web). 
- A [Teams deployment](https://docs.microsoft.com/deployoffice/teams-install)

## Code Structure

- **./place-interop-group-calls/index.html:** to configure a basic layout that will allow the user to place group call with Teams users.
- **./place-interop-group-calls/client.js:** contain the application logic.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, fetch connection string and update at line# 15 in client.js.

## Run the code
1. Run the command to bundle your application host on a local webserver. `npx webpack serve --config webpack.config.js`
