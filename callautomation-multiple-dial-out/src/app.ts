import { config } from 'dotenv';
import express, { Application } from 'express';
import {
	CallAutomationClient,
	CallConnection,
	CallInvite,
	CallIntelligenceOptions,
	AnswerCallOptions,
	TextSource
} from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionIdA: string;
let callConnectionIdB: string;
let callConnectionIdC: string;
let userA: string;
let userB: string;
let userC: string;
let contosoPhNo: string;
let callerId: string;
let receiverId: string;
let callConnectionA: CallConnection;
let callConnectionB: CallConnection;
let callConnectionC: CallConnection;
let acsClient: CallAutomationClient;
const connectionString = process.env.CONNECTION_STRING || ""

async function createAcsClient() {
	callConnectionIdA = "";
	callConnectionIdB = "";
	callConnectionIdC = "";
	userA = process.env.USER_A_PHONE_NUMBER || "";
	userB = process.env.USER_B_PHONE_NUMBER || "";
	userC = process.env.USER_C_PHONE_NUMBER || "";
	contosoPhNo = process.env.ACS_RESOURCE_PHONE_NUMBER || "";
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
	console.log(`Caller ID: ${callerId}, Receiver ID: ${receiverId}`);
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", options);
}

async function redirectCall(sourceCallConnectionId: string, targetCallConnectionId: string) {
	console.log("Moving participant...");
	//acsClient.moveParticipant(sourceCallConnectionId, targetCallConnectionId, options);
}

async function hangUpCall() {
	console.log(`call A: ${callConnectionIdA}, call B: ${callConnectionIdB}, call C: ${callConnectionIdC}`);
	if (callConnectionA) {
		callConnectionA = acsClient.getCallConnection(callConnectionIdA);
		await callConnectionA.hangUp(true);
	}
	if (callConnectionB) {
		callConnectionB = acsClient.getCallConnection(callConnectionIdB);
		await callConnectionB.hangUp(true);
	}
	if (callConnectionC) {
		callConnectionC = acsClient.getCallConnection(callConnectionIdC);
		await callConnectionC.hangUp(true);
	}
	console.log("Calls hung up successfully.");
	callConnectionIdA = "";
	callConnectionIdB = "";
	callConnectionIdC = "";
}

async function playMedia() {
	const play: TextSource = { text: "Hello, welcome to multiple dial out contoso app.", voiceName: "en-US-NancyNeural", kind: "textSource" }
	await callConnectionA.getCallMedia().playToAll([play]);
}

async function validateEvent(eventData: any) {
	callerId = process.env.USER_A_PHONE_NUMBER || "";
	receiverId = process.env.ACS_RESOURCE_PHONE_NUMBER || "";
	const incomingCallContext = eventData.incomingCallContext;
	const callbackUri = process.env.CALLBACK_URI + "/api/callbacks";
	const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim() };
	const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions };
	let answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
	callConnectionIdA = answerCallResult.callConnectionProperties.callConnectionId;
	console.log(`Connection Id:  ${callConnectionIdA}`);
	callConnectionA = acsClient.getCallConnection(callConnectionIdA);
}

app.post("/api/incomingCall", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	console.log("IncomingCall event");
	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		console.log("SubscriptionValidation event");
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
		if (receiverId === userB) {
			console.log(`Call Connection Id:-> ${callConnectionId}`);
			callConnectionIdB = callConnectionId;
			callConnectionB = acsClient.getCallConnection(callConnectionIdB);
		}
		else if (receiverId === userC) {
			console.log(`Call Connection Id:-> ${callConnectionId}`);
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
app.get('/moveParticipantB', async (req, res) => {
	await moveParticipant(callConnectionIdB, callConnectionIdA);
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
	console.log(`call A: ${callConnectionIdA}, call B: ${callConnectionIdB}, call C: ${callConnectionIdC}`);
	res.json({ callConnectionIdA, callConnectionIdB, callConnectionIdC, userA, userB, userC, contosoPhNo });
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

// Move a participant from one call to another
async function moveParticipant(fromCallConnectionId: string, toCallConnectionId: string) {
	// Placeholder: Implement the logic to move a participant from one call to another
	console.log(`Moving participant from call ${fromCallConnectionId} to call ${toCallConnectionId}`);
	// Example: await acsClient.moveParticipant(fromCallConnectionId, toCallConnectionId);
}

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
