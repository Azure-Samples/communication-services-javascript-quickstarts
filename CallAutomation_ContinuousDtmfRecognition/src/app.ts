import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CallAutomationClient, CallConnection, CallInvite, DtmfTone } from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let acsClient: CallAutomationClient;

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/index.html', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

app.get('/outboundCall', async (req, res) => {
	const caller: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER };
	const target: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER };
	const callInvite: CallInvite = { targetParticipant: target, sourceCallIdNumber: caller };
	await acsClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks");
	console.log("createCall");

	res.redirect('/index.html');
});

app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	console.log("Received event %s for call connection id %s", event.type, eventData.callConnectionId);
	const callConnection = acsClient.getCallConnection(eventData.callConnectionId);
	const callMedia = callConnection.getCallMedia();

	if (event.type === "Microsoft.Communication.CallConnected") {
		// Start continuous DTMF recognition
		const targetParticipant: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER };
		await callConnection.getCallMedia().startContinuousDtmfRecognition(targetParticipant);
		console.log("startContinuousDtmfRecognition");
	} 
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived") {
		console.log("DTMF tone received: %s", eventData.toneInfo.tone);
		await callConnection.hangUp(true);
	} 
	else if (event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed") {
		console.log("startContinuousDtmfRecognition failed with resultInformation: %s", eventData.resultInformation.message);
		await callConnection.hangUp(true);
	} 

	res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
