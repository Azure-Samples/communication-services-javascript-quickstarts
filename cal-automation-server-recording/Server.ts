import { Request, Response } from "express";

var express = require("express"),
  app = express(),
  port = process.env.PORT || 8080;
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require("./api/routes/CallRecordingRoutes");
routes(app);

app.listen(port);
app.use(function (req: Request, res: Response) {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

console.log("Server recording API server started on: " + port);
