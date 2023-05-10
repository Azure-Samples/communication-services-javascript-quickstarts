
import "./program";

var express = require("express"),
  app = express(),
  port = process.env.PORT || 8080;
var bodyParser = require("body-parser");
var program = require("./program")();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", program);

app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
});
