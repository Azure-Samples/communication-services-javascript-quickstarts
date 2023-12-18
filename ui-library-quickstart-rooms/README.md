---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Get Started with Rooms

This code sample showcases the ability to join a Rooms call using the CallComposite of the ACS UI library. For an overview of how Rooms works, you can read this 
(documentation)[https://learn.microsoft.com/en-us/azure/communication-services/concepts/rooms/room-concept#managing-rooms-and-joining-room-calls]. To join a rooms call, you need the room id of the an existing room and the local user's id needs to be added to that room. The Rooms Client is needed to do this but is out of scope for this ACS UI library quickstart sample. For more information on how to create/manage rooms and add users to rooms using the Rooms Client, follow this (quickstart)[https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/rooms/get-started-rooms?tabs=windows&pivots=programming-language-javascript].

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F)  .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions (8.11.1 and 10.14.1 recommended).
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need the endpoint value for the resource
- An identity with both VoIP and Chat scopes. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).
- Generate Room ID and add the generated user ID to the Room to be able to join the call [Quickstart: Create and manage a room resource](https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/rooms/get-started-rooms?pivots=programming-language-csharp).

## Run the code

1. Run `npm i` on the directory of the project to install dependencies
2. Swap placeholders for identifiers in the code.
    - Go to the `src` folder and find the `app.tsx` file.
    - Enter the `USER_ID` and `TOKEN` for the identity you created.
    - Also input value for the `ROOM_ID` to join the room and make sure the user is added to the room to be able to join the room.
    - Optional: You can update the display name to match a string value of your choice.
    - Save the file.
4. Run `npm run start`
