import { config } from 'dotenv';
import fs from "fs";
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CallAutomationClient, CallConnection, CallMediaRecognizeDtmfOptions, CallLocator, StartRecordingOptions, FileSource, CallInvite } from "@azure/communication-call-automation";
import path from 'path';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId: string;
let recordingId: string;
let callConnection: CallConnection;
let serverCallId: string;
let callee: PhoneNumberIdentifier;
let terminateCall = false;
let acsClient: CallAutomationClient;

async function createAcsClient() {
  const connectionString = process.env.CONNECTION_STRING || "";
  acsClient = new CallAutomationClient(connectionString);
  console.log("Initialized ACS Client.");
}

async function createOutboundCall() {
  const callInvite: CallInvite = {
    targetParticipant: callee,
    sourceCallIdNumber: {
      phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
    },
  };

  console.log("Placing outbound call...");
  acsClient.createCall(callInvite, process.env.CALLBACK_URI + "ongoingcall");
}

async function startRecording() {
  try {
    const callLocator: CallLocator = {
      id: serverCallId,
      kind: "serverCallLocator",
    };

    const recordingOptions: StartRecordingOptions = {
      callLocator: callLocator,
    };

    const response = await acsClient.getCallRecording().start(recordingOptions);

    recordingId = response.recordingId;
  } catch (error) {
    console.error("Error starting recording:", error);
    throw error;
  }
}

async function playAudio(prompt: string) {
  try {
    if (prompt === "Goodbye.wav") {
      terminateCall = true;
    }

    const audioPrompt: FileSource[] = [{
      url: process.env.MEDIA_CALLBACK_URI + prompt,
      kind: "fileSource",
    }];

    await callConnection.getCallMedia().playToAll(audioPrompt);
  } catch (error) {
    console.error('An error occurred while playing audio prompt:', error);
  }
}

async function startToneRecognition() {
  try {
    const audioPrompt: FileSource = {
      url: process.env.MEDIA_CALLBACK_URI + "MainMenu.wav",
      kind: "fileSource",
    };

    const recognizeOptions: CallMediaRecognizeDtmfOptions = {
      playPrompt: audioPrompt,
      kind: "callMediaRecognizeDtmfOptions",
    };

    await callConnection.getCallMedia().startRecognizing(callee, 1, recognizeOptions);
  } catch (error) {
    console.error("Error starting tone recognition:", error);
    throw error;
  }
}

async function hangUpCall() {
  await acsClient.getCallRecording().stop(recordingId);
  callConnection.hangUp(true);
}

// POST endpoint to handle incoming call events
app.post("/incomingcall", async (req: any, res: any) => {
  const event = req.body[0];
  const eventData = event.data;

  if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
    console.log("Received SubscriptionValidation event");
    res.status(200).json({
      validationResponse: eventData.validationCode,
    });
  } else {
    res.sendStatus(200);
  }
});

// POST endpoint to handle ongoing call events
app.post("/ongoingcall", async (req: any, res: any) => {
  res.sendStatus(200);
  const event = req.body[0];
  const eventData = event.data;

  if (event.type === "Microsoft.Communication.CallConnected") {
    console.log("Received CallConnected event");

    callConnectionId = eventData.callConnectionId;
    serverCallId = eventData.serverCallId;
    callConnection = acsClient.getCallConnection(callConnectionId);

    await startToneRecognition();
    await startRecording();
  } else if (event.type === "Microsoft.Communication.ParticipantsUpdated") {
    console.log("Received ParticipantUpdated event");
  } else if (event.type === "Microsoft.Communication.PlayCompleted") {
    console.log("Received PlayCompleted event");

    if (terminateCall) {
      hangUpCall();
    }
  } else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
    const tone = event.data.dtmfResult.tones[0];
    console.log("Received RecognizeCompleted event, with following tone: " + tone);

    if (tone === "one") {
      await playAudio("Confirmed.wav");
      terminateCall = true;
    } else {
      await playAudio("Goodbye.wav");
    }
  } else if (event.type === "Microsoft.Communication.CallDisconnected") {
    console.log("Received CallDisconnected event");
  } else {
    const eventType = event.type;
    console.log("Received Unexpected event: " + eventType + ". Terminating Call.");
    hangUpCall();
  }
});

// GET endpoint to serve the audio file
app.get("/audioprompt/:filename", (req, res) => {
  const filename = req.params.filename;
  const audioFilePath = path.join(process.env.BASE_MEDIA_PATH || "", filename);

  // Read the audio file
  fs.readFile(audioFilePath, (err, data) => {
    if (err) {
      console.error("Failed to read audio file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Set the appropriate response headers
    res.set("Content-Type", "audio/wav");
    res.set("Content-Length", data.length.toString());
    res.set("Cache-Control", "no-cache, no-store");
    res.set("Pragma", "no-cache");

    // Send the audio file as the response
    res.send(data);
  });
});

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'src/webpage' });
});

// GET endpoint to receive phone number to call
app.post('/submit', async (req, res) => {
  callee = {
    rawId: req.body.phoneNumber,
    phoneNumber: req.body.phoneNumber,
  };

  await createOutboundCall();
  res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  await createAcsClient();
});
