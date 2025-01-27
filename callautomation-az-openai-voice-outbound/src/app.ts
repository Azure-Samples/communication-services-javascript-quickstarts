import { config } from 'dotenv';
import express, { Application } from 'express';
import http from 'http';
import {
	CallAutomationClient,
	MediaStreamingOptions,
	CallInvite,
	CreateCallOptions,
	CallConnection
} from "@azure/communication-call-automation";
import { PhoneNumberIdentifier } from "@azure/communication-common";
import WebSocket from 'ws';
import { startConversation, initWebsocket } from './azureOpenAiService'
import { processWebsocketMessageAsync } from './mediaStreamingHandler'

config();

const PORT = process.env.PORT;
const WS_PORT = process.env.WS_PORT;
const app: Application = express();


const server = http.createServer(app);

app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let serverCallId: string;
let callee: PhoneNumberIdentifier;
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

	//const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
	const websocketUrl = process.env.WEBSOCKET_URL
	console.log(websocketUrl);

	const mediaStreamingOptions: MediaStreamingOptions = {
		transportUrl: websocketUrl,
		transportType: "websocket",
		contentType: "audio",
		audioChannelType: "unmixed",
		startMediaStreaming: true,
		enableBidirectional: true,
		audioFormat: "Pcm24KMono"
	};

	const createCallOptions: CreateCallOptions = {
		mediaStreamingOptions: mediaStreamingOptions
	};

	console.log("Placing outbound call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", createCallOptions);
}

async function hangUpCall() {
	callConnection.hangUp(true);
}

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	callConnectionId = eventData.callConnectionId;
	serverCallId = eventData.serverCallId;
	console.log("Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s", callConnectionId, serverCallId, event.type);
	callConnection = acsClient.getCallConnection(callConnectionId);
	const callMedia = callConnection.getCallMedia();
	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
	}

	else if (event.type === "Microsoft.Communication.MediaStreamingStarted") {
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Media streaming content type:--> ${eventData.mediaStreamingUpdate.contentType}`);
		console.log(`Media streaming status:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatus}`);
		console.log(`Media streaming status details:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatusDetails}`);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingStopped") {
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Media streaming content type:--> ${eventData.mediaStreamingUpdate.contentType}`);
		console.log(`Media streaming status:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatus}`);
		console.log(`Media streaming status details:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatusDetails}`);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingFailed") {
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		hangUpCall()
	}

	res.sendStatus(200);

});

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// GET endpoint to place phone call
app.get('/outboundCall', async (req, res) => {
	callee = {
		phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	};

	await createOutboundCall();
	res.redirect('/');
});

const wss = new WebSocket.Server({ port: WS_PORT });
wss.on('connection', async (ws: WebSocket) => {
	console.log('Client connected!');
	await initWebsocket(ws);
	await startConversation()
	ws.on('message', async (packetData: ArrayBuffer) => {
		try {
			if (ws.readyState === WebSocket.OPEN) {
				await processWebsocketMessageAsync(packetData);
			} else {
				console.warn(`ReadyState: ${ws.readyState}`);
			}
		} catch (error) {
			console.error('Error processing WebSocket message:', error);
		}
	});
	ws.on('close', () => {
		console.log('Client disconnected');
	});
});

console.log(`WebSocket server running on port ${WS_PORT}`);

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});