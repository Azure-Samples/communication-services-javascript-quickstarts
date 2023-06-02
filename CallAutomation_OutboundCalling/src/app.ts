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

const MEDIA_URI = process.env.CALLBACK_URI + "/audioprompt/"
let callConnectionId: string;
let recordingId: string;
let callConnection: CallConnection;
let serverCallId: string;
let callee: PhoneNumberIdentifier;
let acsClient: CallAutomationClient;
let recordingLocation: string;

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
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks");
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
		const audioPrompt: FileSource[] = [{
			url: MEDIA_URI + prompt,
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
			url: MEDIA_URI + "MainMenu.wav",
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

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
	res.sendStatus(200);
	const event = req.body[0];
	const eventData = event.data;

	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");

		callConnectionId = eventData.callConnectionId;
		serverCallId = eventData.serverCallId;
		callConnection = acsClient.getCallConnection(callConnectionId);

		await startRecording();
		await startToneRecognition();
	} 
	else if (event.type === "Microsoft.Communication.ParticipantsUpdated") {
		console.log("Received ParticipantUpdated event");
	} 
	else if (event.type === "Microsoft.Communication.PlayCompleted" || event.type === "Microsoft.Communication.playFailed") {
		console.log("Received PlayCompleted event");
		hangUpCall();
	} 
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		const tone = event.data.dtmfResult.tones[0];
		console.log("Received RecognizeCompleted event, with following tone: " + tone);

		if (tone === "one")
			await playAudio("Confirmed.wav");
		else if (tone === "two")
			await playAudio("Goodbye.wav");
		else
			await playAudio("Invalid.wav");
	} 
	else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		await playAudio("Timeout.wav");
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log("Received CallDisconnected event");
	} 
	else {
		const eventType = event.type;
		console.log("Received Unexpected event: " + eventType + ". Terminating Call.");
		hangUpCall();
	}
});

// POST endpoint to receive recording events
app.post('/recording', async (req, res) => {
	const event = req.body[0];
	const eventData = event.data;

	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		console.log("Received SubscriptionValidation event");
		res.status(200).json({
			validationResponse: eventData.validationCode,
		});
	}
	else if(event.eventType === "Microsoft.Communication.RecordingFileStatusUpdated") {
		console.log("Received RecordingFileStatusUpdated event");
		recordingLocation = eventData.recordingStorageInfo.recordingChunks[0].contentLocation
	}
	res.sendStatus(200);
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

// GET endpoint to place phone call
app.get('/call', async (req, res) => {
	callee = {
		rawId: process.env.TARGET_PHONE_NUMBER || "",
		phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	};

	await createOutboundCall();
	res.redirect('/');
});

// GET endpoint to download call audio
app.get('/download', async (req, res) => {

	if(recordingLocation === null || recordingLocation === undefined) {
		console.log("Failed to download, recordingLocation is invalid.")
		res.redirect('/')
	}
	else {
		try {
			// Set the appropriate response headers for the file download
			res.setHeader('Content-Disposition', 'attachment; filename="recording.wav"');
			res.setHeader('Content-Type', 'audio/wav');
	
			const recordingStream = await acsClient.getCallRecording().downloadStreaming(recordingLocation);
	
			// Pipe the recording stream to the response object
			recordingStream.pipe(res);
		} catch (error) {
			console.error("Error downloading recording. Ensure recording webhook is setup correctly.", error);
		}
	}
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
