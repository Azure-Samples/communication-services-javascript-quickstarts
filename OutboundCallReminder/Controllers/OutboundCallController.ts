var express = require("express");
var router = express.Router();
const { EventAuthHandler } = require("../EventHandler/EventAuthHandler");
const { EventDispatcher } = require("../EventHandler/EventDispatcher");
var fileSystem = require("fs");
var path = require("path");

var routes = function () {
  router.route("/api/outboundcall/callback").post(function (req, res) {
    const secretKey = req.query.secret;
    var eventhandler = EventAuthHandler.getInstance(req);

    if (secretKey && eventhandler.authorize(secretKey)) {
      EventDispatcher.getInstance().processNotification(
        decodeURIComponent(escape(JSON.stringify(req.body)))
      );
    }
    res.status(200).send("OK");
  });

  router.route("/audio").get(function (req, res) {
    var fileName = "../audio/" + req.query.filename;
    var filePath = path.join(__dirname, fileName);
    var stat = fileSystem.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": "audio/x-wav",
      "Content-Length": stat.size,
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
  });

  return router;
};
module.exports = routes;
