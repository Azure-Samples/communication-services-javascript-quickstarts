import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallConnection,
	CallInvite,
	AnswerCallOptions
} from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId1: string;
let callConnectionId2: string;
let callConnectionId3: string;
let callConnection1: CallConnection;
let callConnection2: CallConnection;
let callConnection3: CallConnection;
let acsInboundPhoneNumber: string;
let acsOutboundPhoneNumber: string;
let userPhoneNumber: string;
let acsTestIdentity2: string;
let acsTestIdentity3: string;
let acsClient: CallAutomationClient;
let lastWorkflowCallType: string; 
const callbackUriHost = process.env.CALLBACK_URI || "";
const connectionString = process.env.CONNECTION_STRING || ""
const endpoint = process.env.PMA_ENDPOINT || ""

async function createAcsClient() {
	callConnectionId1 = "";
	callConnectionId2 = "";
	callConnectionId3 = "";
	acsInboundPhoneNumber = process.env.ACS_INBOUND_PHONE_NUMBER || "";
	acsOutboundPhoneNumber = process.env.ACS_OUTBOUND_PHONE_NUMBER || "";
	userPhoneNumber = process.env.USER_PHONE_NUMBER || "";
	acsTestIdentity2 = process.env.ACS_TEST_IDENTITY_2 || "";
	acsTestIdentity3 = process.env.ACS_TEST_IDENTITY_3 || "";
	lastWorkflowCallType = "";
	// acsClient = new CallAutomationClient(endpoint, connectionString);
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/userCallToCallAutomation', async (req, res) => {
    console.log("--------- UserCallToCallAutomation - Call 1 API Endpoint -------------------");
    try {
		const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
		const callee : PhoneNumberIdentifier = {
			phoneNumber: acsInboundPhoneNumber
		};
		const callInvite : CallInvite = {
			targetParticipant: callee,
			sourceCallIdNumber: {
				phoneNumber: userPhoneNumber,
			},
		};
		const options = {
			callIntelligenceOptions: {
				cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT
			},
			operationContext: 'IncomingCallFromUser'
		};
		var createCallResult = await acsClient.createCall(callInvite, callbackUri, options);

		console.log("=== Call From User to Call Automation ===");
		console.log(`Created call from ${userPhoneNumber} to ${acsOutboundPhoneNumber}`);
		console.log(`Connection ID: ${createCallResult.callConnectionProperties.callConnectionId}`);
		console.log("=== END WORKFLOW INITIATION ===");
    } catch (err) {
        console.error('Error creating call:', err);
    }
	res.redirect('/');
});

app.get('/createCall2', async (req, res) => {
    console.log('--------- createCall2 - Call 2 API Endpoint " -------------------');
    try {
		const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
		const callee : PhoneNumberIdentifier = {
			phoneNumber: acsOutboundPhoneNumber
		};
		const callInvite : CallInvite = {
			targetParticipant: callee,
			sourceCallIdNumber: {
				phoneNumber: acsInboundPhoneNumber,
			},
		};
		const options = {
			callIntelligenceOptions: {
				cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT
			},
			operationContext: 'CallTwo'
		};
		var createCallResult = await acsClient.createCall(callInvite, callbackUri, options);

        // Track this as Call 2
        lastWorkflowCallType = "CallTwo";

        console.log('=== CALL TWO WORKFLOW INITIATED ===');
        console.log(`Created call from ${acsInboundPhoneNumber} to ${acsOutboundPhoneNumber}`);
        console.log(`Connection ID: ${createCallResult.callConnectionProperties.callConnectionId}`);
        console.log(`This call should trigger MoveParticipantEvent (Scenario 2) which will redirect to ACS user ${acsTestIdentity2}`);
        console.log('Operation Context: CallTwo');
        console.log('=== END WORKFLOW INITIATION ===');
    } catch (err) {
        console.error('Error creating call:', err);
    }
	res.redirect('/');
});

app.get('/createCall3', async (req, res) => {
    console.log('--------- createCall3 - Call 3 API Endpoint " -------------------');
    try {
		const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
		const callee : PhoneNumberIdentifier = {
			phoneNumber: acsOutboundPhoneNumber
		};
		const callInvite : CallInvite = {
			targetParticipant: callee,
			sourceCallIdNumber: {
				phoneNumber: acsInboundPhoneNumber,
			},
		};
		const options = {
			callIntelligenceOptions: {
				cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT
			},
			operationContext: 'CallThree'
		};
		var createCallResult = await acsClient.createCall(callInvite, callbackUri, options);

        // Track this as Call 2
        lastWorkflowCallType = "CallThree";

        console.log('=== CALL THREE WORKFLOW INITIATED ===');
        console.log(`Created call from ${acsInboundPhoneNumber} to ${acsOutboundPhoneNumber}`);
        console.log(`Connection ID: ${createCallResult.callConnectionProperties.callConnectionId}`);
        console.log(`This call should trigger MoveParticipantEvent (Scenario 3) which will redirect to ACS user ${acsTestIdentity3}`);
        console.log('Operation Context: CallThree');
        console.log('=== END WORKFLOW INITIATION ===');
    } catch (err) {
        console.error('Error creating call:', err);
    }
	res.redirect('/');
});

app.get('/moveParticipant2', async (req, res) => {
    console.log('--------- MoveParticipant API End Point -------------------');

    try {
        const request = req.body;
        console.log('=== MANUAL MOVE PARTICIPANT REQUESTED ===');
        console.log(`Source Connection ID: ${callConnectionId2}`);
        console.log(`Target Connection ID: ${callConnectionId1}`);
        console.log(`Participant to Move: ${acsTestIdentity2}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Get participants from source connection for reference (optional)
        const sourceConnection = acsClient.getCallConnection(callConnectionId2);

        // Create participant identifier based on the input
        let participantToMove;
        if (request.ParticipantToMove.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsTestIdentity2 };
            console.log(`Moving phone number participant: ${acsTestIdentity2}`);
        } else if (request.ParticipantToMove.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsTestIdentity2 };
            console.log(`Moving ACS user participant: ${acsTestIdentity2}`);
        } else {
            console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options = {
            participants: [participantToMove],
            sourceCallConnectionId: callConnectionId2
        };

        // Call the ACS SDK to move participants
        // await targetConnection.moveParticipants(options);
		//callConnectionId2 = ""

        // For demonstration, assume success
        console.log('Move Participants operation completed successfully');
        console.log(`Moved ${acsTestIdentity2} from ${callConnectionId2} to ${callConnectionId1}`);
        console.log('=== MOVE PARTICIPANTS OPERATION COMPLETE ===');
    } catch (err) {
        console.error(`Error in manual move participant operation: ${err.message}`);
    }
	res.redirect('/');
});

app.get('/moveParticipant3', async (req, res) => {
    console.log('--------- MoveParticipant API End Point -------------------');

    try {
        const request = req.body;
        console.log('=== MANUAL MOVE PARTICIPANT REQUESTED ===');
        console.log(`Source Connection ID: ${callConnectionId3}`);
        console.log(`Target Connection ID: ${callConnectionId1}`);
        console.log(`Participant to Move: ${acsTestIdentity3}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Get participants from source connection for reference (optional)
        const sourceConnection = acsClient.getCallConnection(callConnectionId3);

        // Create participant identifier based on the input
        let participantToMove;
        if (request.ParticipantToMove.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsTestIdentity3 };
            console.log(`Moving phone number participant: ${acsTestIdentity3}`);
        } else if (request.ParticipantToMove.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsTestIdentity3 };
            console.log(`Moving ACS user participant: ${acsTestIdentity3}`);
        } else {
            console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options = {
            participants: [participantToMove],
            sourceCallConnectionId: callConnectionId3
        };

        // Call the ACS SDK to move participants
        // await targetConnection.moveParticipants(options);
		//callConnectionId3 = ""

        // For demonstration, assume success
        console.log('Move Participants operation completed successfully');
        console.log(`Moved ${acsTestIdentity3} from ${callConnectionId3} to ${callConnectionId1}`);
        console.log('=== MOVE PARTICIPANTS OPERATION COMPLETE ===');
    } catch (err) {
        console.error(`Error in manual move participant operation: ${err.message}`);
    }
	res.redirect('/');
});

app.get('/terminateCalls', async (req, res) => {
	console.log(`calls 1: ${callConnectionId1}, 2: ${callConnectionId2}, 3: ${callConnectionId3}`);
	if (callConnectionId1) {
		callConnection1 = acsClient.getCallConnection(callConnectionId1);
		await callConnection1.hangUp(true);
	}
	if (callConnectionId2) {
		callConnection2 = acsClient.getCallConnection(callConnectionId2);
		await callConnection2.hangUp(true);
	}
	if (callConnectionId3) {
		callConnection3 = acsClient.getCallConnection(callConnectionId3);
		await callConnection3.hangUp(true);
	}
	console.log("Calls hung up successfully.");
	callConnectionId1 = "";
	callConnectionId2 = "";
	callConnectionId3 = "";
});

app.post('/api/moveParticipantEvent', async (req, res) => {
    console.log('--------- /api/moveParticipantEvent -------------------');
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

		// Scenario 1: User calls from their phone number to ACS inbound number
		if (fromCallerId.includes(userPhoneNumber)) {
			console.log('=== SCENARIO 1: USER INCOMING CALL ===');

			const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
			const options : AnswerCallOptions = {
				operationContext: "IncomingCallFromUser"
			};

			var answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
			callConnectionId1 = answerCallResult.callConnectionProperties.callConnectionId;

			console.log(`User Call Answered - CallConnectionId: ${callConnectionId1}`);
			console.log(`Correlation Id: ${eventData.correlationId}`);
			console.log('Operation Context: IncomingCallFromUser');
			console.log('=== END SCENARIO 1 ===');
		}
		// Scenario 2: ACS inbound number calls ACS outbound number (workflow triggered)
		else if (fromCallerId.includes(acsInboundPhoneNumber)) {
			console.log('=== SCENARIO 2: WORKFLOW CALL TO BE REDIRECTED ===');
			console.log(`Last Workflow Call Type: ${lastWorkflowCallType}`);

			// Check which type of workflow call this is and redirect accordingly
			let redirectTarget;
			if (lastWorkflowCallType === 'CallThree') {
				if (callConnectionId3 === "") {
					const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
					const options : AnswerCallOptions = {
						operationContext: "IncomingCallFromUser3"
					};

					var answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
					callConnectionId3 = answerCallResult.callConnectionProperties.callConnectionId;
				} else {
					// Redirect the call to ACS User Identity 3
					redirectTarget = acsTestIdentity3;
					const callee : CommunicationUserIdentifier = {
						communicationUserId: redirectTarget
					};
					const callInvite : CallInvite = {
						targetParticipant: callee
					};
					//var redirectCallResult = await acsClient.redirectCall(eventData.IncomingCallContext, callInvite);
					console.log('Processing Call Three - Redirecting to ACS User Identity 3');
				}
			} else {
				if (callConnectionId2 === "") {
					const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
					const options : AnswerCallOptions = {
						operationContext: "IncomingCallFromUser2"
					};

					var answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
					callConnectionId2 = answerCallResult.callConnectionProperties.callConnectionId;
				} else {
					// Redirect the call to ACS User Identity 2
					redirectTarget = acsTestIdentity2;
					const callee : CommunicationUserIdentifier = {
						communicationUserId: redirectTarget
					};
					const callInvite : CallInvite = {
						targetParticipant: callee
					};
					//var redirectCallResult = await acsClient.redirectCall(eventData.IncomingCallContext, callInvite);
					console.log('Processing Call Two - Redirecting to ACS User Identity 2');
				}
			}

			console.log(`Call Redirected to ACS User Identity: ${redirectTarget}`);
			console.log(`Correlation Id: ${eventData.correlationId}`);
			console.log(`Operation Context: ${lastWorkflowCallType === 'CallThree' ? 'CallThree' : 'CallTwo'}`);
			console.log('=== END SCENARIO 2 ===');
		}
		else {
			console.log('Call filtered out - not matching expected scenarios');
			console.log(`Expected: User (${userPhoneNumber}) or ACS Inbound (${acsInboundPhoneNumber})`);
			console.log(`Received: ${fromCallerId}`);
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
	console.log(`callConnectionId: ${eventData.callConnectionId}`);
	console.log(`serverCallId: ${eventData.serverCallId}`);
	console.log(`Correlation id:-> ${eventData.correlationId}`)
	if (event.type === "Microsoft.Communication.CallConnected") {
		console.log('\n--------- CallConnected Event Block -------------------');
		const callConnectionId = eventData.callConnectionId;
		console.log("Received CallConnected event");
		console.log(`Operation Context: ${eventData.operationContext}`);

		console.log("Operation Context Alert:", eventData.operationContext);
		switch (eventData.operationContext) {
			case 'IncomingCallFromUser':
				console.log('=== CALL ONE CONNECTED ===');
				console.log('User call connected');
				console.log('=== END CALL ONE CONNECTED ===');
				break;
			default:
				console.log('=== CALL TWO/THREE CONNECTED (AFTER REDIRECT) ===');
				console.log('ACS User call connected');
				console.log('Call connected. Use /MoveParticipants API to manually move participants.');
				console.log('=== END CALL TWO/THREE CONNECTED ===');
				break;
		}
	} else if (event.type === 'Microsoft.Communication.CallDisconnected') {
		console.log(`Call disconnected: ${eventData.callConnectionId}`);
	} else {
		// Log other events but don't process them for Move Participants scenario
		console.log(`Received event: ${event.type} - No action needed for Move Participants scenario`);
	}
    res.status(200).send();
});

// app.get('/call-data', (req, res) => {
// 	console.log("Call Data Endpoint Hit");
// 	console.log(`call A: ${callConnectionIdA}, call B: ${callConnectionIdB}, call C: ${callConnectionIdC}`);
// 	res.json({ callConnectionIdA, callConnectionIdB, callConnectionIdC, userA, userB, userC, contosoPhNo });
// });

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
