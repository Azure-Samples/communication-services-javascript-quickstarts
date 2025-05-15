import { config } from 'dotenv';
import express, { Application } from 'express';
import http from 'http';
import {
	CallAutomationClient,
	AnswerCallOptions,
	AnswerCallResult,
	MediaStreamingOptions,
} from "@azure/communication-call-automation";

import { v4 as uuidv4 } from 'uuid';

import { WebSocket, WebSocketServer } from 'ws';
import { startConversation, initWebsocket } from './azureOpenAiService.js'
import { processWebsocketMessageAsync } from './mediaStreamingHandler.js'
import { playAudio } from 'openai/helpers/audio.js';

config();

let websocketMessage: ArrayBuffer;
const PORT = process.env.PORT;
const app: Application = express();
app.use(express.json());
// Create common server for app and websocket
const server = http.createServer(app);

let acsClient: CallAutomationClient;
let answerCallResult: AnswerCallResult;
let callerId: string;

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.post("/api/incomingCall", async (req: any, res: any) => {
	const event = req.body[0];
	try {
		const eventData = event.data;
		if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
			console.log("Received SubscriptionValidation event");
			res.status(200).json({
				validationResponse: eventData.validationCode,
			});

			return;
		}

		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		const callbackUri = `${process.env.CALLBACK_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
		console.log(`Websocket URL: ${websocketUrl}`);
		const mediaStreamingOptions: MediaStreamingOptions = {
			transportUrl: websocketUrl,
			transportType: "websocket",
			contentType: "audio",
			audioChannelType: "unmixed",
			startMediaStreaming: true,
			enableBidirectional: true,
			audioFormat: "Pcm24KMono"
		}

		const answerCallOptions: AnswerCallOptions = {
			mediaStreamingOptions: mediaStreamingOptions
		};

		answerCallResult = await acsClient.answerCall(
			incomingCallContext,
			callbackUri,
			answerCallOptions
		);
		
		console.log(`Incoming call callConnectionProperties. callConnectionProperties: ${answerCallResult.callConnectionProperties.mediaStreamingSubscription.subscribedContentTypes}`);
		console.log(`Answer call ConnectionId:--> ${answerCallResult.callConnectionProperties.callConnectionId}`);
		return res.sendStatus(200);
	}
	catch (error) {
		console.error("Error during the incoming call event.", error);
	}
});

app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	const callConnectionId = eventData.callConnectionId;
	console.log(`Received Event:-> ${event.type}, Correlation Id:-> ${eventData.correlationId}, CallConnectionId:-> ${callConnectionId}`);
	if (event.type === "Microsoft.Communication.CallConnected") {
		const callConnectionProperties = await acsClient.getCallConnection(callConnectionId).getCallConnectionProperties();
		const mediaStreamingSubscription = callConnectionProperties.mediaStreamingSubscription;
		console.log("MediaStreamingSubscription:-->" + JSON.stringify(mediaStreamingSubscription));
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
	}
});

app.get('/', (req, res) => {
	res.send('Hello ACS CallAutomation!');
});

// Start the server
server.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});

//Websocket for receiving mediastreaming.
const wss = new WebSocketServer({ server });
let lastPacketText = '';

wss.on('connection', async (ws: WebSocket) => {
  console.log('Client connected');
  await initWebsocket(ws);
  await startConversation();

  ws.on('message', async (packetData: ArrayBuffer) => {
    // decode incoming data to text
    const text = new TextDecoder().decode(packetData);

    // skip duplicates
    if (text === lastPacketText) {
      console.debug('Duplicate message received, skipping');
      return;
    }
    lastPacketText = text;
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

console.log(`WebSocket server running on port ${PORT}`);
