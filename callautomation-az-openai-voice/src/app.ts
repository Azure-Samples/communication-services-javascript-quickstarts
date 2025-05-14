import { config } from 'dotenv';
import express, { Application } from 'express';
import http from 'http';
import {
	CallAutomationClient,
	AnswerCallOptions,
	AnswerCallResult,
	SsmlSource,
	CallConnection,
	TranscriptionOptions,
	CallIntelligenceOptions,
	StreamingData
} from "@azure/communication-call-automation";
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { startConversation, initWebsocket } from './azureOpenAiService.js'
import { processWebsocketMessageAsync } from './mediaStreamingHandler.js'

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.json());
// Create common server for app and websocket
const server = http.createServer(app);

let acsClient: CallAutomationClient;
let answerCallResult: AnswerCallResult;
let callerId: string;
let callConnection: CallConnection;

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
		const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim() };
		const transcriptionOptions: TranscriptionOptions = { transportUrl: websocketUrl, transportType: "websocket", locale: "en-us", startTranscription: true }
		const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions, transcriptionOptions: transcriptionOptions };
		
		answerCallResult = await acsClient.answerCall(
			incomingCallContext,
			callbackUri,
			answerCallOptions
		);

		console.log(`Answer call ConnectionId:--> ${answerCallResult.callConnectionProperties.callConnectionId}`);
	}
	catch (error) {
		console.error("Error during the incoming call event.", error);
	}
});

app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	const callConnectionId = eventData.callConnectionId;
	callConnection = acsClient.getCallConnection(callConnectionId);

	console.log(`Received Event:-> ${event.type}, Correlation Id:-> ${eventData.correlationId}, CallConnectionId:-> ${callConnectionId}`);
	if (event.type === "Microsoft.Communication.CallConnected") {
		const callConnectionProperties = await acsClient.getCallConnection(callConnectionId).getCallConnectionProperties();
		const mediaStreamingSubscription = callConnectionProperties.mediaStreamingSubscription;
		console.log("MediaStreamingSubscription:-->" + JSON.stringify(mediaStreamingSubscription));
	}
	else if (event.type === "Micorosoft.Communication.TranscriptionStarted") {
		console.log(`Operation context:--> ${eventData.operationContext}`);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionStopped") {
		console.log(`Operation context:--> ${eventData.operationContext}`);
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

wss.on('connection', async (socket: WebSocket) => { // socket is an instance of WebSocket
    console.log('Client connected');
    await initWebsocket(socket);
    await startConversation();
	socket.on('message', async (packetData: ArrayBuffer) => {
		const decoder = new TextDecoder();
		const stringJson = decoder.decode(packetData);
		console.log("STRING JSON=>--" + stringJson)
		var response = StreamingData.parse(stringJson);
		if ('text' in response) {
			console.log("Transcription Data")
			console.log("TEXT:-->" + response.text);
			await processWebsocketMessageAsync(response.text);
		}
	});

    socket.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on port ${PORT}`);

export async function playToAll(message: string): Promise<void> {
  if (!message.trim()) {
    console.warn("Cannot play an empty message. Skipping playback.");
    return;
  }
  
  console.info(`Playing message: ${message}`);

  // Escape HTML special characters in the message
  const escapedMessage = escapeHtml(message);

  // Create an SSML template
  const ssmlTemplate = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="en-US-NancyNeural">"${escapedMessage}"</voice>
  </speak>`;
  console.info(`Generated SSML: ${ssmlTemplate}`);

  try {
    // Create an SSML source for playback.
	const ssmlSource: SsmlSource = { ssmlText: ssmlTemplate, kind: "ssmlSource" }

	// Play the message to all participants
	await callConnection.getCallMedia().playToAll([ssmlSource]);
    console.info("Played audio to all participants:");	
  } catch (error) {
    console.error(`Error playing message: ${error}`);
  }
}

function escapeHtml(unsafe: string): string {
  return unsafe.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}
