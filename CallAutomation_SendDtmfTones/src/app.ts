import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CallAutomationClient, CallInvite, 
	DtmfTone, SendDtmfTonesOptions, SendDtmfTonesResult } from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callAutomationClient: CallAutomationClient;
let c2Target = process.env.TARGET_PHONE_NUMBER;

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	callAutomationClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/index.html', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

app.get('/outboundCall', async (req, res) => {
	const target: PhoneNumberIdentifier = { phoneNumber: c2Target };
	const caller: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER };
	const callInvite: CallInvite = { targetParticipant: target, sourceCallIdNumber: caller };
	await callAutomationClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks");
	console.log("createCall");

	res.redirect('/index.html');
});

app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	const callConnectionId = eventData.callConnectionId;
	console.log("Received event %s for call connection id %s", event.type, eventData.callConnectionId);

	if (event.type === "Microsoft.Communication.CallConnected") {
		// Send DTMF tones
		const tones = [ DtmfTone.One, DtmfTone.Two, DtmfTone.Three ];
		const sendDtmfTonesOptions: SendDtmfTonesOptions = { operationContext: "dtmfs-to-ivr" };
		const result: SendDtmfTonesResult = await callAutomationClient.getCallConnection(callConnectionId)
			.getCallMedia()
			.sendDtmfTones(tones, { phoneNumber: c2Target }, sendDtmfTonesOptions);
		console.log("sendDtmfTones, result=%s", result);
	} 
	if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
		console.log("Send dtmf succeeded: context=%s", eventData.operationContext);
	}

	if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
		console.log("sendDtmfTones failed: result=%s, context=%s",
			eventData.resultInformation.message,
			eventData.operationContext);
	} 

	res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
