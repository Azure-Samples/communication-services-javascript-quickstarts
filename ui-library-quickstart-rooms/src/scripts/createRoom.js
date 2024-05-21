var { RoomsClient } = require("@azure/communication-rooms");
var { CONNECTION_STRING } = require("./settings");
var roomsClient = new RoomsClient(CONNECTION_STRING);
roomsClient.createRoom().then(function (res) { return console.log(res); });
