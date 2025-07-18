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
[documentation](https://learn.microsoft.com/en-us/azure/communication-services/concepts/rooms/room-concept#managing-rooms-and-joining-room-calls). To join a rooms call, you need the room id of the an existing room and the local user's id needs to be added to that room. The Rooms Client is needed to do this but is out of scope for this ACS UI library quickstart sample. For more information on how to create/manage rooms and add users to rooms using the Rooms Client, follow this [quickstart](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/rooms/get-started-rooms?tabs=windows&pivots=programming-language-javascript).

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) .
- [Node.js](https://nodejs.org/en/) Active LTS and Maintenance LTS versions.
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource). You will need the endpoint value for the resource
- An identity with both VoIP and Chat scopes. Generate an identity using the [Azure Portal](https://docs.microsoft.com/azure/communication-services/quickstarts/identity/quick-create-identity).
- Create a room and add your user id to the room by using the provided sample scripts which are based on this Rooms client [quickstart](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/rooms/get-started-rooms?pivots=programming-language-javascript).
  - First, enter your connection string from your Communication Services resource in `.\src\scripts\settings.js` to run the Rooms client scripts.
  - Open terminal and navigate to `src\scripts`.
  - Create a room by running `node createRoom.js` and copy the room id from the output.
  - Add your user as a Presenter to the generated room by running `node addParticipantToRoom.js <USER_ID> <ROOM_ID>` with the corresponding ids
    - You can also change the role of the user to Attendee or Consumer in `addParticipantToRoom.js` and rerun the script.

## Run the code

1. Run `npm i` on the directory of the project to install dependencies
2. Swap placeholders with values in the code.
   - Go to the `src` folder and find the `App.tsx` file.
   - Enter the `USER_ID` and `TOKEN` for the identity you created.
   - Enter the generated `ROOM_ID` to join the room and make sure the user is added to the room to be able to join the room.
   - Optional: You can update the display name to match a string value of your choice.
   - Save the file.
3. Run `npm run start`
