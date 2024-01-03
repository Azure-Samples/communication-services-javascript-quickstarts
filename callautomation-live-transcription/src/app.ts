import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier, createIdentifierFromRawId } from "@azure/communication-common";
import {
	CallAutomationClient, CallConnection, AnswerCallOptions, CallMedia,
	TextSource, AnswerCallResult,
	CallIntelligenceOptions, PlayOptions,
	CallMediaRecognizeDtmfOptions,
	TranscriptionConfiguration,
	CallLocator, StartRecordingOptions, CallInvite
}
	from "@azure/communication-call-automation";
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
let callMedia: CallMedia;

const helpIVRPrompt = "Welcome to the Contoso Utilities. To access your account, we need to verify your identity. Please enter your date of birth in the format DDMMYYYY using the keypad on your phone. Once we’ve validated your identity we will connect you to the next available agent. Thank you!";
const addAgentPrompt = "Thank you for verifying your identity. We are now connecting you to the next available agent. Please hold the line and we will be with you shortly. Thank you for your patience.";
const incorrectDobPrompt = "Sorry, we were unable to verify your identity based on the date of birth you entered. Please try again. Remember to enter your date of birth in the format DDMMYYYY using the keypad on your phone. Thank you!";
const addParticipantFailurePrompt = "We're sorry, we were unable to connect you to an agent at this time, we will get the next available agent to call you back as soon as possible.";
const goodbyePrompt = "Thank you for calling Contoso Utilities. We hope we were able to assist you today. Goodbye";
const timeoutSilencePrompt = "I’m sorry, I didn’t receive any input. Please type your date of birth in the format of DDMMYYYY.";
const goodbyeContext = "Goodbye";
const addAgentContext = "AddAgent";
const incorrectDobContext = "IncorrectDob";
const addParticipantFailureContext = "FailedToAddParticipant";
const DobRegex = "^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[012])[12][0-9]{3}$";
let isTrasncriptionActive = false;
var maxTimeout = 2;
const wordToNumberMapping = {
	zero: '0',
	one: '1',
	two: '2',
	three: '3',
	four: '4',
	five: '5',
	six: '6',
	seven: '7',
	eight: '8',
	nine: '9'
};

let recordingId: string;
let recordingLocation: string;
const agentPhonenumber = process.env.AGENT_PHONE_NUMBER;
const acsPhoneNumber = process.env.ACS_PHONE_NUMBER;
const transportUrl = process.env.TRANSPORT_URL;
const transportType = process.env.TRANSPORT_TYPE;
const locale = process.env.LOCALE;

async function createAcsClient() {
	const connectionString = process.env.ACS_CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
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
		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		const callbackUri = `${process.env.CALLBACK_HOST_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICE_ENDPOINT.trim()}`);
		const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT.trim() };
		const transcriptionConfiguration: TranscriptionConfiguration = { transportUrl: transportUrl, transportType: transportType, locale: locale, startTranscription: false }
		const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions, transcriptionConfiguration: transcriptionConfiguration };
		console.log(`TranscriptionOption:" ${JSON.stringify(transcriptionConfiguration)}`);
		answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
		callConnection = answerCallResult.callConnection;
	}
});

app.post('/api/callbacks/:contextId', async (req: any, res: any) => {
	const contextId = req.params.contextId;
	const event = req.body[0];
	const eventData = event.data;

	console.log("Received eventType=%s, callConnectionId=%s, correlationId=%s, serverCallId=%s, context=%s",
	event.type , eventData.callConnectionId, eventData.correlationId, eventData.serverCallId, eventData.operationContext);
	console.log(`event type match ${event.type === "Microsoft.Communication.CallConnected"}`);
	if (event.type === "Microsoft.Communication.CallConnected") {
		await startRecording(eventData.serverCallId);
		console.log(`Recording started. RecordingId: ${recordingId}`);
		callMedia = acsClient.getCallConnection(eventData.callConnectionId).getCallMedia();
		await initiateTranscription(callMedia);
		console.log("Transcription initiated.");
		await pauseOrStopTranscriptionAndRecording(callMedia, false, recordingId);

		/* Play hello prompt to user */
		await handleDtmfRecognizeAsync(callMedia, callerId, helpIVRPrompt, "hellocontext");
	}
	else if (event.type === "Microsoft.Communication.PlayCompleted") {
		if (eventData.operationContext === addAgentContext) {
			// target number and source number
			const target: PhoneNumberIdentifier = { phoneNumber: agentPhonenumber };
			const source: PhoneNumberIdentifier = { phoneNumber: acsPhoneNumber };
			// make an invitation
			const callInvite: CallInvite = { targetParticipant: target, sourceCallIdNumber: source }
			const addParticipantOptions = { operationContext: addAgentContext };
			const addParticipantResult = await acsClient.getCallConnection(eventData.callConnectionId).addParticipant(callInvite, addParticipantOptions);
			console.log(`Adding agent to the call: ${addParticipantResult.invitationId}`);
		} 
		else if ( eventData.operationContext === goodbyeContext ||
			eventData.operationContext === addParticipantFailureContext )
		{
			await pauseOrStopTranscriptionAndRecording(callMedia, true, recordingId);
			await acsClient.getCallConnection(eventData.callConnectionId).hangUp(true);
		}
	}
	else if (event.type === "Microsoft.Communication.playFailed") { 
		await pauseOrStopTranscriptionAndRecording(callMedia, true, recordingId);
		await acsClient.getCallConnection(eventData.callConnectionId).hangUp(true);
	}
	else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
		console.log("Recognition completed, tones=%s, context=%s", eventData.dtmfResult.tones, eventData.operationContext);
		const dobValueNumbers = convertWordsArrayToNumberString(eventData.dtmfResult.tones)

		// Take action for Recognition through DTMF
		const regex = new RegExp(DobRegex);
		const match = regex.exec(dobValueNumbers);
		if (match && match[0]) {
			await resumeTranscriptionAndRecording(callMedia, recordingId);
			await handlePlayAsync(callMedia, addAgentPrompt, addAgentContext);
		} 
		else {
			await handleDtmfRecognizeAsync(callMedia, callerId, incorrectDobPrompt, incorrectDobContext);
		} 
	}
	else if (event.type === "Microsoft.Communication.RecognizeFailed") {
		const resultInformation = eventData.resultInformation
		var code = resultInformation.subCode;
		if (code === 8510 && maxTimeout > 0) {
			console.log("Retrying recognize...");
			maxTimeout--;
			await handleDtmfRecognizeAsync(callMedia, callerId, timeoutSilencePrompt, "retryContext");
		} else {
			await handlePlayAsync(callMedia, goodbyePrompt, goodbyeContext);
		}
	}
	else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
		console.log("Received call event: {type}, context: {con}",
			event.type, eventData.OperationContext);
	}
	else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
		await handlePlayAsync(callMedia, addParticipantFailurePrompt, addParticipantFailureContext);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionStarted") {
		console.log("Received transcription event: {type}", event.type);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionResumed") {
		isTrasncriptionActive = true;
		console.log("Received transcription event: {type}", event.type);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionStopped") {
		isTrasncriptionActive = false;
		console.log(`Received transcription event: ${event.constructor.name}`);
	}
	else if (event.type === "Microsoft.Communication.TranscriptionFailed") {
		console.log("Received transcription event=%s, CorrelationId=%s, SubCode=%s, Message=%s",
			event.type,
			eventData.CorrelationId,
			eventData?.ResultInformation?.SubCode,
			eventData?.ResultInformation?.Message);
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
	console.log("Received transcription event=%s", event.eventType)
	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		res.status(200).json({
			validationResponse: eventData.validationCode,
		});
	}
	else if (event.eventType === "Microsoft.Communication.RecordingFileStatusUpdated") {
		recordingLocation = eventData.recordingStorageInfo.recordingChunks[0].contentLocation
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
		// Set the appropriate response headers for the file download
		res.setHeader('Content-Disposition', 'attachment; filename="recording.wav"');
		res.setHeader('Content-Type', 'audio/wav');
		const recordingStream = await acsClient.getCallRecording().downloadStreaming(recordingLocation);

		// Pipe the recording stream to the response object
		recordingStream.pipe(res);
	}
});

async function resumeTranscriptionAndRecording(callMedia: CallMedia, recordingId: string) {
	await initiateTranscription(callMedia);
	console.log("Transcription reinitiated.");

	await acsClient.getCallRecording().resume(recordingId);
	console.log(`Recording resumed. RecordingId: ${recordingId}`);
}

async function pauseOrStopTranscriptionAndRecording(callMedia: CallMedia, stopRecording: boolean, recordingId: string) {
	if (isTrasncriptionActive) {
		await callMedia.stopTranscription();
		console.log("Transcription stopped.");
	}
	console.log(`stopRecording = ${stopRecording}`);
	if (stopRecording) {
		await acsClient.getCallRecording().stop(recordingId);
		console.log(`Recording stopped. RecordingId: ${recordingId}`);
	} else {
		await acsClient.getCallRecording().pause(recordingId);
		console.log(`Recording paused. RecordingId: ${recordingId}`);
	}
}

async function handleDtmfRecognizeAsync(callMedia: CallMedia, callerId: string, message: string, context: string) {
	const play: TextSource = { text: message, voiceName: "en-US-NancyNeural", kind: "textSource" }
	const recognizeOptions: CallMediaRecognizeDtmfOptions = {
		playPrompt: play,
		interToneTimeoutInSeconds: 5,
		initialSilenceTimeoutInSeconds: 15,
		maxTonesToCollect: 8,
		interruptPrompt: false,
		operationContext: context,
		kind: "callMediaRecognizeDtmfOptions",
	};

	const targetParticipant = createIdentifierFromRawId(callerId);
	console.log(JSON.stringify(targetParticipant));
	await callMedia.startRecognizing(targetParticipant, recognizeOptions)
}

async function handlePlayAsync(callConnectionMedia: CallMedia, textToPlay: string, context: string) {
	const play: TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource" }
	const playOptions: PlayOptions = { operationContext: context };
	await callConnectionMedia.playToAll([play], playOptions);
}
async function initiateTranscription(callConnectionMedia: CallMedia) {
	const startTranscriptionOptions = {
		locale:locale,
		operationContext: "StartTranscript"
	};

	await callConnectionMedia.startTranscription(startTranscriptionOptions);
	isTrasncriptionActive = true;
}
async function startRecording(serverCallId: string) {
	const callLocator: CallLocator = {
		id: serverCallId,
		kind: "serverCallLocator",
	};

	const recordingOptions: StartRecordingOptions = { callLocator: callLocator };
	const response = await acsClient.getCallRecording().start(recordingOptions);
	recordingId = response.recordingId;
}

//Function to convert dob into numeric string from words.
function convertWordsArrayToNumberString(wordArray) {
	const numbers = wordArray.map(word => wordToNumberMapping[word.toLowerCase()] || word);
	const result = numbers.join('');
	return result;
}

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
