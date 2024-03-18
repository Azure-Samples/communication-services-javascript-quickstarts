import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationUserIdentifier, MicrosoftTeamsUserIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient, CallConnection, AnswerCallOptions, CallMedia,
	TextSource, AnswerCallResult,
	CallIntelligenceOptions, PlayOptions,
	CallLocator, StartRecordingOptions, CallInvite, AddParticipantOptions,
} from "@azure/communication-call-automation";
import { v4 as uuidv4 } from 'uuid';
config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.json());

let callConnection: CallConnection;
let acsClient: CallAutomationClient;
let answerCallResult: AnswerCallResult;
let callerId: string;
let callMedia: CallMedia;
let callee: CommunicationUserIdentifier;

const handlePrompt = "Welcome to the Contoso Utilities. Thank you!";
let recordingId: string;
let recordingLocation: string;
let recordingMetadataLocation: string;
let recordingState: string;
const pauseOnStart = process.env.PAUSE_ON_START.trim().toLowerCase();
const teamsUserId = process.env.TEAMS_USER_ID.trim() || undefined;

async function createAcsClient() {
	const connectionString = process.env.ACS_CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

async function createCall() {
	const callInvite: CallInvite = {
		targetParticipant: callee,
	};

	console.log("Placing call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_HOST_URI + "/api/callbacks");
}

app.post("/api/incomingCall", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		console.log("Received SubscriptionValidation event");
		res.status(200).json({
			validationResponse: eventData.validationCode,
		});

		return;
	}

	if (event.eventType === "Microsoft.Communication.IncomingCall") {
		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		const callbackUri = `${process.env.CALLBACK_HOST_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICE_ENDPOINT.trim()}`);
		const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT.trim() };
		const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions };
		answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
		callConnection = answerCallResult.callConnection;
	}
});

app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
	const contextId = req.params.contextId;
	const event = req.body[0];
	const eventData = event.data;

	console.log("Received eventType=%s, callConnectionId=%s, correlationId=%s, serverCallId=%s, context=%s",
		event.type, eventData.callConnectionId, eventData.correlationId, eventData.serverCallId, eventData.operationContext);
	console.log(`event type match ${event.type === "Microsoft.Communication.CallConnected"}`);
	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
		callMedia = acsClient.getCallConnection(eventData.callConnectionId).getCallMedia();
		await startRecording(eventData.serverCallId);
		await handlePlayAsync(callMedia, handlePrompt, "handlePromptContext");
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted") {
		console.log("Received PlayCompleted event")

		if (teamsUserId !== undefined) {
			const teamsUser: MicrosoftTeamsUserIdentifier = {
				microsoftTeamsUserId: teamsUserId
			}
			const callInvite: CallInvite = {
				targetParticipant: teamsUser,
			};

			const options: AddParticipantOptions = {
				invitationTimeoutInSeconds: 10,
			}
			try {
				var response = await answerCallResult.callConnection.addParticipant(callInvite, options);
				console.log(`Invitation Id.${response.invitationId}`);
			}
			catch (e) {
				console.log(e);
			}
		}

		await getRecordingState(recordingId);

		if (recordingState === "active") {
			printCurrentTime();
			const response = await acsClient.getCallRecording().pause(recordingId);
			getRecordingState(recordingId)
			console.log(`Recording is paused and inactive.`);
			await delayWithSetTimeout();
			await acsClient.getCallRecording().resume(recordingId);
			await getRecordingState(recordingId)
			console.log(`Recording is resumed and active.`);
			printCurrentTime();
		}
		else {
			printCurrentTime();
			const response = await acsClient.getCallRecording().resume(recordingId);
			await getRecordingState(recordingId)
			console.log(`Recording is resumed and active.`);
			await delayWithSetTimeout();
			printCurrentTime();
		}

		await delayWithSetTimeout();
		await acsClient.getCallRecording().stop(recordingId);
		console.log(`Recording is stopped.`);
		printCurrentTime();
		await acsClient.getCallConnection(eventData.callConnectionId).hangUp(false);
	}
	else if (event.type === "Microsoft.Communication.playFailed") {
		console.log("Received playFailed event")
		await acsClient.getCallConnection(eventData.callConnectionId).hangUp(true);
	}
	else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
		console.log("Received AddParticipantSucceeded event")
		console.log(`Participant:-> ${JSON.stringify(eventData.participant)}`)
	}
	else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
		console.log("Received AddParticipantFailed event")
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.RecordingStateChanged") {
		console.log("Received RecordingStateChanged event")
	}
	else if (event.type === "Microsoft.Communication.TeamsComplianceRecordingStateChanged") {
		console.log("Received TeamsComplianceRecordingStateChanged event")
		console.log(`CorrelationId:->${eventData.correlationId}`)
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log("Received CallDisconnected event");
	}
});

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// POST endpoint to receive recording events
app.post('/api/recordingFileStatus', async (req, res) => {
	const event = req.body[0];
	const eventData = event.data;
	console.log(`Received ${event.eventType}`)
	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		res.status(200).json({
			validationResponse: eventData.validationCode,
		});
	}
	else if (event.eventType === "Microsoft.Communication.RecordingFileStatusUpdated") {
		recordingLocation = eventData.recordingStorageInfo.recordingChunks[0].contentLocation
		recordingMetadataLocation = eventData.recordingStorageInfo.recordingChunks[0].metadataLocation
		res.sendStatus(200);
	}
});
// GET endpoint to download call audio
app.get('/download', async (req, res) => {
	if (recordingLocation === null || recordingLocation === undefined) {
		console.log("Failed to download, recordingLocation is invalid.")
		res.redirect('/')
	}
	else {
		// Set the appropriate response headers for the file download
		res.setHeader('Content-Disposition', 'attachment; filename="recording.wav"');
		res.setHeader('Content-Type', 'audio/wav');
		const recordingStream = await acsClient.getCallRecording().downloadStreaming(recordingLocation);

		// Pipe the recording stream to the response object.
		recordingStream.pipe(res);
	}
});

// GET endpoint to download metadata.
app.get('/downloadMetadata', async (req, res) => {
	if (recordingMetadataLocation === null || recordingMetadataLocation === undefined) {
		console.log("Failed to download metadata, recordingMetadataLocation is invalid.")
		res.redirect('/')
	}
	else {
		res.setHeader('Content-Disposition', 'attachment; filename="recordingMetadata.json"');
		res.setHeader('Content-Type', 'application/json');
		const recordingMetadataStream = await acsClient.getCallRecording().downloadStreaming(recordingMetadataLocation);

		// Pipe the recording metadata stream to the response object.
		recordingMetadataStream.pipe(res);
	}
});

async function handlePlayAsync(callConnectionMedia: CallMedia, textToPlay: string, context: string) {
	const play: TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource" }
	const playOptions: PlayOptions = { operationContext: context };
	await callConnectionMedia.playToAll([play], playOptions);
}

async function startRecording(serverCallId: string) {
	const callLocator: CallLocator = {
		id: serverCallId,
		kind: "serverCallLocator",
	};

	const recordingOptions: StartRecordingOptions = {
		callLocator: callLocator,
		recordingContent: "audio",
		recordingChannel: "unmixed",
		recordingFormat: "wav",
		pauseOnStart: pauseOnStart === "true" ? true : false,
	};
	const response = await acsClient.getCallRecording().start(recordingOptions);
	recordingId = response.recordingId;
	console.log(`Recording Id--> ${recordingId}`);
	printCurrentTime();
	console.log(`Pause on start--> ${pauseOnStart}`);
}

async function getRecordingState(recordingId: string) {
	const response = await acsClient.getCallRecording().getState(recordingId);
	recordingState = response.recordingState;
	console.log(`Recording current state-->${recordingState}`);
}

async function delayWithSetTimeout(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 5000); // 5000 milliseconds = 5 seconds
	});
}

function printCurrentTime() {
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	console.log(`Current time: ${hours}:${minutes}:${seconds}`);
}

// GET endpoint to place call
app.get('/createCall', async (req, res) => {
	callee = {
		communicationUserId: process.env.COMMUNICATION_USR_ID || "",
	};

	await createCall();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
