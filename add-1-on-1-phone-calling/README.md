---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Add 1 on 1 phone calling to your application

This code sample walks through the process of integration Azure Communication Services phone calling into your Javascript application.

This quickstart sample includes the code that is explained as part of [this document](https://docs.microsoft.com/azure/communication-services/quickstarts/voice-video-calling/pstn-call?pivots=platform-web). See that document for additional details on how this sample works.

## Prerequisites
- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1).
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- A user access token to instantiate the call client. [Learn how to create and manage user access tokens](https://docs.microsoft.com/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript).
- A phone number acquired in your Communication Services resource. [how to get a phone number](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/get-phone-number?pivots=programming-language-javascript).

## Before running sample code

1. Pass the User Access Token with VOIP scope type in **Client.js** file at line no 13 ```const tokenCredential = new AzureCommunicationTokenCredential('<USER ACCESS TOKEN with PSTN scope>');```.
2. With the Call enabled telephone number procured in pre-requisites, add it to the **Client.js** file. Assign your ACS telephone number at line no 24
   ```call = callAgent.startCall([{phoneNumber: phoneToCall}], { alternateCallerId: {phoneNumber: 'ACS Number'}});```.

## Run the code
1. Run `npm i` on the directory of the project to install dependencies
2. Use the webpack-dev-server to build and run your app. Run the following command to bundle application host in on a local webserver:

        npx webpack-dev-server --entry ./client.js --output bundle.js --debug --devtool inline-source-map

Open your browser and navigate to http://localhost:8080/. You should see the following:

![Render of sample application](../media/add-1-on-1-phone-calling.png)

You can make an 1:1 outgoing phone call by providing a phone number in the text field and clicking the Start Call button. 
