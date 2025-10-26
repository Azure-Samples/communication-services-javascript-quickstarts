---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---


# Send an SMS Message Quickstart

For full instructions on how to build this code sample from scratch, look at [Quickstart: Send an SMS Message](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/send?pivots=programming-language-javascript)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F). 
- [Visual Studio Code](https://code.visualstudio.com/) on one of the [supported platforms](https://code.visualstudio.com/docs/supporting/requirements#_platforms).
- [Node.js](https://nodejs.org/), Active LTS and Maintenance LTS versions (10.14.1 recommended). Use the `node --version` command to check your version. 
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- An SMS enabled telephone number. [Get a phone number](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/get-phone-number).

## Code Structure

- **./send-SMS/send-sms.js:** Core application code with send SMS implementation.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/Communication-Services-javascript-quickstarts.git`
3. With the `Connection String` procured in pre-requisites, follow [instructions](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource?pivots=#store-your-connection-string) to add it to your environment variables.
4. With the SMS enabled telephone number procured in pre-requisites, add it to the **send-SMS/send-sms.js** file. Assign your telephone number in line 7:
   ```from: "<from-phone-number>",```
5. Add a phone number to send the SMS to in line 8:
   ```to: ["<to-phone-number-1>", "<to-phone-number-2>"],```

## Run Locally

1. Run the app using ```node send-sms.js```
