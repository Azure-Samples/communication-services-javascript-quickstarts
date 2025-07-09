---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---


# Direct Routing Configuration

To build this code sample from scratch, see [Configure voice routing programmatically](https://docs.microsoft.com/azure/communication-services/quickstarts/telephony/voice-routing-sdk-config?pivots=programming-language-javascript).

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).

## Install the package

`npm install @azure/communication-phone-numbers@1.2.0-alpha.20230214.1 --save`

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory where you want to clone the sample.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. Note your resource name and the connection string generated when you created a Communication Services resource during prerequisites. Replace variables with the appropriate values on line 4 of the *./direct-routing-quickstart* file.

   ```javascript
   const connectionString = "endpoint=https://<RESOURCE_NAME>.communication.azure.com/;accesskey=<ACCESS_KEY>";
   ```
4. Save and close the file.

## Run the code

From a console prompt, navigate to the directory containing the *direct-routing-quickstart.js* file. Use the following node command to run the app.

```console
node direct-routing-quickstart.js
```
