import { config } from 'dotenv';
import fs, { accessSync } from "fs";
import express, { Application } from 'express';
import { CommunicationIdentifier, CommunicationUserIdentifier, isCommunicationUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
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
	FileSource,
	SsmlSource,
	PlayToAllOptions,
	PlayOptions,
	CallMediaRecognizeSpeechOptions,
	CallMediaRecognizeSpeechOrDtmfOptions,
	CallMediaRecognizeDtmfOptions,
	Tone,
	CallLocator,
	StartRecordingOptions,
	RecordingStorage,
	AddParticipantOptions,
	TransferCallToParticipantOptions,
	MediaStreamingOptions,
	TranscriptionOptions,
	StartMediaStreamingOptions,
	StopMediaStreamingOptions,
	StartTranscriptionOptions,
	UpdateTranscriptionOptions,
	StopTranscriptionOptions,
	HoldOptions,
	UnholdOptions
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

const confirmLabel = `Confirm`;
const cancelLabel = `Cancel`;
const MEDIA_URI = process.env.CALLBACK_URI + "/audioprompt/";
const isByos = process.env.IS_BYOS.trim().toLowerCase() === "true" ? true : false;
const bringYourOwnStorageUrl = process.env.BRING_YOUR_OWN_STORAGE_URL;
const isPauseOnStart = process.env.PAUSE_ON_START.trim().toLowerCase() === "true" ? true : false;
const targetPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER.trim() };
const participantPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER.trim() };
const acsPhoneNumber: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER.trim() };
const targetCommuncationUser: CommunicationUserIdentifier = { communicationUserId: process.env.TARGET_COMMUNICATION_USER.trim() }
const participantCommuncationUser: CommunicationUserIdentifier = { communicationUserId: process.env.PARTICIPANT_COMMUNICATION_USER.trim() }
const transportUrl = process.env.TRANSPORT_URL.trim()
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
		transportUrl: transportUrl,
		transportType: "websocket",
		contentType: "audio",
		audioChannelType: "unmixed",
		startMediaStreaming: false
	}

	const transcriptionOptions: TranscriptionOptions = {
		transportUrl: transportUrl,
		transportType: "websocket",
		locale: "en-US",
		startTranscription: false
	}

	const options: CreateCallOptions = {
		callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT },
		// mediaStreamingOptions: mediaStreamingOptions,
		// transcriptionOptions: transcriptionOptions,
	};
	console.log("Placing outbound call...");
	await acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", options);
}

async function createGroupCall() {

	const mediaStreamingOptions: MediaStreamingOptions = {
		transportUrl: transportUrl,
		transportType: "websocket",
		contentType: "audio",
		audioChannelType: "unmixed",
		startMediaStreaming: false
	}

	const transcriptionOptions: TranscriptionOptions = {
		transportUrl: transportUrl,
		transportType: "websocket",
		locale: "en-US",
		startTranscription: false
	}
	const targets = [
		targetPhoneNumber, participantPhoneNumber
	]
	const options: CreateCallOptions = {
		callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT },
		operationContext: "groupCallContext",
		sourceCallIdNumber: acsPhoneNumber,
		// mediaStreamingOptions: mediaStreamingOptions,
		// transcriptionOptions: transcriptionOptions,
	};
	console.log("Placing outbound call...");
	await acsClient.createGroupCall(targets, process.env.CALLBACK_URI + "/api/callbacks", options);
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

async function hangUpCallAsync() {
	await acsClient.getCallConnection(callConnectionId).hangUp(false)
}

async function terminateCallAsync() {
	await acsClient.getCallConnection(callConnectionId).hangUp(true)
}

async function playMediaAsync() {

	const isPlayToAll = false;

	const textSource: TextSource = { text: "", voiceName: "en-US-NancyNeural", kind: "textSource" }

	const fileSource: FileSource = {
		url: MEDIA_URI + "MainMenu.wav", kind: "fileSource",
	};

	const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" }

	const playSources = [textSource, fileSource, ssmlSource]

	if (isPlayToAll) {
		const playToAllOptions: PlayToAllOptions = {
			operationContext: "playToAllContext"
		}

		await acsClient.getCallConnection(callConnectionId).getCallMedia().playToAll(playSources, playToAllOptions)
	}
	else {
		const target = GetCommunicationTarget();
		const playOptions: PlayOptions = {
			operationContext: "playToContext"
		}
		await acsClient.getCallConnection(callConnectionId).getCallMedia().play(playSources, [target], playOptions)
	}

}

async function playRecognizeAsync() {

	const textSource: TextSource = { text: "", voiceName: "en-US-NancyNeural", kind: "textSource" }

	const fileSource: FileSource = {
		url: MEDIA_URI + "MainMenu.wav", kind: "fileSource",
	};

	const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" }

	const recognizeChoiceOptions: CallMediaRecognizeChoiceOptions = {
		choices: await getChoices(),
		interruptPrompt: false,
		initialSilenceTimeoutInSeconds: 10,
		playPrompt: textSource,
		operationContext: "choiceContex",
		kind: "callMediaRecognizeChoiceOptions"
	};

	const recognizeDtmfOptions: CallMediaRecognizeDtmfOptions = {
		playPrompt: textSource,
		interToneTimeoutInSeconds: 5,
		initialSilenceTimeoutInSeconds: 15,
		maxTonesToCollect: 4,
		interruptPrompt: false,
		operationContext: "dtmfContext",
		kind: "callMediaRecognizeDtmfOptions",
	};

	const recognizeSpeechOptions: CallMediaRecognizeSpeechOptions = {
		endSilenceTimeoutInSeconds: 1,
		playPrompt: textSource,
		operationContext: "speechContext",
		kind: "callMediaRecognizeSpeechOptions",
	}

	const recongnizeSpeechOrDtmfOptions: CallMediaRecognizeSpeechOrDtmfOptions = {
		maxTonesToCollect: 2,
		endSilenceTimeoutInSeconds: 1,
		playPrompt: textSource,
		initialSilenceTimeoutInSeconds: 30,
		interruptPrompt: true,
		operationContext: "sppechOrDtmfContext",
		kind: "callMediaRecognizeSpeechOrDtmfOptions",
	}

	const target = GetCommunicationTarget();

	await acsClient.getCallConnection(callConnectionId).getCallMedia().startRecognizing(target, recognizeChoiceOptions)

}

async function startContinuousDtmfAsync() {
	const target = GetCommunicationTarget()
	await acsClient.getCallConnection(callConnectionId).getCallMedia().startContinuousDtmfRecognition(target)
	console.log(`Continuous Dtmf recognition started. press one on dialpad.`)
}

async function stopContinuousDtmfAsync() {
	const target = GetCommunicationTarget()
	await acsClient.getCallConnection(callConnectionId).getCallMedia().stopContinuousDtmfRecognition(target)
	console.log(`Continuous Dtmf recognition stopped.`)
}

async function startSendingDtmfToneAsync() {
	const tones: Tone[] = [
		"zero",
		"one"
	];
	const target = GetCommunicationTarget()
	await acsClient.getCallConnection(callConnectionId).getCallMedia().sendDtmfTones(tones, target)
	console.log(`Send dtmf tones started.`)
}

async function startRecordingAsync() {

	const callConnectionProperties = await acsClient.getCallConnection(callConnectionId).getCallConnectionProperties();
	const serverCallId = callConnectionProperties.serverCallId;

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
	console.log(`Pause on start--> ${isPauseOnStart}`);
}

async function pauseRecordingAsync() {
	if (recordingId) {
		await getRecordingState(recordingId);
		if (recordingState === "active") {
			await acsClient.getCallRecording().pause(recordingId);
		}
		else {
			console.log(`Recording is inactive.`);
		}
	}
	else {
		console.log(`Recording id is empty.`);
	}
}
async function resumeRecordingAsync() {

	if (recordingId) {
		await getRecordingState(recordingId);
		if (recordingState === "inactive") {
			await acsClient.getCallRecording().resume(recordingId);
		}
		else {
			console.log(`Recording is already active.`);
		}
	}
	else {
		console.log(`Recording id is empty.`);
	}

}

async function stopRecordingAsync() {
	if (recordingId) {
		await getRecordingState(recordingId);
		if (recordingState === "active") {
			await acsClient.getCallRecording().stop(recordingId);
		}
		else {
			console.log(`Recording is already inactive.`);
		}
	}
	else {
		console.log(`Recording id is empty.`);
	}
}

async function getRecordingState(recordingId: string) {
	const response = await acsClient.getCallRecording().getState(recordingId);
	recordingState = response.recordingState;
	console.log(`Recording current state-->${recordingState}`);
}

async function addParticipantAsync() {

	const isCancelAddParticipant = false;

	const callInvite: CallInvite = { targetParticipant: participantPhoneNumber, sourceCallIdNumber: acsPhoneNumber }
	const options: AddParticipantOptions = {
		operationContext: "addPstnUserContext",
		invitationTimeoutInSeconds: 30,
	}

	const response = await acsClient.getCallConnection(callConnectionId).addParticipant(callInvite, options);

	if (isCancelAddParticipant) {
		await acsClient.getCallConnection(callConnectionId).cancelAddParticipantOperation(response.invitationId);
	}
}

async function removeParticipantAsync() {
	await acsClient.getCallConnection(callConnectionId).removeParticipant(participantPhoneNumber);
}

async function cancelAddParticipantAsync(invitationId: string) {
	await acsClient.getCallConnection(callConnectionId).cancelAddParticipantOperation(invitationId)
}

async function cancelAllMediaOperationAsync() {
	await acsClient.getCallConnection(callConnectionId).getCallMedia().cancelAllOperations();
}

async function transferCallToParticipantAsync() {
	const options: TransferCallToParticipantOptions = {
		operationContext: "transferCallContext",
		transferee: targetPhoneNumber,
	}
	await callConnection.transferCallToParticipant(participantPhoneNumber, options);
	console.log(`Transfer call initiated.`);
}

async function startMediaStreamingAsync() {
	const streamingOptions: StartMediaStreamingOptions = {
		operationContext: "startMediaStreamingContext",
		operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
	}
	await acsClient.getCallConnection(callConnectionId).getCallMedia().startMediaStreaming(streamingOptions);
}

async function stopMediaStreamingAsync() {
	const streamingOptions: StopMediaStreamingOptions = {
		operationContext: "stopMediaStreamingContext",
		operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
	}
	await acsClient.getCallConnection(callConnectionId).getCallMedia().stopMediaStreaming(streamingOptions);
}

async function startTranscriptionAsync() {
	const startTranscriptionOptions: StartTranscriptionOptions = {
		locale: "en-us",
		operationContext: "startTranscriptionContext"
	}
	await acsClient.getCallConnection(callConnectionId).getCallMedia().startTranscription(startTranscriptionOptions);
}

async function updateTranscriptionAsync() {
	const options: UpdateTranscriptionOptions = {
		operationContext: "updateTranscriptionContext"
	}
	await acsClient.getCallConnection(callConnectionId).getCallMedia().updateTranscription("en-au", options)
}

async function stopTranscriptionAsync() {
	const stopTranscriptionOptions: StopTranscriptionOptions = {
		operationContext: "stopTranscriptionOptions"
	}
	await acsClient.getCallConnection(callConnectionId).getCallMedia().stopTranscription(stopTranscriptionOptions);
}

async function holdParticipantAsync() {

	const textSource: TextSource = { text: "", voiceName: "en-US-NancyNeural", kind: "textSource" }

	const fileSource: FileSource = {
		url: MEDIA_URI + "MainMenu.wav", kind: "fileSource",
	};

	const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" }

	const holdOptions: HoldOptions = {
		playSource: textSource,
		operationContext: "holdUserContext",
		operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
	}
	const target = GetCommunicationTarget()
	await acsClient.getCallConnection(callConnectionId).getCallMedia().hold(target, holdOptions);
}

async function unholdParticipantAsync() {
	const unholdOptions: UnholdOptions = {
		operationContext: "unholdUserContext"
	}

	const target = GetCommunicationTarget()
	await acsClient.getCallConnection(callConnectionId).getCallMedia().unhold(target, unholdOptions);
}

async function playWithInterruptMediaFlagAsync() {

	const textSource: TextSource = { text: "", voiceName: "en-US-NancyNeural", kind: "textSource" }

	const fileSource: FileSource = {
		url: MEDIA_URI + "MainMenu.wav", kind: "fileSource",
	};

	const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" }

	const playSources = [textSource, fileSource, ssmlSource]

	const interruptOption: PlayToAllOptions = {
		loop: true,
		interruptCallMediaOperation: true,
		operationContext: "interruptOperationContext",
		operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks"
	}

	await acsClient.getCallConnection(callConnectionId).getCallMedia().playToAll(playSources, interruptOption)
}

function GetCommunicationTarget(): CommunicationIdentifier {

	const isPstnParticipant = false;
	const isAcsParticipant = false

	const pstnIdentifier = isPstnParticipant ? participantPhoneNumber : targetPhoneNumber
	const target = isAcsParticipant ? participantCommuncationUser : pstnIdentifier

	return target

}

async function getCallProperties(connectionId: string) {
	const response = await acsClient.getCallConnection(connectionId).getCallConnectionProperties();
	return response;
}

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	callConnectionId = eventData.callConnectionId;
	serverCallId = eventData.serverCallId;
	console.log("Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s", callConnectionId, serverCallId, event.type);
	callConnection = acsClient.getCallConnection(callConnectionId);

	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log("Received CallConnected event");
		callConnectionId = eventData.callConnectionId;
		const properties = await getCallProperties(eventData.callConnectionId);
		console.log("CORRELATION ID****--> " + properties.correlationId)
		console.log("CALL CONNECTION ID****--> " + properties.callConnectionId)
		console.log("Answered For:-> " + properties.answeredFor);

		console.log("Media Streaming Subscription Id--> " + properties.mediaStreamingSubscription.id);
		console.log("Media Streaming Subscription State--> " + properties.mediaStreamingSubscription.state);

		console.log("Transcription Subscription Id--> " + properties.transcriptionSubscription.id);
		console.log("Transcription Subscription State--> " + properties.transcriptionSubscription.state);
	}
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		console.log("Received RecognizeCompleted event");
		callConnectionId = eventData.callConnectionId;
		if (eventData.recognitionType === "choices") {
			const labelDetected = eventData.choiceResult.label;
			console.log(`Detected label:--> ${labelDetected}`);
		}
		if (eventData.recognitionType === "dtmf") {
			const tones = eventData.dtmfResult.tones;
			console.log(`DTMF TONES:-->${tones}`);
			console.log(`Current context-->${eventData.operationContext}`);
		}
		if (eventData.recognitionType === "speech") {
			const text = eventData.speechResult.speech;
			console.log("Recognition completed, text=%s, context=%s", text, eventData.operationContext);
		}
	}
	else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		console.log("Received PlayFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.RecognizeCanceled") {
		console.log("Received RecognizeCanceled event");
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.PlayStarted") {
		console.log("Received PlayStarted event");
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted") {
		console.log("Received PlayCompleted event");
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.PlayFailed") {
		console.log("Received PlayFailed event");
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.PlayCanceled") {
		console.log("Received PlayCanceled event");
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
		console.log("Received AddParticipantSucceeded event");
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
		console.log("Received AddParticipantFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.RemoveParticipantSucceeded") {
		console.log("Received RemoveParticipantSucceeded event")
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.RemoveParticipantFailed") {
		console.log("Received RemoveParticipantFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CancelAddParticipantSucceeded") {
		console.log("Received CancelAddParticipantSucceeded event")
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.CancelAddParticipantFailed") {
		console.log("Received CancelAddParticipantFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived") {
		console.log("Received ContinuousDtmfRecognitionToneReceived event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Tone received:--> ${eventData.tone}`);
		console.log(`SequenceId:--> ${eventData.sequenceId}`);
	}
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed") {
		console.log("Received ContinuousDtmfRecognitionToneFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
		console.log("Received SendDtmfTonesCompleted event")
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
		console.log("Received SendDtmfTonesFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.RecordingStateChanged") {
		console.log("Received RecordingStateChanged event")
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.CallTransferAccepted") {
		console.log("Received CallTransferAccepted event")
		callConnectionId = eventData.callConnectionId;
	}
	else if (event.type === "Microsoft.Communication.CallTransferFailed") {
		console.log("Received CallTransferFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.HoldFailed") {
		console.log("Received HoldFailed event")
		callConnectionId = eventData.callConnectionId;
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingStarted") {
		console.log("Received MediaStreamingStarted event")
		callConnectionId = eventData.callConnectionId;
		console.log(eventData.operationContext);
		console.log(eventData.mediaStreamingUpdate.contentType);
		console.log(eventData.mediaStreamingUpdate.mediaStreamingStatus);
		console.log(eventData.mediaStreamingUpdate.mediaStreamingStatusDetails);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingStopped") {
		console.log("Received MediaStreamingStopped event")
		callConnectionId = eventData.callConnectionId;
		console.log(eventData.operationContext);
		console.log(eventData.mediaStreamingUpdate.contentType);
		console.log(eventData.mediaStreamingUpdate.mediaStreamingStatus);
		console.log(eventData.mediaStreamingUpdate.mediaStreamingStatusDetails);
	}
	else if (event.type === "Microsoft.Communication.MediaStreamingFailed") {
		console.log("Received MediaStreamingFailed event")
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionStarted") {
		console.log("Received TranscriptionStarted event")
		callConnectionId = eventData.callConnectionId;
		console.log(eventData.operationContext);
		console.log(eventData.transcriptionUpdate.transcriptionStatus);
		console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionStopped") {
		console.log("Received TranscriptionStopped event")
		callConnectionId = eventData.callConnectionId;
		console.log(eventData.operationContext);
		console.log(eventData.transcriptionUpdate.transcriptionStatus);
		console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionUpdated") {
		console.log("Received TranscriptionUpdated event")
		callConnectionId = eventData.callConnectionId;
		console.log(eventData.operationContext);
		console.log(eventData.transcriptionUpdate.transcriptionStatus);
		console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionFailed") {
		console.log("Received TranscriptionFailed event")
		console.log(`Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`)
		console.log(`Message:->${eventData.resultInformation.message}`);
	}
	else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log("Received CallDisconnected event")
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

app.get('/groupCall', async (req, res) => {
	await createGroupCall();
	res.redirect('/');
});

app.get('/addParticipant', async (req, res) => {
	await addParticipantAsync();
	res.redirect('/');
});

app.get('/removeParticipant', async (req, res) => {
	await removeParticipantAsync();
	res.redirect('/');
});

app.get('/transferCallToParticipant', async (req, res) => {
	await transferCallToParticipantAsync();
	res.redirect('/');
});

app.get('/playMedia', async (req, res) => {
	await playMediaAsync();
	res.redirect('/');
});

app.get('/recognizeMedia', async (req, res) => {
	await playRecognizeAsync();
	res.redirect('/');
});

app.get('/startContinuousDtmf', async (req, res) => {
	await startContinuousDtmfAsync();
	res.redirect('/');
});

app.get('/stopContinuousDtmf', async (req, res) => {
	await stopContinuousDtmfAsync();
	res.redirect('/');
});

app.get('/sendDtmfTones', async (req, res) => {
	await startSendingDtmfToneAsync();
	res.redirect('/');
});

app.get('/startRecording', async (req, res) => {
	await startRecordingAsync();
	res.redirect('/');
});

app.get('/pauseRecording', async (req, res) => {
	await pauseRecordingAsync();
	res.redirect('/');
});

app.get('/resumeRecording', async (req, res) => {
	await resumeRecordingAsync();
	res.redirect('/');
});

app.get('/stopRecording', async (req, res) => {
	await stopRecordingAsync();
	res.redirect('/');
});

app.get('/startMediaStreaming', async (req, res) => {
	await startMediaStreamingAsync();
	res.redirect('/');
});

app.get('/stopMediaStreaming', async (req, res) => {
	await stopMediaStreamingAsync();
	res.redirect('/');
});

app.get('/startTranscription', async (req, res) => {
	await startTranscriptionAsync();
	res.redirect('/');
});

app.get('/updateTranscription', async (req, res) => {
	await updateTranscriptionAsync();
	res.redirect('/');
});

app.get('/stopTranscription', async (req, res) => {
	await stopTranscriptionAsync();
	res.redirect('/');
});

app.get('/holdParticipant', async (req, res) => {
	await holdParticipantAsync();
	res.redirect('/');
});

app.get('/unholdParticipant', async (req, res) => {
	await unholdParticipantAsync();
	res.redirect('/');
});

app.get('/playWithInterruptMediaFlag', async (req, res) => {
	await playWithInterruptMediaFlagAsync();
	res.redirect('/');
});

app.get('/cancelAllMediaOperation', async (req, res) => {
	await cancelAllMediaOperationAsync();
	res.redirect('/');
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
