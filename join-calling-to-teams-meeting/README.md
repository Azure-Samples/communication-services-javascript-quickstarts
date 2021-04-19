---
page_type: sample
Platform:
- Web
products:
- azure
- azure-communication-services
---


# Add Chat to your Application

For full instructions on how to build this code sample from scratch, look at [Quickstart: Join your calling app to a Teams meeting](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/get-started-teams-interop?pivots=platform-web)

## Prerequisites

- A Working [Communication Services calling web app](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/getting-started-with-calling?pivots=platform-web). 
- A [Teams deployment](https://docs.microsoft.com/en-us/deployoffice/teams-install)

## Code Structure

- **./join-calling-to-teams-meeting/index.html:** to configure a basic layout that will allow the user to join a teams meeting.
- **./join-calling-to-teams-meeting/client.js:** contain the application logic.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, fetch connection string and update at line# 15 in client.js.

## Run the code
1. Run the command to bundle your application host on a local webserver. `npx webpack-dev-server --entry ./client.js --output bundle.js --debug --devtool inline-source-map`
