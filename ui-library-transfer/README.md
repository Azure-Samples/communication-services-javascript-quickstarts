---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Get Started with Composites - Handle transfer request

This sample showcases how Call Composites can be used to handle transfer requests. The current beta version can only
receive transfer requests from Teams users in 1 on 1 calls.

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need the endpoint value for the resource
- An identity with VoIP. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).
- A phone number procured through Azure Communication Service portal using [Azure Portal](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number).

## Run the code

1. Run `npm i` on the directory of the project to install dependencies
2. Swap placeholders for identifiers in the code.
    - Go to the `src` folder and find the `INPUTS.tsx` file.
    - Replace the values for the the `userIdentity` and `userToken` for the identity you created in Azure Portal in the `Prerequisites` step.
    - Replace the `participantIds` with an array of one Teams user id.
    - Update the display name to a name of your choice.
    - Save the file.
3. Run `npm run start`

Open your browser to <http://localhost:3000>. You should see the following:
![Composite Loaded State](../media/transferable-call-composite-loaded.png).

Finally, click `Start Call` to start the call.

When the transfer request is accepted, you should see the following:
![Composite Loaded State](../media/transfer-page.png).