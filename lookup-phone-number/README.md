---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Manage Phone Numbers

For full instructions on how to build this code sample from scratch, look at [Quickstart: Look Up Phone Numbers](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/number-lookup?pivots=programming-language-javascript)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource).

## Install the package

npm install @azure/communication-phone-numbers@1.3.0-beta.4 --save

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, add connection string to environment variable using below command

setx COMMUNICATION_SERVICES_CONNECTION_STRING <CONNECTION_STRING>

4. Update lines 11 and 18 with the phone number you want to look up.
5.  Decide which lookup you would like to perform, and keep in mind that looking up all the operator details incurs a cost, while looking up only number formatting is free.

> [!WARNING]
> If you want to avoid incurring a charge, comment out lines 18-21

## Run the code

From a console prompt, navigate to the directory containing the number-lookup-quickstart.js file, then execute the following node command to run the app.

node number-lookup-quickstart.js
