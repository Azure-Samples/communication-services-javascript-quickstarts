import { config } from 'dotenv';
import fs from "fs";
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallConnection,
	CallMediaRecognizeChoiceOptions,
	RecognitionChoice,
	TextSource,
	CallInvite,
	CreateCallOptions,
	CallMedia,
	DtmfTone,
	MediaStreamingOptions,
	StartMediaStreamingOptions,
	StopMediaStreamingOptions,
	CallAutomationEvent,
	parseCallAutomationEvent,
	TranscriptionOptions,
	StartTranscriptionOptions,
	StopTranscriptionOptions,
	HoldOptions,
	UnholdOptions,
	FileSource,
	PlayToAllOptions,
	PlayOptions,
	TransferCallToParticipantOptions,

} from "@azure/communication-call-automation";
import path from 'path';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let serverCallId: string;
let callee: PhoneNumberIdentifier;
let acsClient: CallAutomationClient;

const mainMenu = ` Hello this is Contoso Bank, we’re calling in regard to your appointment tomorrow 
at 9am to open a new account. Please say confirm if this time is still suitable for you or say cancel if you would like to cancel this appointment.`;
const confirmText = `Thank you for confirming your appointment tomorrow at 9am, we look forward to meeting with you.`;
const cancelText = `Your appointment tomorrow at 9am has been cancelled. Please call the bank directly 
if you would like to rebook for another date and time.`;
const customerQueryTimeout = `I’m sorry I didn’t receive a response, please try again.`;
const noResponse = `I didn't receive an input, we will go ahead and confirm your appointment. Goodbye`
const invalidAudio = `I’m sorry, I didn’t understand your response, please try again.`;
const confirmLabel = `Confirm`;
const cancelLabel = `Cancel`;
const retryContext = `Retry`;
const MEDIA_URI = process.env.CALLBACK_URI + "/audioprompt/"

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
	const mediaStreamingOptions: MediaStreamingOptions = {
		transportUrl: "wss://cc62-2409-40c2-4004-eced-cc09-9d15-d943-decd.ngrok-free.app",
		transportType: "websocket",
		contentType: "audio",
		audioChannelType: "unmixed",
		startMediaStreaming: false
	}

	// const transcriptionOptions: TranscriptionOptions = {
	// 	transportUrl: "wss://cc62-2409-40c2-4004-eced-cc09-9d15-d943-decd.ngrok-free.app",
	// 	transportType: "websocket",
	// 	locale: "en-US",
	// 	startTranscription: false
	// }

	const options: CreateCallOptions = {
		callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT },
		mediaStreamingOptions: mediaStreamingOptions
		// transcriptionOptions: transcriptionOptions
	};
	console.log("Placing outbound call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", options);
}

async function handlePlay(callConnectionMedia: CallMedia, textContent: string, context: string) {
	const play: TextSource = { text: textContent, voiceName: "en-US-NancyNeural", kind: "textSource" }
	const playToAllOptions: PlayToAllOptions = {
		operationContext: context
	}
	await callConnectionMedia.playToAll([play], playToAllOptions);
}

async function handlePlayWithFileSource(callConnectionMedia: CallMedia, textContent: string, options: PlayOptions, context: string) {
	const playSource: FileSource = {
		url: MEDIA_URI + "MainMenu.wav",
		kind: "fileSource",
	};
	const playToAllOptions: PlayToAllOptions = {
		operationContext: context
	}
	//const playSource: TextSource = { text: textContent, voiceName: "en-US-NancyNeural", kind: "textSource" }
	await callConnectionMedia.playToAll([playSource], playToAllOptions);
	//await callConnectionMedia.play([playSource], [callee], options);
}

async function getChoices() {
	const choices: RecognitionChoice[] = [
		{
			label: confirmLabel,
			phrases: ["Confirm", "First", "One"],
			tone: DtmfTone.One
		},
		{
			label: cancelLabel,
			phrases: ["Cancel", "Second", "Two"],
			tone: DtmfTone.Two
		}
	];

	return choices;
}

async function startRecognizing(callMedia: CallMedia, textToPlay: string, context: string) {
	const playSource: TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource" };

	const recognizeOptions: CallMediaRecognizeChoiceOptions = {
		choices: await getChoices(),
		interruptPrompt: false,
		initialSilenceTimeoutInSeconds: 10,
		playPrompt: playSource,
		operationContext: context,
		kind: "callMediaRecognizeChoiceOptions"
	};

	await callMedia.startRecognizing(callee, recognizeOptions)
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
	const operationContext = eventData.operationContext
	console.log("Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s operationContext=%s", callConnectionId, serverCallId, event.type, operationContext);
	callConnection = acsClient.getCallConnection(callConnectionId);
	const callMedia = callConnection.getCallMedia();

	//event parser.
	let callAutomationEvent: CallAutomationEvent = parseCallAutomationEvent(event);
	console.log(`Event:--> ${callAutomationEvent.kind}`);
	switch (callAutomationEvent.kind) {
		case "MediaStreamingStarted":
			console.log(callAutomationEvent.operationContext);
			console.log(callAutomationEvent.mediaStreamingUpdate.contentType);
			console.log(callAutomationEvent.mediaStreamingUpdate.mediaStreamingStatus);
			console.log(callAutomationEvent.mediaStreamingUpdate.mediaStreamingStatusDetails);
			break;
		case "MediaStreamingStopped":
			console.log(callAutomationEvent.operationContext);
			console.log(callAutomationEvent.mediaStreamingUpdate.contentType);
			console.log(callAutomationEvent.mediaStreamingUpdate.mediaStreamingStatus);
			console.log(callAutomationEvent.mediaStreamingUpdate.mediaStreamingStatusDetails);
			break;
		case "MediaStreamingFailed":
			console.log(callAutomationEvent.resultInformation.message);
			console.log(callAutomationEvent.resultInformation.code);
			console.log(callAutomationEvent.resultInformation.subCode);
			break;
		case "TranscriptionStarted":
			console.log(callAutomationEvent.operationContext);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatus);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatusDetails);
			break;
		case "TranscriptionStopped":
			console.log(callAutomationEvent.operationContext);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatus);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatusDetails);
			break;
		case "TranscriptionUpdated":
			console.log(callAutomationEvent.operationContext);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatus);
			console.log(callAutomationEvent.transcriptionUpdate.transcriptionStatusDetails);
			break;
		case "TranscriptionFailed":
			console.log(callAutomationEvent.resultInformation.message);
			console.log(callAutomationEvent.resultInformation.code);
			console.log(callAutomationEvent.resultInformation.subCode);
			break;
		case "PlayStarted":
			console.log("PlayStared Event received.")
			console.log(callAutomationEvent.operationContext);
			break;
		default:
			console.log("Waiting...")
	}

	if (event.type === "Microsoft.Communication.CallConnected") {
		// (Optional) Add a Microsoft Teams user to the call.  Uncomment the below snippet to enable Teams Interop scenario.
		// await acsClient.getCallConnection(callConnectionId).addParticipant({
		// 	targetParticipant: { microsoftTeamsUserId: process.env.TARGET_TEAMS_USER_ID },
		// 	sourceDisplayName: "Jack (Contoso Tech Support)"
		// });

		console.log("Received CallConnected event");

		const properties = await getCallProperties(eventData.callConnectionId);
		console.log("CORRELATION ID****--> " + properties.correlationId)
		console.log("CALL CONNECTION ID****--> " + properties.callConnectionId)
		console.log("Answered For:-> " + properties.answeredFor);

		// const streamingOptions: StartMediaStreamingOptions = {
		// 	operationContext: "startMediaStreamingContext",
		// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
		// }
		// await callMedia.startMediaStreaming(streamingOptions);

		//Without options.
		await callMedia.startMediaStreaming();


		// await callMedia.startTranscription();

		// const startTranscriptionOptions: StartTranscriptionOptions = {
		// 	locale: "en-AU",
		// 	operationContext: "startTranscriptionContext"
		// }
		// await callMedia.startTranscription(startTranscriptionOptions);

		await startRecognizing(callMedia, mainMenu, "");

		// const transferOptions: TransferCallToParticipantOptions = {
		// 	sourceCallIdNumber: { phoneNumber: "" }
		// }
		// const repsonse = acsClient.getCallConnection(properties.callConnectionId).transferCallToParticipant({ phoneNumber: "" }, transferOptions)
	}
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		if (eventData.recognitionType === "choices") {
			var context = eventData.operationContext;
			const labelDetected = eventData.choiceResult.label;
			const phraseDetected = eventData.choiceResult.recognizedPhrase;
			console.log("Recognition completed, labelDetected=%s, phraseDetected=%s, context=%s", labelDetected, phraseDetected, eventData.operationContext);

			// const stopMediaStreamingOptions: StopMediaStreamingOptions = {
			// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
			// }
			// await callMedia.stopMediaStreaming(stopMediaStreamingOptions);

			// without option.
			await callMedia.stopMediaStreaming();

			// await callMedia.stopTranscription();

			// const stopTranscriptionOptions: StopTranscriptionOptions = {
			// 	operationContext: "stopTranscriptionOptions"
			// }
			// await callMedia.stopTranscription(stopTranscriptionOptions);

			// await callMedia.updateTranscription("en-AU");

			//const playSource: TextSource = { text: "You are on hold please wait.", voiceName: "en-US-NancyNeural", kind: "textSource" }
			// const playSource: FileSource = {
			// 	url: MEDIA_URI + "MainMenu.wav",
			// 	kind: "fileSource",
			// };
			// const options: HoldOptions = {
			// 	// playSource: playSource,
			// 	operationContext: "holdUserContext",
			// 	// operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
			// }

			// const unholdOptions: UnholdOptions = {
			// 	operationContext: "unholdUserContext"
			// }

			// // await callMedia.hold(callee);
			// await callMedia.hold(callee, options);
			// console.log('Participant on hold waiting for unhold...')

			// // const participant = await acsClient.getCallConnection(eventData.callConnectionId).getParticipant(callee);
			// // await new Promise(f => setTimeout(f, 5000));
			// // console.log("Is Participant on hold:--> " + JSON.stringify(participant))
			// await new Promise(f => setTimeout(f, 10000));
			// await callMedia.unhold(callee);
			// await callMedia.unhold(callee, unholdOptions);
			// console.log('Paritcipant is unhold.')
			//await callMedia.startMediaStreaming();
			// const streamingOptions: StartMediaStreamingOptions = {
			// 	operationContext: "startMediaStreamingContext",
			// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
			// }
			// await callMedia.startMediaStreaming(streamingOptions);

			// await callMedia.startTranscription();
			// const startTranscriptionOptions: StartTranscriptionOptions = {
			// 	locale: "en-AU",
			// 	operationContext: "startTranscriptionContext"
			// }
			// await callMedia.startTranscription(startTranscriptionOptions);
			// await callMedia.updateTranscription("en-US");

			const textToPlay = labelDetected === confirmLabel ? confirmText : cancelText;
			await handlePlay(callMedia, textToPlay, "textSourceContext");

			// const interruptOption: PlayToAllOptions = {
			// 	loop: true,
			// 	interruptCallMediaOperation: true,
			// 	operationContext: "interruptOperationContext",
			// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
			// }
			// await handlePlay(callMedia, "This is me barging the play", interruptOption);
		}
	}
	else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		var context = eventData.operationContext;
		if (context !== "" && (context === retryContext)) {
			await handlePlay(callMedia, noResponse, undefined);
		}
		else {
			const resultInformation = eventData.resultInformation
			var code = resultInformation.subCode;
			console.log("Recognize failed: data=%s", JSON.stringify(eventData, null, 2));

			let replyText = '';
			switch (code) {
				case 8510:
				case 8511:
					replyText = customerQueryTimeout;
					break;
				case 8534:
				case 8547:
					replyText = invalidAudio
					break;
				default:
					replyText = customerQueryTimeout;
			}

			await startRecognizing(callMedia, replyText, retryContext);
		}
	}
	else if (event.type === "Microsoft.Communication.CallTransferAccepted") {
		console.log("Received CallTransferAccepted event")
		console.log(`Call transfer test completed.`);
		console.log(`Call automation has no control.`)
	}
	else if (event.type === "Microsoft.Communication.CallTransferFailed") {
		console.log("Received CallTransferFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted" || event.type === "Microsoft.Communication.playFailed") {
		console.log("Terminating call.");
		console.log("**********************************")
		// const stopTranscriptionOptions: StopTranscriptionOptions = {
		// 	operationContext: "stopTranscriptionOptions"
		// }
		// await callMedia.stopTranscription(stopTranscriptionOptions);

		//await callMedia.stopTranscription();


		//await callMedia.stopMediaStreaming();
		// const stopMediaStreamingOptions: StopMediaStreamingOptions = {
		// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
		// }
		// await callMedia.stopMediaStreaming(stopMediaStreamingOptions);


		// hangUpCall();

		// if (eventData.operationContext === "textSourceContext") {
		// 	//await callMedia.startMediaStreaming();
		// 	// const streamingOptions: StartMediaStreamingOptions = {
		// 	// 	operationContext: "startMediaStreamingContext",
		// 	// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
		// 	// }
		// 	// await callMedia.startMediaStreaming(streamingOptions);
		// 	//await callMedia.startTranscription();
		// 	const startTranscriptionOptions: StartTranscriptionOptions = {
		// 		locale: "en-AU",
		// 		operationContext: "startTranscriptionContext"
		// 	}
		// 	await callMedia.startTranscription(startTranscriptionOptions);
		// 	await callMedia.updateTranscription("en-US");
		// 	await handlePlayWithFileSource(callMedia, noResponse, undefined, "fileSourceContext");
		// }
		// else if (eventData.operationContext === "fileSourceContext") {
		// 	console.log("OPERATION CONTEXT:-->" + eventData.operationContext)
		// 	//await callMedia.startMediaStreaming();
		// 	// const streamingOptions: StartMediaStreamingOptions = {
		// 	// 	operationContext: "startMediaStreamingContext",
		// 	// 	operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
		// 	// }
		// 	// await callMedia.startMediaStreaming(streamingOptions);

		// 	//await callMedia.startTranscription();
		// 	const startTranscriptionOptions: StartTranscriptionOptions = {
		// 		locale: "en-AU",
		// 		operationContext: "startTranscriptionContext"
		// 	}
		// 	await callMedia.startTranscription(startTranscriptionOptions);
		// 	await callMedia.updateTranscription("en-US");
		// 	await handlePlay(callMedia, "good bye", "goodbyeContext");
		// }
		// else {
		// 	console.log("OPERATION CONTEXT:-->" + eventData.operationContext)
		// 	hangUpCall();

		// }
		hangUpCall();
	}

	res.sendStatus(200);
});

async function getCallProperties(connectionId: string) {
	const response = await acsClient.getCallConnection(connectionId).getCallConnectionProperties();
	return response;
}

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
app.get('/outboundCall', async (req, res) => {
	callee = {
		phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	};

	await createOutboundCall();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
