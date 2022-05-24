---
page_type: sample
languages:
- javascript
- nodejs
products:
- azure
- azure-communication-services
---


# Email Sample

## Overview

This is a sample email application to show how we can use the `@azure/communication-email` package to build an email experience.
This sample sends an email to the required recipients of any domain using [Email Communication Services resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/create-email-communication-resource).
The application is a console based application build using Node.js 14.

Additional documentation for this sample can be found on [Microsoft Docs](https://docs.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview).


## Prerequisites

- [Visual Studio Code (Stable Build)](https://code.visualstudio.com/download)
- [Node.js (~14)](https://nodejs.org/download/release/v14.19.1/)
- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You'll need to record your resource **connection string** for this quickstart.
- Create an [Azure Email Communication Services resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/create-email-communication-resource) to start sending emails.

> Note: We can send an email from our own verified domain also [Add custom verified domains to Email Communication Service](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/add-custom-verified-domains).


## Code structure

- ./send-email/package.json: Package file
- ./send-email/send-email.js: Entry point into the email sample

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`

### Locally configuring the application

3. Open the send-email.js file to configure the following settings
  - `connectionstring`: Replace `<ACS_CONNECTION_STRING>` with Azure Communication Service resource's connection string.
  - `sender`: Replace `<SENDER_EMAIL>` with sender email obtained from Azure Communication Service.
  - `Line 13 - <RECIPIENT_EMAIL>`: Replace with recipient email.
  - `emailContent`: Either use PlainText or Html to set the email content.

### Local run

    - `npm install` from the root directory
    - `npm start` from the root directory


## ❤️ Feedback
We appreciate your feedback and energy helping us improve our services. [Please let us know if you are satisfied with ACS through this survey](https://microsoft.qualtrics.com/jfe/form/SV_5dtYL81xwHnUVue).
