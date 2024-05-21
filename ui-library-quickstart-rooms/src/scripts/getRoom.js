var { RoomsClient } = require("@azure/communication-rooms");
var { CONNECTION_STRING } = require("./settings");
var roomsClient = new RoomsClient(CONNECTION_STRING);
var args = process.argv.slice(2);
roomsClient.getRoom(args[0]).then(function (res) { return console.log(res); });
