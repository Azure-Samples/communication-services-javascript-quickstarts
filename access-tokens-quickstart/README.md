---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Create and manage access tokens

For full instructions on how to build this code sample from scratch, look at [Quickstart: Create and manage access tokens](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript)

## Prerequisites

- An Azure account with an active subscription. Create an account for free.
- Node.js Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource and connection string. Create a Communication Services resource.

## Install the package

npm install @azure/communication-identity --save
npm install @azure/identity --save

## Before running sample code

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
3. With the Communication Services procured in pre-requisites, add connection string to environment variable using below command

setx COMMUNICATION_SERVICES_ENDPOINT <YOUR_COMMUNICATION_SERVICES_ENDPOINT>

## Run the code

From a console prompt, navigate to the directory containing the issue-access-token.js file, then execute the following node command to run the app.

node ./issue-access-token.js