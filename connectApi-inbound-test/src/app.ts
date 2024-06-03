import { config } from 'dotenv';
import fs from "fs";
import path from 'path';
import express, { Application } from 'express';
import { CommunicationIdentifier, CommunicationUserIdentifier, MicrosoftTeamsUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient, CallConnection, AnswerCallOptions, CallMedia,
	TextSource, AnswerCallResult,
	CallIntelligenceOptions, PlayOptions,
	CallLocator, StartRecordingOptions, CallInvite, AddParticipantOptions,
	CallMediaRecognizeChoiceOptions, RecognitionChoice, DtmfTone, CallMediaRecognizeDtmfOptions, Tone, CallParticipant, TransferCallToParticipantOptions, CreateCallOptions,
	CancelAddParticipantOperationOptions, FileSource, RecordingStorage,
	CallMediaRecognizeSpeechOptions,
	CallMediaRecognizeSpeechOrDtmfOptions,
	ConnectCallOptions
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
let isGroupCall: boolean;
let isOutboundCall: boolean;

const handlePrompt = "Welcome to the Contoso Utilities. Thank you!";
const pstnUserPrompt = "Hello this is contoso recognition test please confirm or cancel to proceed further."
const dtmfPrompt = "Thank you for the update. Please type  one two three four on your keypad to close call."
let recordingId: string;
let recordingLocation: string;
let recordingMetadataLocation: string;
let recordingDeleteLocation: string;
let recordingState: string;
const confirmLabel = `Confirm`;
const cancelLabel = `Cancel`;
const isPauseOnStart = process.env.PAUSE_ON_START.trim().toLowerCase() === "true" ? true : false;
const teamsUserId = process.env.TEAMS_USER_ID.trim() || undefined;
const acsPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_PHONE_NUMBER.trim() };
const targetPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER.trim() };
const targetPhoneNumber2: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER2.trim() };
const acsCallerPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_CALLER_PHONE_NUMBER.trim() };
const callee: CommunicationUserIdentifier = { communicationUserId: process.env.COMMUNICATION_USR_ID.trim() };
const acsUser2: CommunicationUserIdentifier = { communicationUserId: process.env.COMMUNICATION_USR_ID2.trim() };
const isRejectCall = process.env.REJECT_CALL.trim().toLowerCase() === "true" ? true : false;
const isRedirectCall = process.env.REDIRECT_CALL.trim().toLowerCase() === "true" ? true : false;
const isTransferCall = process.env.TRANSFER_CALL.trim().toLowerCase() === "true" ? true : false;
const MEDIA_URI = process.env.CALLBACK_HOST_URI + "/audioprompt/"
const isByos = process.env.IS_BYOS.trim().toLowerCase() === "true" ? true : false;
const bringYourOwnStorageUrl = process.env.BRING_YOUR_OWN_STORAGE_URL;
let guid;
let connectApiCalled = false;
async function createAcsClient() {
	const connectionString = process.env.ACS_CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

async function connectCall() {
	console.log("connect call initiated...")

	connectApiCalled = true;
	// callee = {
	// 	phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
	// };

	const callLocator: CallLocator = {
		id: "99416800913141485",
		kind: "roomCallLocator"
	}

	// const callLocator: CallLocator = {
	// 	id: "3fd941d7-f161-4c3c-a4b4-839f5b8e4a5d",
	// 	kind: "groupCallLocator"
	// }

	// const callLocator: CallLocator = {
	// 	id: "aHR0cHM6Ly9hcGkuZmxpZ2h0cHJveHkuc2t5cGUuY29tL2FwaS92Mi9jcC9jb252LWtyY2UtMDEtcHJvZC1ha3MuY29udi5za3lwZS5jb20vY29udi9ETGtfS0E4RDJVTzlxSlNNbTdpMFZRP2k9MTAtNjAtMTMtMjE2JmU9NjM4NTIwMDcxNzg5Mjk0NTgy",
	// 	kind: "serverCallLocator"
	// }

	const connectCallOptions: ConnectCallOptions = {
		callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT },
		operationContext: "connectCallContext"
	}
	console.log(`${process.env.CALLBACK_HOST_URI}/api/callbacks/${guid}?callerId=${callerId}`)
	const response = await acsClient.connectCall(callLocator, process.env.CALLBACK_HOST_URI + "/api/callbacks", connectCallOptions)

	console.log("connecting call....")
}

async function createCall() {
	const callInvite: CallInvite = {
		targetParticipant: callee,
	};



	console.log("Placing call...");
	acsClient.createCall(callInvite, process.env.CALLBACK_HOST_URI + "/api/callbacks");
}

async function createOutboundCall() {
	console.log(`Placing outbound 1:1 call.`);
	isOutboundCall = true;
	const options: CreateCallOptions = {
		callIntelligenceOptions: {
			cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT
		},
		operationContext: "OutboundCallContext",
	}
	const callInvite: CallInvite = {
		targetParticipant: targetPhoneNumber,
		sourceCallIdNumber: acsCallerPhoneNumber,
	};
	await acsClient.createCall(callInvite, process.env.CALLBACK_HOST_URI + "/api/callbacks", options);
}

async function createGroupCall() {
	console.log(`Creating group call`);
	isGroupCall = true;
	const participants = [
		targetPhoneNumber,
		acsCallerPhoneNumber,
		acsUser2,
	];
	// const participants = [
	// 	callee,
	// 	acsUser2,
	// ];

	// const participants = [
	// 	callee,
	// ];

	const options: CreateCallOptions = {
		sourceCallIdNumber: acsCallerPhoneNumber,
		callIntelligenceOptions: {
			cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT
		},
		operationContext: "groupCallContext",
	}

	const callbackUri = process.env.CALLBACK_HOST_URI + "/api/callbacks"
	//console.log(callbackUri);
	try {
		//await acsClient.createGroupCall(participants, callbackUri, options);
		const result = await acsClient.createGroupCall(participants, callbackUri, options);
		// const callConnectionProperties = result.callConnectionProperties;
		// console.log(`Group call callback uri:-->${callConnectionProperties.callbackUrl}`);
		// callConnection = result.callConnection;
		// callMedia = callConnection.getCallMedia();
		// console.log(`Group call connected.`)
		// const response = await callConnection.listParticipants();
		// const participantCount = response.values.length;
		// const participantList: CallParticipant[] = response.values;
		// console.log(`Total participants in group call--> ${participantCount}`);
		// console.log(`participants:-->${JSON.stringify(participantList)}`);
		// await hangupOrTerminateCall(callConnectionProperties.callConnectionId, true);
	} catch (e) {
		console.log(e)
	}
}

async function createPstnCall() {
	const callInvite: CallInvite = {
		targetParticipant: acsPhoneNumber,
		sourceCallIdNumber: acsCallerPhoneNumber,
	};
	console.log("Starting call and redirecting/transfering....");
	await acsClient.createCall(callInvite, process.env.CALLBACK_HOST_URI + "/api/callbacks");
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
		console.log("INCOMING CALL..");
		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		guid = uuid;
		const callbackUri = `${process.env.CALLBACK_HOST_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICE_ENDPOINT.trim()}`);
		if (isRejectCall) {
			await acsClient.rejectCall(incomingCallContext);
			console.log(`Call Rejected, recject call setting is ${isRejectCall}`);
		} else if (isRedirectCall) {
			console.log(`Is call redirect:--> ${isRedirectCall}`);
			const callInvite: CallInvite = {
				targetParticipant: targetPhoneNumber,
				sourceCallIdNumber: acsPhoneNumber,
			};

			await acsClient.redirectCall(incomingCallContext, callInvite);
			console.log(`Call redirected. Call automation has no control.`);

		} else {
			const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT.trim(), };
			const answerCallOptions: AnswerCallOptions = {
				callIntelligenceOptions: callIntelligenceOptions,
				operationContext: "incomingCallContext"
			};
			answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
		}
	}
});
//For outbound use /api/callbacks instead of /api/callbacks/:contextId
//app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
app.post('/api/callbacks', async (req: any, res: any) => {
	//const contextId = req.params.contextId;
	const event = req.body[0];
	const eventData = event.data;
	console.log("----------------------------------------------------------------------------------------------------------------");
	console.log("Received eventType=%s, callConnectionId=%s, correlationId=%s, serverCallId=%s, context=%s",
		event.type, eventData.callConnectionId, eventData.correlationId, eventData.serverCallId, eventData.operationContext);
	console.log("----------------------------------------------------------------------------------------------------------------");
	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
		console.log("Current operation context.." + eventData.operationContext)
		if (!connectApiCalled) {
			await connectCall();
		}
		if (eventData.operationContext === "connectCallContext") {
			console.log("Connect api connected call....");
			callConnection = acsClient.getCallConnection(eventData.callConnectionId);
			callMedia = callConnection.getCallMedia();
			const callConnectionProperties = await acsClient.getCallConnection(eventData.callConnectionId).getCallConnectionProperties();

			console.log("*****CORRELATION ID*****:-->" + callConnectionProperties.correlationId);
			console.log("CONNECTION ID:-->" + callConnectionProperties.callConnectionId);

			// const callInvite: CallInvite = {
			// 	targetParticipant: { phoneNumber: process.env.TARGET_PHONE_NUMBER },
			// 	sourceCallIdNumber: {
			// 		phoneNumber: process.env.ACS_PHONE_NUMBER || "",
			// 	},
			// };

			// const addParticipantOptions: AddParticipantOptions = {
			// 	operationContext: "pstnUserContext"
			// }

			const callInvite: CallInvite = {
				targetParticipant: { communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-7dfd-b993-99c6-593a0d00423b" },
			};

			const addParticipantOptions: AddParticipantOptions = {
				operationContext: "voipConext",
				invitationTimeoutInSeconds: 15
			}


			const participants = await callConnection.listParticipants();
			participants.values.forEach(element => {
				console.log("Users in call:-->" + JSON.stringify(element.identifier))
			});
			const response = await callConnection.addParticipant(callInvite, addParticipantOptions)
			console.log(response.invitationId)
		}

	}
	else if (event.type === "Microsoft.Communication.ConnectFailed") {
		const resultInformation = eventData.resultInformation
		console.log(JSON.stringify(resultInformation));
	}
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		console.log("Received RecognizeCompleted event");
		if (eventData.recognitionType === "choices") {
			const labelDetected = eventData.choiceResult.label;
			console.log(`Detected label:--> ${labelDetected}`);
			if (labelDetected.toLowerCase() === confirmLabel.toLowerCase()) {
				console.log(`Moving towords dtmf test.`);
				await startRecognizing(targetPhoneNumber, callMedia, dtmfPrompt, "dtmfContext", true);
			}
			else {
				console.log(`Moving towords continuous dtmf & send dtmf tones test.`);
				await startContinuousDtmf(callMedia);
			}
		}
		if (eventData.recognitionType === "dtmf") {
			const tones = eventData.dtmfResult.tones;
			console.log(`DTMF TONES:-->${tones}`);
			console.log(`Current context-->${eventData.operationContext}`);
			await callConnection.removeParticipant(targetPhoneNumber);
		}
		if (eventData.recognitionType === "speech") {
			const text = eventData.speechResult.speech;
			console.log("Recognition completed, text=%s, context=%s", text, eventData.operationContext);
			await hangupOrTerminateCall(eventData.callConnectionId, true);
		}
	} else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		console.log("Received RecognizeFailed event")
		await startRecognizing(targetPhoneNumber, callMedia, "test", "retryContext", false)
		console.log(`Cancelling all media operations.`)
		await callMedia.cancelAllOperations();
		console.log(`cancel add participant test initiated.`);
		const callInvite: CallInvite = { targetParticipant: acsCallerPhoneNumber, sourceCallIdNumber: acsPhoneNumber }
		const response = await callConnection.addParticipant(callInvite);
		console.log(`Invitation Id:--> ${response.invitationId}`);
		await callConnection.cancelAddParticipantOperation(response.invitationId);
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted") {
		console.log("Received PlayCompleted event")
		console.log(`Context:-->${eventData.operationContext}`);
	}
	else if (event.type === "Microsoft.Communication.playFailed") {
		console.log("Received playFailed event")
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
		await hangupOrTerminateCall(eventData.callConnectionId, true);
	}
	else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
		console.log("Received AddParticipantSucceeded event")
		console.log(`Participant:-> ${JSON.stringify(eventData.participant)}`)
		// if (eventData.operationContext === "pstnUserContext") {
		// 	console.log("PSTN user added.");

		const response = await callConnection.listParticipants();
		const participantCount = response.values.length;
		const participantList: CallParticipant[] = response.values;
		console.log(`Total participants in call--> ${participantCount}`);
		console.log(`participants:-->${JSON.stringify(participantList)}`);

		const muteVoipUser: CommunicationUserIdentifier = {
			communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-7dfd-bb91-ec8d-084822004bd2"
		}

		const result = await callConnection.muteParticipant(muteVoipUser);
		if (result) {
			console.log(`Participant is muted. wating for confirming.....`);
			const response = await callConnection.getParticipant(muteVoipUser);
			console.log(`Is participant muted:--> ${response.isMuted}`);
			console.log(`Mute participant test completed.`);
		}

		const participant: CommunicationUserIdentifier = {
			communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000020-7dfd-b993-99c6-593a0d00423b"
		}

		await callConnection.removeParticipant(participant)
		await hangupOrTerminateCall(eventData.callConnectionId, true);
		//await startRecognizing(targetPhoneNumber, callMedia, pstnUserPrompt, "recognizeContext", false)
		// }
	}
	else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
		console.log("Received AddParticipantFailed event")
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
		await hangupOrTerminateCall(eventData.callConnectionId, true);
	}
	else if (event.type === "Microsoft.Communication.RemoveParticipantSucceeded") {
		console.log("Received RemoveParticipantSucceeded event");
		console.log("Playing message. Stand by....")
		//await handlePlayAsync(callMedia, handlePrompt, "handlePromptContext");
	}
	else if (event.type === "Microsoft.Communication.RemoveParticipantFailed") {
		console.log("Received RemoveParticipantFailed event")
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived") {
		console.log("Received ContinuousDtmfRecognitionToneReceived event")
		console.log(`Tone received:--> ${eventData.tone}`);
		console.log(`SequenceId:--> ${eventData.sequenceId}`);
		await stopContinuousDtmf(callMedia);
		//await handlePlayAsync(callMedia, "this is dtmf test", "continuousDtmfPlayContext");
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed") {
		console.log("Received ContinuousDtmfRecognitionToneFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionStopped") {
		console.log("Received ContinuousDtmfRecognitionStopped event")
		await startSendingDtmfTone();
	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
		console.log("Received SendDtmfTonesCompleted event")
		await callConnection.removeParticipant(targetPhoneNumber);
		console.log(`Send Dtmf tone completed. ${targetPhoneNumber.phoneNumber} will be removed from call.`);
	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
		console.log("Received SendDtmfTonesFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CallTransferAccepted") {
		console.log("Received CallTransferAccepted event")
		console.log(`Call transfer test completed.`);
		console.log(`Call automation has no control.`)
	}
	else if (event.type === "Microsoft.Communication.CallTransferFailed") {
		console.log("Received CallTransferFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
		await hangupOrTerminateCall(eventData.callConnectionId, true);
	}
	else if (event.type === "Microsoft.Communication.CancelAddParticipantSucceeded") {
		console.log("Received CancelAddParticipantSucceeded event");
		console.log(`Invitation Id:--> ${eventData.invitationId}`);
		console.log(`Cancel add participant test completed.`);
		console.log(`Operation Context:-->${eventData.operationContext}`);
		await hangupOrTerminateCall(eventData.callConnectionId, true);
	}
	else if (event.type === "Microsoft.Communication.CancelAddParticipantFailed") {
		console.log("Received CancelAddParticipantFailed event")
		console.log(`Message:-->${eventData.resultInformation.message}`);
		await hangupOrTerminateCall(eventData.callConnectionId, true);
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
		recordingDeleteLocation = eventData.recordingStorageInfo.recordingChunks[0].deleteLocation
		console.log(`CONTENT LOCATION:-->${recordingLocation}`);
		console.log(`METADATA LOCATION:-->${recordingMetadataLocation}`);
		console.log(`DELETE LOCATION:-->${recordingDeleteLocation}`);
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

async function handlePlayAsync(callConnectionMedia: CallMedia, textToPlay: string, context: string) {

	// const play: FileSource = {
	// 	url: MEDIA_URI + "MainMenu.wav",
	// 	kind: "fileSource",
	// };

	const play: TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource" }
	const playOptions: PlayOptions = { operationContext: context, loop: false };
	//await callConnectionMedia.play([play], [targetPhoneNumber], playOptions);

	await callConnectionMedia.playToAll([play], playOptions);
	// delayWithSetTimeout();
	//await callMedia.cancelAllOperations();
}

async function startRecording(serverCallId: string) {
	console.log(`IS BYOS--> ${isByos}`);
	if (isByos) {
		console.log(`BYOS URL--> ${bringYourOwnStorageUrl}`);
	}

	const callLocator: CallLocator = {
		id: serverCallId,
		kind: "serverCallLocator",
	};
	const recordingStorage: RecordingStorage = {
		recordingStorageKind: "azureBlobStorage",
		recordingDestinationContainerUrl: bringYourOwnStorageUrl
	}
	const recordingOptions: StartRecordingOptions = {
		callLocator: callLocator,
		recordingContent: "audio",
		recordingChannel: "unmixed",
		recordingFormat: "wav",
		pauseOnStart: isPauseOnStart,
		recordingStorage: isByos === true ? recordingStorage : undefined,
	};
	const response = await acsClient.getCallRecording().start(recordingOptions);
	recordingId = response.recordingId;
	console.log(`Recording Id--> ${recordingId}`);
	printCurrentTime();
	console.log(`Pause on start--> ${isPauseOnStart}`);
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

async function startRecognizing(target: CommunicationIdentifier, CallMedia, textToPlay: string, context: string, isDtmf: boolean) {
	const playSource: TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource" };

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

	const recognizeOptions = isDtmf ? recognizeDtmfOptions : recognizeChoiceOptions;

	await callMedia.startRecognizing(target, recognizeOptions)
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
	await callMedia.startContinuousDtmfRecognition(targetPhoneNumber)
	console.log(`Continuous Dtmf recognition started. press one on dialpad.`)
}

async function stopContinuousDtmf(callMedia: CallMedia) {
	await callMedia.stopContinuousDtmfRecognition(targetPhoneNumber)
	console.log(`Continuous Dtmf recognition stopped. wait for sending dtmf tones.`)
}

async function startSendingDtmfTone() {

	const tones: Tone[] = [
		"zero",
		"one"
	];
	await callMedia.sendDtmfTones(tones, targetPhoneNumber)
	console.log(`Send dtmf tones started. respond over phone.`)
}

async function hangupOrTerminateCall(callConnectionId: string, isTerminate: boolean) {
	await acsClient.getCallConnection(callConnectionId).hangUp(isTerminate);
}

// GET endpoint to place call
app.get('/createCall', async (req, res) => {
	await createCall();
	res.redirect('/');
});

// GET endpoint to initiate transfer call
app.get('/createPstnCall', async (req, res) => {
	await createPstnCall();
	res.redirect('/');
});

// GET endpoint to initiate oubound call
app.get('/outboundCall', async (req, res) => {
	await createOutboundCall();
	res.redirect('/');
});

// GET endpoint to initiate group call
app.get('/createGroupCall', async (req, res) => {
	await createGroupCall();
	res.redirect('/');
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

// Start the server
app.listen(PORT, async () => {
	console.log(`Please check env settings before initiating call.`)
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
