// <Create a rooms client>
import { RoomsClient, Room, CreateRoomRequest, PatchRoomRequest } from "@azure/communication-rooms";
import {
    RoomsClient,
    AddParticipantsRequest,
    CreateRoomRequest,
    UpdateParticipantsRequest,
    PatchRoomRequest
    ParticipantsCollection,
  } from "@azure/communication-rooms";
  
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { getIdentifierRawId } from "@azure/communication-common";

async function main() {
    const connectionString = "<connection-string-to-resource>";

    const identityClient = new CommunicationIdentityClient(connectionString);
    const user1 = await identityClient.createUserAndToken(["voip"]);
    const user2 = await identityClient.createUserAndToken(["voip"]);
  
    // create RoomsClient
    const roomsClient: RoomsClient = new RoomsClient(connectionString);
  
    var validFrom = new Date(Date.now());
    var validUntil = new Date(validFrom.getTime() + 5 * 60 * 1000);
  
    // request payload to create a room
    const createRoomRequest: CreateRoomRequest = {
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
    const createRoom = await roomsClient.createRoom(createRoomRequest);
    const roomId = createRoom.id;
    console.log(`Created Room`);
    printRoom(createRoom);
  
    // retrieves the room with corresponding ID
    const getRoom = await roomsClient.getRoom(roomId);
    console.log(`Retrieved Room with ID ${roomId}`);
    printRoom(getRoom);
  
    validFrom.setTime(validUntil.getTime());
    validUntil.setTime(validFrom.getTime() + 5 * 60 * 1000);
  
    // request payload to update a room
    const updateRoomRequest: PatchRoomRequest = {
      validFrom: validFrom,
      validUntil: validUntil,
      roomJoinPolicy: "CommunicationServiceUsers",
    };
  
    // updates the specified room with the request payload
    const updateRoom = await roomsClient.updateRoom(roomId, updateRoomRequest);
    console.log(`Updated Room`);
    printRoom(updateRoom);
    
    // request payload to add participants
    const addParticipantsRequest: AddParticipantsRequest = {
    participants: [
        {
        id: user2.user,
        role: "Consumer",
        },
    ],
    };

    // add user2 to the room with the request payload
    const addParticipants = await roomsClient.addParticipants(roomId, addParticipantsRequest);
    console.log(`Added Participants`);
    printParticipants(addParticipants);

    // request payload to update user1 with a new role
    const updateParticipantsRequest: UpdateParticipantsRequest = {
    participants: [
        {
        id: user1.user,
        role: "Presenter",
        },
    ],
    };

    // update user1 with the request payload
    await roomsClient.updateParticipants(roomId, updateParticipantsRequest);
    console.log(`Updated Participants`);
    printParticipants(await roomsClient.getParticipants(roomId));

    // request payload to delete both users from the room
    // this demonstrates both objects that can be used in deleting users from rooms: RoomParticipant or CommunicationIdentifier
    const removeParticipantsRequest = {
    participants: [user1.user, user2.user],
    };

    // remove both users from the room with the request payload
    await roomsClient.removeParticipants(roomId, removeParticipantsRequest);
    console.log(`Removed Participants`);
    printParticipants(await roomsClient.getParticipants(roomId));
  
    // deletes the specified room
    await roomsClient.deleteRoom(roomId);
}
  
/**
 * Outputs the details of a Room to console.
 * @param room - The Room being printed to console.
 */
function printRoom(room: Room): void {
    console.log(`Room ID: ${room.id}`);
    console.log(`Valid From: ${room.validFrom}`);
    console.log(`Valid Until: ${room.validUntil}`);
    console.log(`Room Join Policy: ${room.roomJoinPolicy}`);
    console.log(`Participants:`);
    for (const participant of room.participants!) {
      const id = getIdentifierRawId(participant.id);
      const role = participant.role;
      console.log(`${id} - ${role}`);
    }
}

/**
 * Outputs the participants within a ParticipantsCollection to console.
 * @param pc - The ParticipantsCollection being printed to console.
 */
function printParticipants(pc: ParticipantsCollection): void {
    console.log(`Number of Participants: ${pc.participants.length}`);
    for (const participant of pc.participants!) {
        const id = getIdentifierRawId(participant.id);
        const role = participant.role;
        console.log(`${id} - ${role}`);
    }
}

main().catch((error) => {
    console.error("Encountered an error while sending request: ", error);
    process.exit(1);
});
