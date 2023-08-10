import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CallAutomationClient, CallInvite, ContinuousDtmfRecognitionOptions } from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callAutomationclient: CallAutomationClient;
let c2Target = process.env.TARGET_PHONE_NUMBER;

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	callAutomationclient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/index.html', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

app.get('/outboundCall', async (req, res) => {
	const target: PhoneNumberIdentifier = { phoneNumber: c2Target };
	const caller: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER };
	const callInvite: CallInvite = { targetParticipant: target, sourceCallIdNumber: caller };
	await callAutomationclient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks");
	console.log("createCall");

	res.redirect('/index.html');
});

app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	const callConnectionId = eventData.callConnectionId;
	console.log("Received event %s for call connection id %s", event.type, eventData.callConnectionId);

	if (event.type === "Microsoft.Communication.CallConnected") {
		// Start continuous DTMF recognition
		const continuousDtmfRecognitionOptions: ContinuousDtmfRecognitionOptions = { operationContext: "dtmf-reco-on-c2" };
		await callAutomationclient.getCallConnection(callConnectionId)
			.getCallMedia()
			.startContinuousDtmfRecognition({ phoneNumber: c2Target }, continuousDtmfRecognitionOptions);
		console.log("Started continuous DTMF recognition");
	} 

	if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived") {
		console.log("Tone detected: sequenceId=%s, tone=%s, context=%s",
			eventData.toneInfo.sequenceId,
			eventData.toneInfo.tone,
			eventData.operationContext);

		const continuousDtmfRecognitionOptions: ContinuousDtmfRecognitionOptions = { operationContext: "dtmf-reco-on-c2" };
		await callAutomationclient.getCallConnection(callConnectionId)
			.getCallMedia()
			.stopContinuousDtmfRecognition({ phoneNumber: c2Target }, continuousDtmfRecognitionOptions);
		console.log("Stopped continuous DTMF recognition");
	} 
	if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed") {
		console.log("Tone failed: result=%s, context=%s", eventData.resultInformation.message, eventData.operationContext);
	} 
	if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionStopped") {
		console.log("Tone stopped: context=%s", eventData.operationContext);
	} 

	res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
