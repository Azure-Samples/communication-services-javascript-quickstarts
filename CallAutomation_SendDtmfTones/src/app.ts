import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CallAutomationClient, CallConnection, CallMedia, CallInvite, DtmfTone } from "@azure/communication-call-automation";

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
	const callConnection: CallConnection = acsClient.getCallConnection(eventData.callConnectionId);
	const callMedia: CallMedia = callConnection.getCallMedia();

	if (event.type === "Microsoft.Communication.CallConnected") {
		// Send DTMF tones
		const tones = [ DtmfTone.One, DtmfTone.Two, DtmfTone.Three ];
		const targetParticipant: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER };
		await callMedia.sendDtmfTones(tones, targetParticipant);
		console.log("sendDtmf");
	} 
	else if (event.type === "Microsoft.Communication.SendDtmfCompleted") {
		console.log("sendDtmf completed successfully");
		await callConnection.hangUp(true);
	} 
	else if (event.type === "Microsoft.Communication.SendDtmfFailed") {
		console.log("sendDtmf failed with resultInformation: %s", eventData.resultInformation.message);
		await callConnection.hangUp(true);
	} 

	res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
