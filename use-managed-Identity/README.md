---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
- azure-communication-sms
---


# Use managed identities Quickstart

For full instructions on how to build this code sample from scratch, look at [Quickstart: Use managed identities](https://docs.microsoft.com/azure/communication-services/quickstarts/managed-identity?pivots=programming-language-javascript)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F). 
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- An SMS enabled telephone number. [Get a phone number](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony-sms/get-phone-number?pivots=programming-language-javascript).
- A setup managed identity for a development environment,see [Authorize access with managed identity](https://docs.microsoft.com/azure/communication-services/quickstarts/managed-identity-from-cli).

## Code Structure

- **./use-managed-Identity/index.js:** Core application code with managed identity implementation.

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. git clone https://github.com/Azure-Samples/Communication-Services-javascript-quickstarts.git
3. With the `endpoint` procured in pre-requisites, add it to the **index.js** file. Assign your endpoint in line 28:
   ```const endpoint = "https://<RESOURCE_NAME>.communication.azure.com/"```
4. With the SMS enabled telephone number procured in pre-requisites, add it to the **index.js** file. Assign your ACS telephone number and sender number in line 38:
   ```const smsResult = await sendSms(endpoint, "<FROM NUMBER>", "<TO NUMBER>", "Hello from Managed Identities");```

## Run Locally

1. Run the app using ```node index.js```
