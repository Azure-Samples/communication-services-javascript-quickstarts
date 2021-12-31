import express from "express";
import { callingServerCallbackHandler } from "./controllers/callingServerCallbackController";
import { incomingCallHandler } from "./controllers/incomingCallController";

const port = 3000;
const app = express();

app.listen(port, () => {
    console.log("hello world!")
});

app.use(express.json());
app.use(incomingCallHandler);
app.use(callingServerCallbackHandler);
