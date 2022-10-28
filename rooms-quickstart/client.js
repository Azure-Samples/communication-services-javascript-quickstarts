// <Create a rooms client>
const { RoomsClient } = require("@azure/communication-rooms");
const { CommunicationIdentityClient } = require("@azure/communication-identity");

export async function main() {
  const connectionString = "<insert-connection-string>";
  const identityClient = new CommunicationIdentityClient(connectionString);
  const user1 = await identityClient.createUserAndToken(["voip"]);
  const user2 = await identityClient.createUserAndToken(["voip"]);

  // create RoomsClient
  const roomsClient = new RoomsClient(connectionString);

  var validFrom = new Date(Date.now());
  var validUntil = new Date(validFrom.getTime() + 5 * 60 * 1000);

  // options payload to create a room
  const createRoomOptions = {
    validFrom: validFrom,
    validUntil: validUntil,
    participants: [
      {
        id: user1.user,
        role: "Attendee",
      },
    ],
  };

  // create a room with the request payload
  const createRoom = await roomsClient.createRoom(createRoomOptions);
  const roomId = createRoom.id;
  console.log(`Created Room`);

  // retrieves the room with corresponding ID
  await roomsClient.getRoom(roomId);
  console.log(`Retrieved Room with ID ${roomId}`);
  
  validFrom.setTime(validUntil.getTime());
  validUntil.setTime(validFrom.getTime() + 5 * 60 * 1000);

  // request payload to update a room
  const updateRoomOptions = {
    validFrom: validFrom,
    validUntil: validUntil,
    roomJoinPolicy: "CommunicationServiceUsers",
    participants: [
      {
        id: user1.user,
        role: "Consumer",
      },
    ],
  };

  // updates the specified room with the request payload
  await roomsClient.updateRoom(roomId, updateRoomOptions);
  console.log(`Updated Room`);

  // request payload to add participants
  const addParticipantsList = [
    {
      id: user2.user,
      role: "Consumer",
    },
  ];

  // add user2 to the room with the request payload
  await roomsClient.addParticipants(roomId, addParticipantsList);
  console.log(`Added Participants`);
  
  // request payload to update user1 with a new role
  const updateParticipantsList = [
    {
      id: user1.user,
      role: "Presenter",
    },
  ];

  // update user1 with the request payload
  await roomsClient.updateParticipants(roomId, updateParticipantsList);
  console.log(`Updated Participants`);
  
  // request payload to delete both users from the room
  // this demonstrates both objects that can be used in deleting users from rooms: RoomParticipant or CommunicationIdentifier
  const removeParticipantsList = [user1.user, user2.user];

  // remove both users from the room with the request payload
  await roomsClient.removeParticipants(roomId, removeParticipantsList);
  console.log(`Removed Participants`);

  // deletes the room for cleanup
  await roomsClient.deleteRoom(roomId);
  console.log(`Room Deleted`);
}

main().catch((error) => {
    console.error("Encountered an error while sending request: ", error);
});
