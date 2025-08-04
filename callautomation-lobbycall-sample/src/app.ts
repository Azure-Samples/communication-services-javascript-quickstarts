import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationUserIdentifier, getIdentifierRawId, isCommunicationUserIdentifier, isPhoneNumberIdentifier, isMicrosoftTeamsUserIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallInvite,
	TextSource,
	PlayOptions,
	MoveParticipantsOptions
} from "@azure/communication-call-automation";
import * as http from 'http';
import * as WebSocket from 'ws';

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('src/webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const connectionString = process.env.CONNECTION_STRING || ""
const callbackUriHost = process.env.CALLBACK_URI || "";
const acsGeneratedIdForLobbyCallReceiver = process.env.ACS_GENERATED_ID_FOR_LOBBY_CALL_RECEIVER || "";
const acsGeneratedIdForTargetCallReceiver = process.env.ACS_GENERATED_ID_FOR_TARGET_CALL_RECEIVER || "";
const acsGeneratedIdForTargetCallSender = process.env.ACS_GENERATED_ID_FOR_TARGET_CALL_SENDER || "";
const textToPlayToLobbyUser = "You are currently in a lobby call, we will notify the admin that you are waiting.";
const confirmMessageToTargetCall = "A user is waiting in lobby, do you want to add the lobby user to your call?";

let lobbyCallConnectionId: string;
let targetCallConnectionId: string;
let acsClient: CallAutomationClient;
let lobbyCallerId: string;
let webSocket = null;

async function createAcsClient() {
	lobbyCallConnectionId = "";
	targetCallConnectionId = "";
	lobbyCallerId = "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    // Accept connections to the /ws path without token validation
    const url = request.url || '';
    if (url === '/ws') {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws) => {
    webSocket = ws;
    console.log('Received WEB SOCKET request.');

    ws.on('message', async (message) => {
        const jsResponse = message.toString();
        console.log(`Received from JS: ${jsResponse}`);

        // Move participant to target call if response is "yes"
        if (jsResponse.trim().toLowerCase() === 'yes') {
            console.log('Move Participant');
            try {
                console.log(`
					~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~
					Move Participant operation started..
					Source Caller Id:     ${lobbyCallerId}
					Source Connection Id: ${lobbyCallConnectionId}
					Target Connection Id: ${targetCallConnectionId}
					`);

                // Get the target connection
                const targetConnection = acsClient.getCallConnection(targetCallConnectionId);

                // Get participants from source connection for reference
                // const sourceConnection = client.getCallConnection(lobbyConnectionId);

                // Create participant identifier based on the input
				let participantToMove;
				if (lobbyCallerId.startsWith('+')) {
					// Phone number
					participantToMove = { phoneNumber: lobbyCallerId };
					console.log(`Moving phone number participant: ${lobbyCallerId}`);
				} else if (lobbyCallerId.startsWith('8:acs:')) {
					// ACS Communication User
					participantToMove = { communicationUserId: lobbyCallerId };
					console.log(`Moving ACS user participant: ${lobbyCallerId}`);
				} else {
					console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
				}

				// Prepare move participants options
				const options : MoveParticipantsOptions = {
					operationContext: "MoveParticipant2"
				};

				// Call the ACS SDK to move participants
				await targetConnection.moveParticipants([participantToMove], lobbyCallConnectionId, options);

				console.log('Move Participants operation completed successfully.');
            } catch (ex) {
                console.log(`Error in manual move participants operation: ${ex.message}`);
            }
        }
    });

    ws.on('close', () => {
        webSocket = null;
    });
});

app.get('/targetCallToAcsUser', async (req, res) => {
    const acsTarget = req.query.acsTarget as string; // expects ?acsTarget=<user id>
    console.log('\n~~~~~~~~~~~~ /TargetCall(Create)  ~~~~~~~~~~~~\n');

    if (!acsTarget) {
        return res.status(400).send('Missing acsTarget query parameter');
    }

    try {
        const callbackUri = `${callbackUriHost}/api/callbacks`;
		const callee : CommunicationUserIdentifier = {
			communicationUserId: acsTarget
		};
		const callInvite : CallInvite = {
			targetParticipant: callee
		};
        const createCallOptions = {
            callIntelligenceOptions: {
                cognitiveServicesEndpoint: 'https://cognitive-service-waferwire.cognitiveservices.azure.com/'
            }
        };
        const createCallResult = await acsClient.createCall(
			callInvite,
            callbackUri, 
			createCallOptions
		);
        targetCallConnectionId = createCallResult.callConnectionProperties.callConnectionId;

        const logMsg = `
			TargetCall:
			-----------
			From: Call Automation
			To:   ${acsTarget}
			Target Call Connection Id: ${targetCallConnectionId}
			Correlation Id:            ${createCallResult.callConnectionProperties.correlationId}
			`;
        console.log(logMsg);
        res.type('text/plain').send(logMsg);
    } catch (err) {
        console.error('Error creating call:', err);
        res.status(500).send('Error creating call: ' + err.message);
    }
});

app.get('/getParticipants', async (req, res) => {
	let participantId1 = "";
	let participantId2 = "";
	let participantId3 = "";
	if (lobbyCallConnectionId) {
		console.log(`\n~~~~~~~~~~~~ /GetParticipants/${lobbyCallConnectionId} ~~~~~~~~~~~~\n`);
		try {
			const callConnection = acsClient.getCallConnection(lobbyCallConnectionId);
			const participantsResponse = await callConnection.listParticipants();
			const participants = participantsResponse.values;

			// alert(`JSON.stringify(participants)`);
			console.log(`Participants: ${JSON.stringify(participants)}`);
			if (participants.length === 0) {
				console.log(`No participants found in call ${lobbyCallConnectionId}`);
			} else if (participants.length >= 1) {
				const id1 = participants[0].identifier;
				if (isCommunicationUserIdentifier(id1)) {
					participantId1 = id1.communicationUserId;
				} else if (isPhoneNumberIdentifier(id1)) {
					participantId1 = id1.phoneNumber;
				} else if (isMicrosoftTeamsUserIdentifier(id1)) {
					participantId1 = id1.microsoftTeamsUserId;
				} else {
					participantId1 = "Unknown";
				}
			}
			if (participants.length >= 2) {
				const id2 = participants[1].identifier;
				if (isCommunicationUserIdentifier(id2)) {
					participantId2 = id2.communicationUserId;
				} else if (isPhoneNumberIdentifier(id2)) {
					participantId2 = id2.phoneNumber;
				} else if (isMicrosoftTeamsUserIdentifier(id2)) {
					participantId2 = id2.microsoftTeamsUserId;
				} else {
					participantId2 = "Unknown";
				}
			}
			if (participants.length >= 3) {
				const id3 = participants[2].identifier;
				if (isCommunicationUserIdentifier(id3)) {
					participantId3 = id3.communicationUserId;
				} else if (isPhoneNumberIdentifier(id3)) {
					participantId3 = id3.phoneNumber;
				} else if (isMicrosoftTeamsUserIdentifier(id3)) {
					participantId3 = id3.microsoftTeamsUserId;
				} else {
					participantId3 = "Unknown";
				}
			}
		} catch (ex) {
			console.error(`Error getting participants for call ${lobbyCallConnectionId}: ${ex.message}`);
		}
	}
	res.json({ participantId1, participantId2, participantId3 });
});

app.get('/terminateCalls', async (req, res) => {
	console.log(`calls 1: ${lobbyCallConnectionId}, 2: ${targetCallConnectionId}`);
	if (lobbyCallConnectionId) {
		try {
			console.log(`Terminating Lobby Call with ID: ${lobbyCallConnectionId}`);
			const lobbyConnection = acsClient.getCallConnection(lobbyCallConnectionId);
			await lobbyConnection.hangUp(true);
		} catch (error) {
			console.error(`Error terminating Lobby Call: ${error.message}`);
		}
	}
	if (targetCallConnectionId) {
		try {
			console.log(`Terminating Target Call with ID: ${targetCallConnectionId}`);
			const targetConnection = acsClient.getCallConnection(targetCallConnectionId);
			await targetConnection.hangUp(true);
		} catch (error) {
			console.error(`Error terminating Target Call: ${error.message}`);
		}
	}
	console.log("Calls hung up successfully.");
	lobbyCallConnectionId = "";
	targetCallConnectionId = "";
	lobbyCallerId = "";
	res.redirect('/');
});

app.post('/api/lobbyCallEventHandler', async (req, res) => {
    console.log('--------- /api/lobbyCallEventHandler -------------------');
	const event = req.body[0];
	const eventData = event.data;
	if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
		console.log("SubscriptionValidation event");
		res.status(200).json({
			validationResponse: eventData.validationCode,
		});
		return;
	}

	// ACS Incoming Call event
	if (event.eventType === 'Microsoft.Communication.IncomingCall') {
		const fromCallerId = eventData.from.rawId;
		const toCallerId = eventData.to.rawId;

		console.log(`From Caller Id: ${fromCallerId}`);
		console.log(`To Caller Id  : ${toCallerId}`);

		// Lobby Call: Answer
		if (toCallerId.includes(acsGeneratedIdForLobbyCallReceiver)) {
			const callbackUri = `${callbackUriHost}/api/callbacks`;
			const options = {
				operationContext: 'LobbyCall',
				callIntelligenceOptions: {
					cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT
				}
			};

			const answerCallResult = await acsClient.answerCall(
				eventData.incomingCallContext,
				callbackUri,
				options
			);
			lobbyCallConnectionId = answerCallResult.callConnectionProperties.callConnectionId;

			console.log(
				`User Call(Inbound) Answered by Call Automation.`,
				`From Caller Raw Id: ${fromCallerId}`,
				`To Caller Raw Id:   ${toCallerId}`,
				`Lobby Call Connection Id: ${lobbyCallConnectionId}`,
				`Correlation Id:           ${eventData.correlationId}`,
				`Lobby Call answered successfully.`
			);
		}
	}

    res.status(200).send();
});

app.post('/api/callbacks', async (req, res) => {
    console.log('--------- /api/callbacks -------------------');
	const event = req.body[0];
	const eventData = event.data;
	// For demonstration, log the event type and IDs
	console.log(`Received call event: ${event.type}`);
	console.log(`Correlation id:-> ${eventData.correlationId}`)

	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log('\n--------- CallConnected Event Block -------------------');

		if ((eventData.operationContext || '') === 'LobbyCall') {
			console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
			console.log(`Received call event  : ${event.type}`);
			console.log(`Lobby Call Connection Id: ${eventData.callConnectionId}`);
			console.log(`Correlation Id:           ${eventData.correlationId}`);

			// Record lobby caller id and connection id
			const lobbyCallConnection = acsClient.getCallConnection(eventData.callConnectionId);
			const callConnectionProperties = await lobbyCallConnection.getCallConnectionProperties();
			lobbyCallerId = getIdentifierRawId(callConnectionProperties.source);
			lobbyCallConnectionId = callConnectionProperties.callConnectionId;
			console.log(`Lobby Caller Id:     ${lobbyCallerId}`);
			console.log(`Lobby Connection Id: ${lobbyCallConnectionId}`);

			// Play lobby waiting message
			const callMedia = acsClient.getCallConnection(eventData.callConnectionId).getCallMedia();
			const textSource: TextSource = {
				text: "You are currently in a lobby call, we will notify the admin that you are waiting.",
				voiceName: "en-US-NancyNeural",
				kind: "textSource",
			};
			const playTo: CommunicationUserIdentifier[] = [{ communicationUserId: lobbyCallerId }];
			const playOptions: PlayOptions = {
				operationContext: "playToContext",
			};
			await callMedia.play([textSource], playTo, playOptions);
		}
	} else if (event.type === "Microsoft.Communication.PlayCompleted") {
		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
		console.log(`Received event: ${event.type}`);

		// Notify Target Call user via websocket
		if (!webSocket || webSocket.readyState !== 1) { // 1 = OPEN
			console.log("ERROR: Web socket is not available.");
			return res.status(404).send("Message sent");
		}

		const confirmMessageToTargetCall = "A user is waiting in lobby, do you want to add the user to your call?";
		// Notify Client
		webSocket.send(confirmMessageToTargetCall);
		console.log(`Target Call notified with message: ${confirmMessageToTargetCall}`);
		return res.status(200).send(`Target Call notified with message: ${confirmMessageToTargetCall}`);
	} else if (event.type === "Microsoft.Communication.MoveParticipantsSucceeded") {
		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
		console.log(`Received event: ${event.type}`);
		console.log(`Call Connection Id: ${eventData.callConnectionId}`);
		console.log(`Correlation Id:      ${eventData.correlationId}`);
	} else if (event.type === "Microsoft.Communication.CallDisconnected") {
		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
		console.log(`Received event: ${event.type}`);
		console.log(`Call Connection Id: ${eventData.callConnectionId}`);
	}

    res.status(200).send();
});

// app.post('/api/callbacks', async (req, res) => {
//     console.log('--------- /api/callbacks -------------------');
// 	const event = req.body[0];
// 	const eventData = event.data;
// 	// For demonstration, log the event type and IDs
// 	console.log(`Received call event: ${event.type}`);
// 	console.log(`Correlation id:-> ${eventData.correlationId}`)

// 	if (event.type === "Microsoft.Communication.CallConnected") {
// 		console.log('\n--------- CallConnected Event Block -------------------');

// 		if ((eventData.operationContext || '') === 'LobbyCall') {
// 			console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
// 			console.log(`Received call event  : ${event.type}`);
// 			console.log(`Lobby Call Connection Id: ${eventData.callConnectionId}`);
// 			console.log(`Correlation Id:           ${eventData.correlationId}`);

// 			// Record lobby caller id and connection id
// 			const lobbyCallConnection = acsClient.getCallConnection(eventData.callConnectionId);
// 			const callConnectionProperties = await lobbyCallConnection.getCallConnectionProperties();
// 			lobbyCallerId = getIdentifierRawId(callConnectionProperties.source);
// 			lobbyCallConnectionId = callConnectionProperties.callConnectionId;
// 			console.log(`Lobby Caller Id:     ${lobbyCallerId}`);
// 			console.log(`Lobby Connection Id: ${lobbyCallConnectionId}`);

// 			// Play lobby waiting message
// 			const callMedia = acsClient.getCallConnection(eventData.callConnectionId).getCallMedia();
// 			const textSource: TextSource = {
// 				text: "You are currently in a lobby call, we will notify the admin that you are waiting.",
// 				voiceName: "en-US-NancyNeural",
// 				kind: "textSource",
// 			};
// 			const playTo: CommunicationUserIdentifier[] = [{ communicationUserId: lobbyCallerId }];
// 			const playOptions: PlayOptions = {
// 				operationContext: "playToContext",
// 			};
// 			await callMedia.play([textSource], playTo, playOptions);
// 		}
// 	} else if (event.type === "Microsoft.Communication.PlayCompleted") {
// 		// Log event
// 		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
// 		console.log(`Received event: ${event.type}`);

// 		// Move Participant logic
// 		try {
// 			console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
// 			console.log('Move Participant operation started..');
// 			console.log(`Source Caller Id:     ${lobbyCallerId}`);
// 			console.log(`Source Connection Id: ${lobbyCallConnectionId}`);
// 			console.log(`Target Connection Id: ${targetCallConnectionId}`);

// 			// Get the target connection
// 			const targetConnection = acsClient.getCallConnection(targetCallConnectionId);

// 			// Get participants from source connection for reference (optional)
// 			// const sourceConnection = client.getCallConnection(lobbyConnectionId);

// 			// Create participant identifier based on the input
// 			let participantToMove;
// 			if (lobbyCallerId.startsWith('+')) {
// 				// Phone number
// 				participantToMove = { kind: 'phoneNumber', phoneNumber: lobbyCallerId };
// 			} else if (lobbyCallerId.startsWith('8:acs:')) {
// 				// ACS Communication User
// 				participantToMove = { kind: 'communicationUser', communicationUserId: lobbyCallerId };
// 			} else {
// 				res.status(400).send('Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)');
// 				return;
// 			}

// 			// Move participant
// 			const response = await targetConnection.moveParticipants([participantToMove], lobbyCallConnectionId);

// 			console.log('\nMove Participants operation completed successfully.');
// 		} catch (ex) {
// 			console.log(`Error in manual move participants operation: ${ex.message}`);
// 			res.status(400).json({
// 				Success: false,
// 				Error: ex.message,
// 				Message: 'Move participants operation failed.'
// 			});
// 		}
// 	} else if (event.type === "Microsoft.Communication.MoveParticipantsSucceeded") {
// 		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
// 		console.log(`Received event: ${event.type}`);
// 		console.log(`Call Connection Id: ${eventData.callConnectionId}`);
// 		console.log(`Correlation Id:      ${eventData.correlationId}`);
// 	} else if (event.type === "Microsoft.Communication.CallDisconnected") {
// 		console.log('~~~~~~~~~~~~  /api/callbacks ~~~~~~~~~~~~');
// 		console.log(`Received event: ${event.type}`);
// 		console.log(`Call Connection Id: ${eventData.callConnectionId}`);
// 	}

//     res.status(200).send();
// });

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// Start the server using the HTTP server (not app.listen)
server.listen(Number(PORT), '0.0.0.0', async () => {
	console.log(`Server is listening on port ${PORT} on all interfaces`);
	await createAcsClient();
});
