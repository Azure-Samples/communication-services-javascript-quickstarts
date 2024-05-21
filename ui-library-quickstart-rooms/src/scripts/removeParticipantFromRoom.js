var { RoomsClient } = require("@azure/communication-rooms");
var { CONNECTION_STRING } = require("./settings");
var roomsClient = new RoomsClient(CONNECTION_STRING);
var args = process.argv.slice(2);
var removeParticipantsList = [
    {
        communicationUserId: args[0]
    }
];
roomsClient.removeParticipants(args[1], removeParticipantsList);
