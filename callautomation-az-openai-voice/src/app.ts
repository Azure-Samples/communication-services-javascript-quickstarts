import { config } from 'dotenv';
import express, { Application } from 'express';
import {
	CallAutomationClient,
	CallConnection,
	AnswerCallOptions,
	AnswerCallResult,
	CallIntelligenceOptions,
	MediaStreamingOptions,
} from "@azure/communication-call-automation";

import { v4 as uuidv4 } from 'uuid';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let acsClient: CallAutomationClient;
let answerCallResult: AnswerCallResult;
let callerId: string;
const transportUrl = process.env.WEBSOCKET_URL.trim()

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
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICES_ENDPOINT.trim()}`);
		const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim() };

		const mediaStreamingOptions: MediaStreamingOptions = {
			transportUrl: transportUrl,
			transportType: "websocket",
			contentType: "audio",
			audioChannelType: "unmixed",
			startMediaStreaming: true,
			enableBidirectional: true,
			audioFormat: "Pcm24KMono"
		}

		const answerCallOptions: AnswerCallOptions = {
			callIntelligenceOptions: callIntelligenceOptions,
			mediaStreamingOptions: mediaStreamingOptions
		};

		answerCallResult = await acsClient.answerCall(
			incomingCallContext,
			callbackUri,
			answerCallOptions
		);

		callConnection = answerCallResult.callConnection;
	}
	catch (error) {
		console.error("Error during the incoming call event.", error);
	}
});

app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
	const contextId = req.params.contextId;
	const event = req.body[0];
	const eventData = event.data;

	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
		const props = await acsClient.getCallConnection(eventData.callConnectionId).getCallConnectionProperties();
		console.log(`Correlation Id:-> ${props.correlationId}`);
		const mediaStreamingSubscription = props.mediaStreamingSubscription;
		console.log("MediaStreamingSubscription:-->" + JSON.stringify(mediaStreamingSubscription));
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingStarted") {
		console.log("Received MediaStreamingStarted event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Media streaming content type:--> ${eventData.mediaStreamingUpdate.contentType}`);
		console.log(`Media streaming status:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatus}`);
		console.log(`Media streaming status details:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatusDetails}`);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingStopped") {
		console.log("Received MediaStreamingStopped event")
		callConnectionId = eventData.callConnectionId;
		callConnectionId = eventData.callConnectionId;
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Media streaming content type:--> ${eventData.mediaStreamingUpdate.contentType}`);
		console.log(`Media streaming status:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatus}`);
		console.log(`Media streaming status details:--> ${eventData.mediaStreamingUpdate.mediaStreamingStatusDetails}`);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingFailed") {
		console.log("Received MediaStreamingFailed event")
		console.log(`Operation context:--> ${eventData.operationContext}`);
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log("Received CallDisconnected event");
	}
});

app.get('/', (req, res) => {
	res.send('Hello ACS CallAutomation!');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});

