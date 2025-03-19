---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Rooms Quickstart

This code sample walks through the process of integration Azure Communication Services real time Rooms into your JavaScript application.

This quickstart sample includes the code that is explained as part of [this document](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/rooms/get-started-rooms?pivots=programming-language-javascript). See that document for additional details on how this sample works.

## Prerequisites
- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1)
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, add connection string to 'client.js'

## Run the code
npm run start

Open your browser and navigate to http://localhost:8080/. You should see the following:

In the developer tools console within your browser you should see console info log statements from 'client.js' for various rooms operations such as Created Room and Added Participants. 



