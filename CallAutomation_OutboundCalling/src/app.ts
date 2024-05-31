import { config } from 'dotenv';
import fs from "fs";
import express, { Application } from 'express';
import { CommunicationUserIdentifier, PhoneNumberIdentifier, isCommunicationUserIdentifier, isPhoneNumberIdentifier } from "@azure/communication-common";
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
	CallLocator,
	ConnectCallOptions,
	AddParticipantOptions,
	CallMediaRecognizeDtmfOptions,
	CallMediaRecognizeSpeechOptions,
	CallMediaRecognizeSpeechOrDtmfOptions,
	Tone,
	RecordingStorage,
	StartRecordingOptions
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
let recordingId: string;
let recordingLocation: string;
let recordingMetadataLocation: string;
let recordingDeleteLocation: string;
let recordingState: string;

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

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}


async function startRecording(serverCallId: string) {

	const callLocator: CallLocator = {
		id: serverCallId,
		kind: "serverCallLocator",
	};

	// const recordingStorage: RecordingStorage = {
	// 	recordingStorageKind: "azureBlobStorage",
	// 	recordingDestinationContainerUrl: bringYourOwnStorageUrl
	// }
	const recordingOptions: StartRecordingOptions = {
		callLocator: callLocator,
		recordingContent: "audio",
		recordingChannel: "unmixed",
		recordingFormat: "wav",
		// pauseOnStart: isPauseOnStart,
		// recordingStorage: isByos === true ? recordingStorage : undefined,
	};
	const response = await acsClient.getCallRecording().start(recordingOptions);
	recordingId = response.recordingId;
	console.log(`Recording Id--> ${recordingId}`);
}

async function connectCall() {
	callee = {
		phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	};

	// const callLocator: CallLocator = {
	// 	id: "99452784898421625",
	// 	kind: "roomCallLocator"
	// }

	// const callLocator: CallLocator = {
	// 	id: "96a6f228-269b-46f8-8192-422793104e74",
	// 	kind: "groupCallLocator"
	// }

	const callLocator: CallLocator = {
		id: "aHR0cHM6Ly9hcGkuZmxpZ2h0cHJveHkuc2t5cGUuY29tL2FwaS92Mi9jcC9jb252LW1hc28tMDItcHJvZC1ha3MuY29udi5za3lwZS5jb20vY29udi9mN2p5YVBLUjBrS2FWeS0wNFhIVmVBP2k9MTAtMTI4LTE0MS0yMTAmZT02Mzg1MTkxODAzNjgzNjgwOTg",
		kind: "serverCallLocator"
	}

	const connectCallOptions: ConnectCallOptions = {
		callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT }
	}
	const response = await acsClient.connectCall(callLocator, process.env.CALLBACK_URI + "/api/callbacks", connectCallOptions)
	// console.log("CORRELATION ID:-->" + response.callConnectionProperties.correlationId);
	// console.log("CONNECTION ID:-->" + response.callConnectionProperties.callConnectionId);
	console.log("connecting call....")
}

async function createOutboundCall() {
	const callInvite: CallInvite = {
		targetParticipant: callee,
		sourceCallIdNumber: {
			phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
		},
	};

	const options: CreateCallOptions = { callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT } };
	console.log("Placing outbound call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", options);
}

async function handlePlay(callConnectionMedia: CallMedia, textContent: string) {
	const play: TextSource = { text: textContent, voiceName: "en-US-NancyNeural", kind: "textSource" }
	await callConnectionMedia.playToAll([play]);

	//await callConnectionMedia.play([play], [callee])
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

async function startContinuousDtmf(callMedia: CallMedia) {
	await callMedia.startContinuousDtmfRecognition(callee)
	console.log(`Continuous Dtmf recognition started. press one on dialpad.`)
}

async function stopContinuousDtmf(callMedia: CallMedia) {
	await callMedia.stopContinuousDtmfRecognition(callee)
	console.log(`Continuous Dtmf recognition stopped. wait for sending dtmf tones.`)
}

async function startSendingDtmfTone(connectionId: string) {

	const tones: Tone[] = [
		"zero",
		"one"
	];
	await acsClient.getCallConnection(connectionId).getCallMedia().sendDtmfTones(tones, callee)
	console.log(`Send dtmf tones started. respond over phone.`)
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

	const recognizeChoiceOptions: CallMediaRecognizeChoiceOptions = {
		choices: await getChoices(),
		interruptPrompt: false,
		initialSilenceTimeoutInSeconds: 10,
		playPrompt: playSource,
		operationContext: context,
		kind: "callMediaRecognizeChoiceOptions"
	};

	const recognizeDtmfOptions: CallMediaRecognizeDtmfOptions = {
		playPrompt: playSource,
		interToneTimeoutInSeconds: 5,
		initialSilenceTimeoutInSeconds: 15,
		maxTonesToCollect: 4,
		interruptPrompt: false,
		operationContext: context,
		kind: "callMediaRecognizeDtmfOptions",
	};

	const recognizeSpeechOptions: CallMediaRecognizeSpeechOptions = {
		endSilenceTimeoutInSeconds: 1,
		playPrompt: playSource,
		operationContext: "OpenQuestionSpeech",
		kind: "callMediaRecognizeSpeechOptions",
	}

	const recongnizeSpeechOrDtmfOptions: CallMediaRecognizeSpeechOrDtmfOptions = {
		maxTonesToCollect: 2,
		endSilenceTimeoutInSeconds: 1,
		playPrompt: playSource,
		initialSilenceTimeoutInSeconds: 30,
		interruptPrompt: true,
		operationContext: "OpenQuestionSpeechOrDtmf",
		kind: "callMediaRecognizeSpeechOrDtmfOptions",
	}

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
	console.log("Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s", callConnectionId, serverCallId, event.type);
	callConnection = acsClient.getCallConnection(callConnectionId);
	const callMedia = callConnection.getCallMedia();
	if (event.type === "Microsoft.Communication.CallConnected") {
		// (Optional) Add a Microsoft Teams user to the call.  Uncomment the below snippet to enable Teams Interop scenario.
		// await acsClient.getCallConnection(callConnectionId).addParticipant({
		// 	targetParticipant: { microsoftTeamsUserId: process.env.TARGET_TEAMS_USER_ID },
		// 	sourceDisplayName: "Jack (Contoso Tech Support)"
		// });

		console.log("Received CallConnected event");
		// await startRecognizing(callMedia, mainMenu, "");

		const callConnectionProperties = await acsClient.getCallConnection(eventData.callConnectionId).getCallConnectionProperties();
		console.log("*****CORRELATION ID*****:-->" + callConnectionProperties.correlationId);
		console.log("CONNECTION ID:-->" + callConnectionProperties.callConnectionId);

		await startRecording(eventData.serverCallId);

		const callInvite: CallInvite = {
			targetParticipant: { phoneNumber: process.env.TARGET_PHONE_NUMBER },
			sourceCallIdNumber: {
				phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
			},
		};

		const addParticipantOptions: AddParticipantOptions = {
			operationContext: "pstnUserContext"
		}

		// const callInvite: CallInvite = {
		// 	targetParticipant: { communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-6df0-ccbe-99c6-593a0d003e4c" },
		// };

		// const addParticipantOptions: AddParticipantOptions = {
		// 	operationContext: "voipConext",
		// 	invitationTimeoutInSeconds: 15
		// }

		const response = await callConnection.addParticipant(callInvite, addParticipantOptions)
		console.log(response.invitationId)


		const participants = await callConnection.listParticipants();
		participants.values.forEach(element => {
			console.log(JSON.stringify(element.identifier))
		});

	}
	else if (event.type === "Microsoft.Communication.ConnectFailed") {
		const resultInformation = eventData.resultInformation
		console.log(JSON.stringify(resultInformation));
	}
	else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
		await acsClient.getCallRecording().pause(recordingId);
		const participants = await callConnection.listParticipants();
		participants.values.forEach(element => {
			console.log(JSON.stringify(element.identifier))
		});

		await acsClient.getCallRecording().resume(recordingId);

		const muteVoipUser: CommunicationUserIdentifier = {
			communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-6e3e-6179-d68a-08482200482a"
		}

		const muteResult = await callConnection.muteParticipant(muteVoipUser);
		if (muteResult) {
			const mutedParticipant = await callConnection.getParticipant(muteVoipUser)
			console.log("Muted participant:-->" + JSON.stringify(mutedParticipant))
			console.log("Is Participant muted:-->" + mutedParticipant.isMuted)
		}
		if (eventData.operationContext === "pstnUserContext") {
			console.log("OperationContext:-->" + eventData.operationContext)
			console.log("Recongnizing.....")
			await startRecognizing(callMedia, mainMenu, "recognizeContext")
			//await handlePlay(callMedia, mainMenu);
			const callMediaAsync = await acsClient.getCallConnection(eventData.callConnectionId).getCallMedia();
			//await startContinuousDtmf(callMediaAsync)
			//await startSendingDtmfTone(eventData.callConnectionId);
		}

		// const participant: PhoneNumberIdentifier = {
		// 	phoneNumber: process.env.TARGET_PHONE_NUMBER
		// }

		// const participant: CommunicationUserIdentifier = {
		// 	communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-6df0-ccbe-99c6-593a0d003e4c"
		// }

		// await callConnection.removeParticipant(participant)
		//await callConnection.hangUp(true);
		await acsClient.getCallRecording().stop(recordingId);

	}
	else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
		const resultInformation = eventData.resultInformation
		console.log(JSON.stringify(resultInformation));
		await callConnection.hangUp(false);
	}
	else if (event.type === "Microsoft.Communication.RemoveParticipantSucceeded") {
		console.log("Participant removed successfully..")
		// await callConnection.hangUp(false);
	}
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		if (eventData.recognitionType === "choices") {
			var context = eventData.operationContext;
			const labelDetected = eventData.choiceResult.label;
			const phraseDetected = eventData.choiceResult.recognizedPhrase;
			console.log("Recognition completed, labelDetected=%s, phraseDetected=%s, context=%s", labelDetected, phraseDetected, eventData.operationContext);
			const textToPlay = labelDetected === confirmLabel ? confirmText : cancelText;
			await handlePlay(callMedia, textToPlay);
		}
	}
	else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		var context = eventData.operationContext;
		if (context !== "" && (context === retryContext)) {
			await handlePlay(callMedia, noResponse);
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
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived") {
		console.log("Received ContinuousDtmfRecognitionToneReceived event")
		console.log(`Tone received:--> ${eventData.tone}`);
		console.log(`SequenceId:--> ${eventData.sequenceId}`);
		await stopContinuousDtmf(callMedia);

	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed") {
		console.log("Received ContinuousDtmfRecognitionToneFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionStopped") {
		console.log("Received ContinuousDtmfRecognitionStopped event")

	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
		console.log("Received SendDtmfTonesCompleted event")

	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
		console.log("Received SendDtmfTonesFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted" || event.type === "Microsoft.Communication.playFailed") {
		// console.log("Terminating call.");
		// hangUpCall();
	}

	res.sendStatus(200);
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
		recordingDeleteLocation = eventData.recordingStorageInfo.recordingChunks[0].deleteLocation
		console.log(`CONTENT LOCATION:-->${recordingLocation}`);
		console.log(`METADATA LOCATION:-->${recordingMetadataLocation}`);
		console.log(`DELETE LOCATION:-->${recordingDeleteLocation}`);
		res.sendStatus(200);
	}
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
app.get('/outboundCall', async (req, res) => {
	callee = {
		phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	};

	await createOutboundCall();
	res.redirect('/');
});

// GET endpoint to place phone call
app.get('/connectCall', async (req, res) => {

	await connectCall();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});

// GET endpoint to download call audio
app.get('/download', async (req, res) => {
	if (recordingLocation === null || recordingLocation === undefined) {
		console.log("Failed to download, recordingLocation is invalid.")
		res.redirect('/')
	}
	else {
		try {
			// Set the appropriate response headers for the file download
			res.setHeader('Content-Disposition', 'attachment; filename="recording.wav"');
			res.setHeader('Content-Type', 'audio/wav');
			const recordingStream = await acsClient.getCallRecording().downloadStreaming(recordingLocation);

			// Pipe the recording stream to the response object.
			recordingStream.pipe(res);
		}
		catch (ex) {
			console.log(ex);
		}
	}
});

// GET endpoint to download metadata.
app.get('/downloadMetadata', async (req, res) => {
	if (recordingMetadataLocation === null || recordingMetadataLocation === undefined) {
		console.log("Failed to download metadata, recordingMetadataLocation is invalid.")
		res.redirect('/')
	}
	else {
		try {
			res.setHeader('Content-Disposition', 'attachment; filename="recordingMetadata.json"');
			res.setHeader('Content-Type', 'application/json');
			const recordingMetadataStream = await acsClient.getCallRecording().downloadStreaming(recordingMetadataLocation);

			// Pipe the recording metadata stream to the response object.
			recordingMetadataStream.pipe(res);
		}
		catch (ex) {
			console.log(ex);
		}

	}
});
