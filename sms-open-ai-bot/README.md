---
page_type: sample
languages:
- javascript
- nodejs
products:
- azure
- azure-functions
- azure-communication-services
---

# Build a conversation SMS bot with Azure OpenAI

It is no secret that Large Language Models (LLM) like Chat GPT have been all the rage in the last couple of months. These conversational models offer seamless and intuitive interfaces for users to interact with, enabling them to easily ask questions or carry out tasks.  The Azure Communication Services team strives to provide developers with the tools to integrate these conversational entities with communication channels, and delight end users with exceptional support. In this blog we will show you how to use Azure Communication Services SMS capability and Azure OpenAI’s GPT model to light up a personalized end user interaction scenario.

## Pre-requisites

- An Azure account with an active subscription. [Create](https://aka.ms/acs-sms-open-ai-create-azure) an account for free .
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://aka.ms/acs-sms-open-ai-create-resource).
- An SMS-enabled telephone number. [Get a phone number](https://aka.ms/acs-sms-open-ai-get-number).
- Enable Event Grid resource provided on your subscription. [See instructions](https://aka.ms/acs-sms-open-ai-event-sub).
- Create an Azure OpenAI resource. See [instructions](https://aka.ms/acs-sms-open-ai-create-open).  
- Deploy an Azure OpenAI model. See [instructions](https://aka.ms/acs-sms-open-ai-deploy-model).

This application leverages [Azure Event Grid](https://learn.microsoft.com/azure/event-grid/) to listen for incoming text messages to Azure Communication Services number and an [Azure Function](https://learn.microsoft.com/azure/azure-functions/) to process the event and respond with an Azure OpenAI generated response.

## Run locally

1. Ensure to have the Azure Function Extension on Visual Studio. Click into the tab on the left side menu and initialize the project
2. Open a terminal and navigate to the repository directory
3. Run `cd sms-open-ai-bot` to get in the same directory as the function
4. Run `npm i` which will install the dependencies for the sample
5. Update the values in the code to add your Azure Communication Services connection string and Azure OpenAI endpoint (url), model deployment name and key.
6. In Visual Studio Code, click into the `index.ts` file and press `F5`. (Alternatively run `func host start` within the functions directory)

We use [ngrok](https://ngrok.com/) to hook our locally running Azure Function with Azure Event Grid. You will need to [download ngrok](https://ngrok.com/download) for your environment. Once the function is running, we will configure ngrok.

```bash

ngrok http 7071

```

Copy the ngrok link provided where your function is running.

Finally, we configure SMS events through Event Grid in your Azure Communication Services resource. We will do this using the Azure CLI . You will need the Azure Communication Services resource ID found in the Azure Portal.  (The resource ID will look something like:  /subscriptions/<<AZURE SUBSCRIPTION ID>>/resourceGroups/<<RESOURCE GROUP NAME>>/providers/Microsoft.Communication/CommunicationServices/<<RESOURCE NAME>>)

```bash

az eventgrid event-subscription create --name "<<EVENT_SUBSCRIPTION_NAME>>" --endpoint-type webhook --endpoint "<<NGROK URL/runtime/webhooks/EventGrid?functionName=sms-open-ai-bot>> " --source-resource-id "<<RESOURCE_ID>>"  --included-event-types Microsoft.Communication.SMSReceived

```

Now that everything is hooked up, test the flow by sending an SMS to the phone number in the Azure Communication Services resource.
