---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---


# Direct Routing Configuration

For full instructions on how to build this code sample from scratch, look at [Quickstart: Direct Routing](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/voice-routing-sdk-config?pivots=programming-language-javascript)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).

## Install the package

npm install @azure/communication-phone-numbers --save

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, add connection string to environment variable using below command
With the `Connection String` procured in pre-requisites, add it to the *./direct-routing-quickstart* file. Assign your connection string in line 4:

```javascript
const connectionString = "endpoint=https://<RESOURCE_NAME>.communication.azure.com/;accesskey=<ACCESS_KEY>";
```

## Run the code

From a console prompt, navigate to the directory containing the *direct-routing-quickstart.js* file, then execute the following node command to run the app.

```console
node direct-routing-quickstart.js
```