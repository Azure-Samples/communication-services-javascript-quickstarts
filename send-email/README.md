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
This sample sends an email to the selected recipients of any domain using an [Email Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/email/create-email-communication-resource).
This is a console application built using Node.js 14.

Additional documentation for this sample can be found on [Microsoft Docs](https://docs.microsoft.com/azure/communication-services/concepts/email/email-overview).

## Prerequisites

- [Node.js (~14)](https://nodejs.org/download/release/v14.19.1/).
- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- An Azure Email Communication Services resource created and ready with a provisioned domain. [Get started with creating an Email Communication Resource](../create-email-communication-resource.md).
- An active Azure Communication Services resource connected to an Email Domain and its connection string. [Get started by connecting an Email Communication Resource with a Azure Communication Resource](../connect-email-communication-resource.md).

> Note: We can also send an email from our own verified domain. [Add custom verified domains to Email Communication Service](https://docs.microsoft.com/azure/communication-services/quickstarts/email/add-custom-verified-domains).

### Prerequisite check

- To view the domains verified with your Email Communication Services resource, sign in to the [Azure portal](https://portal.azure.com/). Locate your Email Communication Services resource and open the **Provision domains** tab from the left navigation pane.

## Code structure

- ./send-email/package.json: Package file
- ./send-email/send-email.js: Entry point into the email sample

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent program and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`

### Locally configuring the application

Open the send-email.js file to configure the following settings:

- `connectionString`: Replace `<ACS_CONNECTION_STRING>` with the connection string found within the 'Keys' blade of the Azure Communication Service resource.
- `senderAddress`: Replace `<SENDER_EMAIL_ADDRESS>` with the sender email address obtained from the linked domain resource.
- `recipientAddress`: Replace `<RECIPIENT_EMAIL_ADDRESS>` with the recipient email address.

### Local run

- `npm install` from the root directory.
- `npm start` from the root directory.

## ❤️ Feedback

We appreciate your feedback and energy in helping us improve our services. [Please let us know if you are satisfied with ACS through this survey](https://microsoft.qualtrics.com/jfe/form/SV_5dtYL81xwHnUVue).
