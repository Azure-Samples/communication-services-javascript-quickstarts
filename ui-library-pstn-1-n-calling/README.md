---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Get Started with Composites - PSTN Calling & 1:N Calling

This sample showcases how Call Composites can be used for making outbound calls to phone numbers and other azure communication users.

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need the endpoint value for the resource
- An identity with VoIP. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).
- A phone number procured through Azure Communication Service portal using [Azure Portal](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number).

## Run the code

1. Run `npm i` on the directory of the project to install dependencies
2. Swap placeholders for identifiers in the code.
    - Go to the `src` folder and find the `App.tsx` file.
    - There input values for the the `USER_ID` and `TOKEN` for the identity you created.
    - Optional: You can update the display name to match a string value of your choice.
    - Save the file.
4. Run `npm run start`

Open your browser to ` http://localhost:3000`. You should see the following:
![Composite End State](../media/CompositeEnd.png)

Feel free to style the composites to your desired size and layout inside of your application.
