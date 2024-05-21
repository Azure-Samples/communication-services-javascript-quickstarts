var { RoomsClient } = require("@azure/communication-rooms");
var { CONNECTION_STRING } = require("./settings");
var roomsClient = new RoomsClient(CONNECTION_STRING);
var args = process.argv.slice(2);
var addParticipantsList = [
    {
        id: {
            kind: 'communicationUser',
            communicationUserId: args[0]
        },
        role: 'Presenter' // can also add participant as 'Attendee' or 'Consumer'
    }
];
roomsClient.addOrUpdateParticipants(args[1], addParticipantsList);
