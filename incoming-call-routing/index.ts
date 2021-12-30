import express from "express";
import { callingServerCallbackHandler, callingServerCallbackRoute } from "./controllers/callingServerCallbackController";
import { incomingCallHandler, incomingCallRoute } from "./controllers/incomingCallController";

const port = 3000;
const app = express();

app.listen(port, () => {
    console.log("hello world!")
});

app.get(incomingCallRoute, incomingCallHandler);
app.get(callingServerCallbackRoute, callingServerCallbackHandler);

