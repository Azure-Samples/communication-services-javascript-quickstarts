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
This sample sends an email to the required recipients of any domain using [Email Communication Services resource](https://review.docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/create-email-communication-resource?branch=pr-en-us-192537).
The application is a console based application build using Node.js 14.

Additional documentation for this sample can be found on [Microsoft Docs](https://review.docs.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview?branch=pr-en-us-192537).


## Prerequisites

- [Visual Studio Code (Stable Build)](https://code.visualstudio.com/download)
- [Node.js (~14)](https://nodejs.org/download/release/v14.19.1/)
- Create an Azure account with an active subscription. For details, see [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- Create an Azure Communication Services resource. For details, see [Create an Azure Communication Resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You'll need to record your resource **connection string** for this quickstart.
- Create an [Azure Email Communication Services resource](https://review.docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/create-email-communication-resource?branch=pr-en-us-192537) to start sending emails.

> Note: We can send an email from our own verified domain also [Add custom verified domains to Email Communication Service](https://review.docs.microsoft.com/en-us/azure/communication-services/quickstarts/email/add-custom-verified-domains?branch=pr-en-us-192537).

## Code structure

- ./send-email/src/app.ts: Entry point into the email sample
- ./send-email/src/EmailClient.ts: Where the client code lives
- ./send-email/config.js: Where to put your azure communication services connection string
- ./send-email/data/data_file.json: json file with list of email templates data.

## Before running the sample for the first time

1. Open an instance of PowerShell, Windows Terminal, Command Prompt or equivalent and navigate to the directory that you'd like to clone the sample to.
2. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`

### Locally configuring the application

2. Open the config.js file to configure the following settings
	- `ConnectionString`: Azure Communication Service resource's connection string.


3. Open `data/data_file.json` and add email data in following template:

	```
    [
      {
        "Id": "1",
        "TemplateName": "Single Reciepent with Attchment",
        "Subject": "Test Email for Single Recipient",
        "PlainText": "Test Email from Email Sample\n\n This email is part of testing of email communication service. \\n Best wishes",
        "HTMLText": "<html><head><title>ACS Email as a Service</title></head><body><h1>ACS Email as a Service - Html body</h1>
        <h2>This email is part of testing of email communication service</h2></body></html>",
        "Sender": "Test_Email_Comm@guid.azurecomm.net",
        "Recipients": "alice@contoso.com, Alice",
        "Importance": "High",
        "Attachments": "data//attachment.pdf"
      },
      {
        "Id": "2",
        "TemplateName": "Single Reciepent with multiple Attchments",
        "Subject": "Testing Email for Single Recipient with multiple Attchments",
        "PlainText": "Test Email from Email Sample\n\n This email is part of testing of email communication service. \\n Best wishes",
        "HTMLText": "<html><head><title>ACS Email as a Service</title></head><body><h1>ACS Email as a Service - Html body</h1><h2>This email is part of testing of email communication service</h2></body></html>",
        "Sender": "Test_Email_Comm@.azurecomm.net",
        "Recipients": "alice@contoso.com, Alice",
        "Importance": "High",
        "Attachments": "data//attachment.pdf; data//attachment.txt"
      },
      {
        "Id": "3",
        "TemplateName": "Multiple Recipients with Attachment",
        "Subject": "Testing Email for Multiple Recipients with Attachment",
        "PlainText": "Test Email from Email Sample\n\n This email is part of testing of email communication service. \\n Best wishes",
        "HTMLText": "<html><head><title>ACS Email as a Service Html title</title></head><body><h1>ACS Email as a Service - Html body</h1><h2>This email is part of testing of email communication service</h2></body></html>",
        "Sender": "Test_Email_Comm@.azurecomm.net",
        "Recipients": "alice@contoso.com, Alice; bob@contoso.com, Bob",
        "Importance": "High",
        "Attachments": "data//attachment.pdf"
      }
    ]
	```

4. Email template data:
	- `Id` : Unique Id of an email template.
	- `TemplateName`: To identify the test data.
	- `Subject`: Email subject.
	- `PlainText`: Email content in plain text.
	- `HTMLText`: HTML content if any.
	- `Importance`: Importance of Email as High or Normal. The importance of email is Normal by default.
	- `Attachments`: Provide documents path to send if any.
	- `Recipients`: one or multiple recipients and their display name in following format.
	```
	Format : email-address-1, display-name-1 ; email-address-2, display-name-2
	For e.g. "email-1@gmail.com, email1-name ; email-2@microsoft.com, email2-name"
	```
	- Sender: Sender's email address get it from email communication service resource under provision domain.

### Local run

    - Set your connection string in `config.js`
    - Set your senderAddress string in `data.json`
    - Set your recipientAddress string in `data.json`
    - `npm install` from the root directory
    - `npm start` from the root directory


## ❤️ Feedback
We appreciate your feedback and energy helping us improve our services. [Please let us know if you are satisfied with ACS through this survey](https://microsoft.qualtrics.com/jfe/form/SV_5dtYL81xwHnUVue).
