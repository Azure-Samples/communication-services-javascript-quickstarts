---
page_type: sample
languages:
  - javascript
products:
  - azure
  - azure-communication-services
---

# Get Started with Stateful Call Client

For full instructions on how to build this code sample from scratch, look at [Quickstart: Get Started with Stateful Call Client](https://azure.github.io/communication-ui-library/?path=/docs/stateful-client-get-started-call--docs)

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions.
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- An identity with both VoIP and Chat scopes. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).

## Run the code

1. Run `npm i` on the directory of the project to install dependencies
2. Swap placeholders for identifiers in `src/App.tsx`
3. Run `npm run start`

Open your browser to ` http://localhost:3000`. You should see the following:
![Stateful Call End State](../media/StatefulEnd.png)

Feel free to style the UI Components to your desired size and layout inside of your application.
