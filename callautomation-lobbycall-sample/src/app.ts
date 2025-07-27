import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallInvite,
	AnswerCallOptions,
	MoveParticipantsOptions
} from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let lobbyCallConnectionId: string;
let targetCallConnectionId: string;
let acsGeneratedId: string;
let acsClient: CallAutomationClient;
let lobbyCallerId: string;
const callbackUriHost = process.env.CALLBACK_URI || "";
const connectionString = process.env.CONNECTION_STRING || ""
const endpoint = process.env.PMA_ENDPOINT || ""

async function createAcsClient() {
	lobbyCallConnectionId = "";
	targetCallConnectionId = "";
	acsGeneratedId = process.env.ACS_GENERATED_ID || "";
	lobbyCallerId = "";
	// acsClient = new CallAutomationClient(endpoint, connectionString);
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/TargetCallToAcsUser(Create)', async (req, res) => {
    const acsTarget = req.body.acsTarget; // expects { "acsTarget": "<user id>" }
    console.log('\n~~~~~~~~~~~~ /TargetCall(Create)  ~~~~~~~~~~~~\n');

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

app.get('/GetParticipants/:callConnectionId', async (req, res) => {
    const callConnectionId = req.params.callConnectionId;
    console.log(`\n~~~~~~~~~~~~ /GetParticipants/${callConnectionId} ~~~~~~~~~~~~\n`);
    try {
        const callConnection = acsClient.getCallConnection(callConnectionId);
        const participantsResponse = await callConnection.getAllParticipant();
        const participants = participantsResponse.value;

        // Format participant info
        const participantInfo = participants.map(p => {
            let type = p.identifier.kind || p.identifier.constructor.name;
            let rawId = p.identifier.rawId;
            let phoneNumber = p.identifier.phoneNumber || null;
            let acsUserId = p.identifier.communicationUserId || null;

            return {
                rawId,
                type,
                phoneNumber,
                acsUserId
            };
        });

        // Sort: phone numbers first, then ACS users
        participantInfo.sort((a, b) => {
            if (!a.acsUserId && b.acsUserId) return -1;
            if (a.acsUserId && !b.acsUserId) return 1;
            return 0;
        });

        // Format output
        if (participantInfo.length === 0) {
            return res.status(404).json({
                message: "No participants found for the specified call connection.",
                callConnectionId
            });
        } else {
            let msg = `\nNo of Participants: ${participantInfo.length}\nParticipants: \n-------------\n`;
            msg += participantInfo.map((p, i) => {
                if (p.acsUserId) {
                    return `${i + 1}. ${p.type} - RawId: ${p.acsUserId}`;
                } else {
                    return `${i + 1}. ${p.type}       - RawId: ${p.rawId}, Phone: ${p.phoneNumber}`;
                }
            }).join('\n');
            console.log(msg);
            return res.type('text/plain').send(msg);
        }
    } catch (ex) {
        console.error(`Error getting participants for call ${callConnectionId}: ${ex.message}`);
        return res.status(400).json({
            error: ex.message,
            callConnectionId
        });
    }
});

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
			operationContext: 'CallOne'
		};
		var createCallResult = await acsClient.createCall(callInvite, callbackUri, options);
		callConnectionId1 = createCallResult.callConnectionProperties.callConnectionId;
		callerId1 = userPhoneNumber;
		calleeId1 = acsInboundPhoneNumber;

		console.log("=== Call From User to Call Automation ===");
		console.log(`Created call from ${userPhoneNumber} to ${acsOutboundPhoneNumber}`);
		console.log(`Connection ID: ${callConnectionId1}`);
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
		callConnectionId2 = createCallResult.callConnectionProperties.callConnectionId;
        // Track this as Call 2
        lastWorkflowCallType = "CallTwo";
		callerId2 = acsInboundPhoneNumber;
		calleeId2 = acsOutboundPhoneNumber;

        console.log('=== CALL TWO WORKFLOW INITIATED ===');
        console.log(`Created call from ${acsInboundPhoneNumber} to ${acsOutboundPhoneNumber}`);
        console.log(`Connection ID: ${callConnectionId2}`);
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
		callConnectionId3 = createCallResult.callConnectionProperties.callConnectionId;
        // Track this as Call 2
        lastWorkflowCallType = "CallThree";
		callerId3 = acsInboundPhoneNumber;
		calleeId3 = acsOutboundPhoneNumber;

        console.log('=== CALL THREE WORKFLOW INITIATED ===');
        console.log(`Created call from ${acsInboundPhoneNumber} to ${acsOutboundPhoneNumber}`);
        console.log(`Connection ID: ${callConnectionId3}`);
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
        console.log(`Participant to Move: ${acsOutboundPhoneNumber}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Get participants from source connection for reference (optional)
        const sourceConnection = acsClient.getCallConnection(callConnectionId2);

        // Create participant identifier based on the input
        let participantToMove;
        if (acsOutboundPhoneNumber.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsOutboundPhoneNumber };
            console.log(`Moving phone number participant: ${acsOutboundPhoneNumber}`);
        } else if (acsOutboundPhoneNumber.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsOutboundPhoneNumber };
            console.log(`Moving ACS user participant: ${acsOutboundPhoneNumber}`);
        } else {
            console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options : MoveParticipantsOptions = {
            operationContext: "MoveParticipant2"
        };

        // Call the ACS SDK to move participants
        await targetConnection.moveParticipants([participantToMove], callConnectionId2, options);
		callConnectionId2 = "";
		callerId2 = "";
		calleeId2 = "";
		calleeId1 = acsTestIdentity2;

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
        console.log(`Participant to Move: ${acsOutboundPhoneNumber}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Get participants from source connection for reference (optional)
        const sourceConnection = acsClient.getCallConnection(callConnectionId3);

        // Create participant identifier based on the input
        let participantToMove;
        if (acsOutboundPhoneNumber.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsOutboundPhoneNumber };
            console.log(`Moving phone number participant: ${acsOutboundPhoneNumber}`);
        } else if (acsOutboundPhoneNumber.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsOutboundPhoneNumber };
            console.log(`Moving ACS user participant: ${acsOutboundPhoneNumber}`);
        } else {
            console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options : MoveParticipantsOptions = {
            operationContext: "MoveParticipant3"
        };

        // Call the ACS SDK to move participants
        await targetConnection.moveParticipants([participantToMove], callConnectionId3, options);
		callConnectionId3 = "";
		callerId3 = "";
		calleeId3 = "";
		calleeId1 = acsTestIdentity3;

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
		try {
			console.log(`Terminating Call 1 with ID: ${callConnectionId1}`);
			const callConnection1 = acsClient.getCallConnection(callConnectionId1);
			await callConnection1.hangUp(true);
		} catch (error) {
			console.error(`Error terminating Call 1: ${error.message}`);
		}
	}
	if (callConnectionId2) {
		try {
			console.log(`Terminating Call 2 with ID: ${callConnectionId2}`);
			const callConnection2 = acsClient.getCallConnection(callConnectionId2);
			await callConnection2.hangUp(true);
		} catch (error) {
			console.error(`Error terminating Call 2: ${error.message}`);
		}
	}
	if (callConnectionId3) {
		try {
			console.log(`Terminating Call 3 with ID: ${callConnectionId3}`);
			const callConnection3 = acsClient.getCallConnection(callConnectionId3);
			await callConnection3.hangUp(true);
		} catch (error) {
			console.error(`Error terminating Call 3: ${error.message}`);
		}
	}
	console.log("Calls hung up successfully.");
	callConnectionId1 = "";
	callConnectionId2 = "";
	callConnectionId3 = "";
	callerId1 = "";
	callerId2 = "";
	callerId3 = "";
	calleeId1 = "";
	calleeId2 = "";
	calleeId3 = "";
	res.redirect('/');
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
				operationContext: "CallOne"
			};

			//console.log(`Incoming call context: ${eventData.incomingCallContext}`);
			var answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
			callConnectionId1 = answerCallResult.callConnectionProperties.callConnectionId;

			console.log(`User Call Answered - CallConnectionId: ${callConnectionId1}`);
			console.log(`Correlation Id: ${eventData.correlationId}`);
			console.log('Operation Context: CallOne');
			console.log('=== END SCENARIO 1 ===');
		}
		// Scenario 2: ACS inbound number calls ACS outbound number (workflow triggered)
		else if (fromCallerId.includes(acsInboundPhoneNumber)) {
			console.log('=== SCENARIO 2: WORKFLOW CALL TO BE REDIRECTED ===');
			console.log(`Last Workflow Call Type: ${lastWorkflowCallType}`);

			// Check which type of workflow call this is and redirect accordingly
			let redirectTarget;
			if (lastWorkflowCallType === 'CallTwo') {
				// Redirect the call to ACS User Identity 2
				redirectTarget = acsTestIdentity2;
				const callee : CommunicationUserIdentifier = {
					communicationUserId: redirectTarget
				};
				const callInvite : CallInvite = {
					targetParticipant: callee
				};
				//console.log(`Incoming call context: ${eventData.incomingCallContext}`);
				var redirectCallResult = await acsClient.redirectCall(eventData.incomingCallContext, callInvite);
				console.log('PROCESSING CALL TWO - Redirecting to ACS User Identity 2');
			} else if (lastWorkflowCallType === 'CallThree') {
				// Redirect the call to ACS User Identity 3
				redirectTarget = acsTestIdentity3;
				const callee : CommunicationUserIdentifier = {
					communicationUserId: redirectTarget
				};
				const callInvite : CallInvite = {
					targetParticipant: callee
				};
				//console.log(`Incoming call context: ${eventData.incomingCallContext}`);
				var redirectCallResult = await acsClient.redirectCall(eventData.incomingCallContext, callInvite);
				console.log('PROCESSING CALL THREE - Redirecting to ACS User Identity 3');
			}
			console.log('=== END SCENARIO 2 ===');
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
		switch (eventData.operationContext) {
			case 'CallOne':
				//callConnectionId1 = callConnectionId;
				console.log('=== CALL ONE CONNECTED ===');
				console.log('User call connected');
				console.log('=== END CALL ONE CONNECTED ===');
				break;
			case 'CallTwo':
				//callConnectionId2 = callConnectionId;
				calleeId2 = acsTestIdentity2;
				console.log('=== CALL TWO CONNECTED ===');
				console.log('User call connected');
				console.log('=== END CALL TWO CONNECTED ===');
				break;
			case 'CallThree':
				//callConnectionId3 = callConnectionId;
				calleeId3 = acsTestIdentity3;
				console.log('=== CALL THREE CONNECTED ===');
				console.log('User call connected');
				console.log('=== END CALL THREE CONNECTED ===');
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

app.get('/call-data', (req, res) => {
	console.log("Call Data Endpoint Hit");
	console.log(`call 1: ${callConnectionId1}, call 2: ${callConnectionId2}, call 3: ${callConnectionId3}`);
	res.json({ callConnectionId1, callConnectionId2, callConnectionId3, callerId1, callerId2, callerId3, calleeId1, calleeId2, calleeId3 });
});

// GET endpoint to serve the webpage
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
