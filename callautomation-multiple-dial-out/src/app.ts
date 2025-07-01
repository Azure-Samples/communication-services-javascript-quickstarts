import { config } from 'dotenv';
import express, { Application } from 'express';
import {
	CallAutomationClient,
	CallConnection,
	CallInvite,
	CreateCallOptions,
	CallIntelligenceOptions,
	TranscriptionOptions,
	AnswerCallOptions,
	TextSource
} from "@azure/communication-call-automation";
import { CommunicationUserToken } from '@azure/communication-identity';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionIdA: string;
let callConnectionIdB: string;
let callConnectionIdC: string;
let callerId: string;
let callerIdA: string;
let callerIdB: string;
let callerIdC: string;
let receiverId: string;
let receiverIdA: string;
let receiverIdB: string;
let receiverIdC: string;
let callConnectionA: CallConnection;
let callConnectionB: CallConnection;
let callConnectionC: CallConnection;
let acsClient: CallAutomationClient;
const connectionString = process.env.CONNECTION_STRING || ""
const locale = "en-US";

async function createAcsClient() {
	callConnectionIdA = "";
	callConnectionIdB = "";
	callConnectionIdC = "";
	callerIdA = "";
	callerIdB = "";
	callerIdC = "";
	receiverIdA = "";
	receiverIdB = "";
	receiverIdC = "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

async function createOutboundCall(callToPhoneNumber: string) {
	callerId = process.env.ACS_RESOURCE_PHONE_NUMBER || "";
	receiverId = callToPhoneNumber;
	const communicationUserId = {
		communicationUserId: callToPhoneNumber
	};
	const callInvite = {
		targetParticipant: communicationUserId
	};
	const options = {
		callIntelligenceOptions: {
			cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT
		}
	};
	console.log("Placing outbound call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", options);
}

async function hangUpCall() {
	await callConnectionA.hangUp(true);
	await callConnectionB.hangUp(true);
	await callConnectionC.hangUp(true);
	callConnectionIdA = "";
	callConnectionIdB = "";
	callConnectionIdC = "";
	callerIdA = "";
	callerIdB = "";
	callerIdC = "";
	receiverIdA = "";
	receiverIdB = "";
	receiverIdC = "";
}

async function playMedia() {
	const play: TextSource = { text: "Hello, welcome to multiple dial out contoso app.", voiceName: "en-US-NancyNeural", kind: "textSource" }
	await callConnectionA.getCallMedia().playToAll([play]);
}

async function validateEvent(eventData: any) {
	const incomingCallContext = eventData.incomingCallContext;
	const callbackUri = process.env.CALLBACK_URI + "/api/callbacks";
	const websocketUrl = process.env.CALLBACK_HOST_URI.replace(/^https:\/\//, 'wss://');
	console.log(`Websocket url:- ${websocketUrl}`);
	console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICES_ENDPOINT.trim()}`);
	const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim() };
	const transcriptionOptions: TranscriptionOptions = { transportUrl: websocketUrl, transportType: "websocket", locale: locale, startTranscription: true }
	const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions, transcriptionOptions: transcriptionOptions };
	let answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
	if (callConnectionIdA && callConnectionIdA !== "") {
		callerIdA = eventData.from.rawId;
		receiverIdA = eventData.to.rawId;
		console.log(`Incoming call from: ${callerIdA} to: ${receiverIdA}`);
		callConnectionIdA = answerCallResult.callConnectionProperties.callConnectionId;
		callConnectionA = acsClient.getCallConnection(callConnectionIdA);
	}
	else if (callConnectionIdB && callConnectionIdB !== "") {
		callerIdB = eventData.from.rawId;
		receiverIdB = eventData.to.rawId;
		console.log(`Incoming call from: ${callerIdB} to: ${receiverIdB}`);
		callConnectionIdB = answerCallResult.callConnectionProperties.callConnectionId;
		callConnectionB = acsClient.getCallConnection(callConnectionIdB);
	}
	else {
		callerIdC = eventData.from.rawId;
		receiverIdC = eventData.to.rawId;
		console.log(`Incoming call from: ${callerIdC} to: ${receiverIdC}`);
		callConnectionIdC = answerCallResult.callConnectionProperties.callConnectionId;
		callConnectionC = acsClient.getCallConnection(callConnectionIdC);
	}
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
		validateEvent(eventData);
	}
});

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	
	if (event.type === "Microsoft.Communication.CallConnected") {
		const callConnectionId = eventData.callConnectionId;
		console.log("Received CallConnected event");
		console.log(`Correlation id:-> ${eventData.correlationId}`)
		console.log(`Call Connection Id:-> ${callConnectionId}`);
		if (callConnectionIdA === undefined || callConnectionIdA === "") {
			callerIdA = callerId;
			receiverIdA = receiverId;
			console.log(`Incoming call from: ${callerIdA} to: ${receiverIdA}`);
			callConnectionIdA = callConnectionId;
			callConnectionA = acsClient.getCallConnection(callConnectionIdA);
		}
		else if (callConnectionIdB === undefined || callConnectionIdB === "") {
			callerIdB = callerId;
			receiverIdB = receiverId;
			console.log(`Incoming call from: ${callerIdB} to: ${receiverIdB}`);
			callConnectionIdB = callConnectionId;
			callConnectionB = acsClient.getCallConnection(callConnectionIdB);
		}
		else {
			callerIdC = callerId;
			receiverIdC = receiverId;
			console.log(`Incoming call from: ${callerIdC} to: ${receiverIdC}`);
			callConnectionIdC = callConnectionId;
			callConnectionC = acsClient.getCallConnection(callConnectionIdC);
		}
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted") {
		console.log("Received PlayCompleted event");
	}
	else if (event.type === "Microsoft.Communication.playFailed") {
		console.log("Received playFailed event");
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log("Received CallDisconnected event");
		console.log(`Correlation id:-> ${eventData.correlationId}`)
	}
	
	res.sendStatus(200);
});

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// GET endpoint to place phone call
app.get('/connectCallA', async (req, res) => {
	await createOutboundCall(process.env.USER_A_PHONE_NUMBER || "");
	res.redirect('/');
});

// GET endpoint to place phone call
app.get('/connectCallB', async (req, res) => {
	await createOutboundCall(process.env.USER_B_PHONE_NUMBER || "");
	res.redirect('/');
});

// GET endpoint to place phone call
app.get('/connectCallC', async (req, res) => {
	await createOutboundCall(process.env.USER_C_PHONE_NUMBER || "");
	res.redirect('/');
});

app.get('/call-data', (req, res) => {
	console.log("Call Data Endpoint Hit");
	res.json({ callConnectionIdA, callConnectionIdB, callConnectionIdC, callerIdA, callerIdB, callerIdC, receiverIdA, receiverIdB, receiverIdC });
});

// GET endpoint to hangup call.
app.get('/hangup', async (req, res) => {
	await hangUpCall();
	res.redirect('/');
});

// GET endpoint to play media to call.
app.get('/playMedia', async (req, res) => {
	await playMedia();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
