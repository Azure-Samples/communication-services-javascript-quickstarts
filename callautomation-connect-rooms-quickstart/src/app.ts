import { config } from 'dotenv';
import express, { Application } from 'express';
import { } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallConnection,
	ConnectCallOptions,
	CallLocator,
	CallInvite,
	AddParticipantOptions
} from "@azure/communication-call-automation";
import { CommunicationIdentityClient, CommunicationUserToken } from '@azure/communication-identity';
import { CreateRoomOptions, RoomsClient } from '@azure/communication-rooms';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let serverCallId: string;
let acsClient: CallAutomationClient;
let roomId: string;
let user1: CommunicationUserToken;
let user2: CommunicationUserToken;
const connectionString = process.env.CONNECTION_STRING || ""

async function createAcsClient() {
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

async function createRoom() {
	const identityClient = new CommunicationIdentityClient(connectionString);
	user1 = await identityClient.createUserAndToken(["voip"]);
	user2 = await identityClient.createUserAndToken(["voip"]);
	const delay = ms => new Promise(res => setTimeout(res, ms));

	console.log(`Presenter:--> ${user1.user.communicationUserId}, Token:-->${user1.token}`)
	console.log(`******************************************************************************`)
	console.log(`Attendee:--> ${user2.user.communicationUserId}, Token:-->${user2.token}`)

	// create RoomsClient
	const roomsClient = new RoomsClient(connectionString);

	var validFrom = new Date(Date.now());
	var validUntil = new Date(validFrom.getTime() + 15 * 60 * 1000);
	var pstnDialOutEnabled = true;

	// options payload to create a room
	const createRoomOptions: CreateRoomOptions = {
		validFrom: validFrom,
		validUntil: validUntil,
		pstnDialOutEnabled: pstnDialOutEnabled,
		participants: [
			{
				id: user1.user,
				role: "Presenter",
			},
			{
				id: user2.user,
				role: "Attendee",
			},
		],
	};

	// create a room with the request payload
	const createRoom = await roomsClient.createRoom(createRoomOptions);
	roomId = createRoom.id;
	console.log(`Created Room with id:--> ${roomId}`);
}

async function addPstnParticipant() {
	if (callConnectionId) {
		const callInvite: CallInvite = {
			targetParticipant: { phoneNumber: process.env.TARGET_PHONE_NUMBER },
			sourceCallIdNumber: {
				phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
			},
		};

		const addParticipantOptions: AddParticipantOptions = {
			operationContext: "pstnUserContext"
		}
		var resposne = await callConnection.addParticipant(callInvite, addParticipantOptions)
		console.log(`Adding pstn participant with inviation id:--> ${resposne.invitationId}`)
	} else {
		console.log("CallConnection id is empty or call is not active.")
	}
}

async function connectCall() {
	console.log("connect call initiated...")
	if (roomId) {
		const callLocator: CallLocator = {
			id: roomId,
			kind: "roomCallLocator"
		}

		const connectCallOptions: ConnectCallOptions = {
			callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT },
			operationContext: "connectCallContext"
		}
		const callBackUri = process.env.CALLBACK_URI + "/api/callbacks";
		console.log(`Callback Url:-->${callBackUri}`)
		const response = await acsClient.connectCall(callLocator, callBackUri, connectCallOptions)
		console.log("connecting call please wait....")
	} else {
		console.log("Room id is empty or room is not available.")
	}
}

async function hangUpCall() {
	await callConnection.hangUp(true);
}

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	callConnectionId = eventData.callConnectionId;
	serverCallId = eventData.serverCallId;
	callConnection = acsClient.getCallConnection(callConnectionId);
	const callMedia = callConnection.getCallMedia();
	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
		console.log(`Correlation id:-> ${eventData.correlationId}`)
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

app.get('/room-data', (req, res) => {
	res.json({ roomId, user1, user2 });
});

// GET endpoint to establish connect call
app.get('/connectCall', async (req, res) => {
	await connectCall();
	res.redirect('/');
});

// GET endpoint to add pstn participant to call.
app.get('/addParticipant', async (req, res) => {
	await addPstnParticipant();
	res.redirect('/');
});

// GET endpoint to hangup call.
app.get('/hangup', async (req, res) => {
	await hangUpCall();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
	await createRoom();
});
