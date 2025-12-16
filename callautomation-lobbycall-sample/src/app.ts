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

// Environment configuration
const CONNECTION_STRING = process.env.CONNECTION_STRING || "";
const CALLBACK_URI_HOST = process.env.CALLBACK_URI || "";
const ACS_LOBBY_CALL_RECEIVER_ID = process.env.ACS_GENERATED_ID_FOR_LOBBY_CALL_RECEIVER || "";
const COGNITIVE_SERVICES_ENDPOINT = process.env.COGNITIVE_SERVICES_ENDPOINT || "";

// Message constants
const LOBBY_WAITING_MESSAGE = "You are currently in a lobby call, we will notify the admin that you are waiting.";
const TARGET_CALL_CONFIRMATION_MESSAGE = "A user is waiting in lobby, do you want to add the lobby user to your call?";

// WebSocket connection states
const WEBSOCKET_READY_STATE_OPEN = 1;

// Application state
let lobbyCallConnectionId: string = "";
let targetCallConnectionId: string = "";
let acsClient: CallAutomationClient;
let lobbyCallerId: string = "";
let webSocketConnection: WebSocket | null = null;

// Helper function to create participant identifier based on ID format
function createParticipantIdentifier(participantId: string): any {
    if (participantId.startsWith('+')) {
        console.log(`Creating phone number participant: ${participantId}`);
        return { phoneNumber: participantId };
    } else if (participantId.startsWith('8:acs:')) {
        console.log(`Creating ACS user participant: ${participantId}`);
        return { communicationUserId: participantId };
    }
    return null;
}

// Helper function to extract participant ID from identifier
function extractParticipantId(identifier: any): string {
    if (isCommunicationUserIdentifier(identifier)) {
        return identifier.communicationUserId;
    } else if (isPhoneNumberIdentifier(identifier)) {
        return identifier.phoneNumber;
    } else if (isMicrosoftTeamsUserIdentifier(identifier)) {
        return identifier.microsoftTeamsUserId;
    }
    return "Unknown";
}

async function initializeAcsClient(): Promise<void> {
	lobbyCallConnectionId = "";
	targetCallConnectionId = "";
	lobbyCallerId = "";
	acsClient = new CallAutomationClient(CONNECTION_STRING);
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

wss.on('connection', (websocket: WebSocket) => {
    webSocketConnection = websocket;
    console.log('Received WebSocket connection request.');

    websocket.on('message', async (message) => {
        const clientResponse = message.toString();
        console.log(`Received from client: ${clientResponse}`);

        // Move participant to target call if response is "yes"
        if (clientResponse.trim().toLowerCase() === 'yes') {
            console.log('Starting participant move operation');
            try {
                console.log(`
					Move Participant operation started:
					Source Caller Id:     ${lobbyCallerId}
					Source Connection Id: ${lobbyCallConnectionId}
					Target Connection Id: ${targetCallConnectionId}
				`);

                const targetConnection = acsClient.getCallConnection(targetCallConnectionId);
                const participantToMove = createParticipantIdentifier(lobbyCallerId);
                
                if (!participantToMove) {
                    console.log("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
                    return;
                }

                const moveOptions: MoveParticipantsOptions = {
                    operationContext: "MoveParticipantOperation"
                };

                await targetConnection.moveParticipants([participantToMove], lobbyCallConnectionId, moveOptions);
                console.log('Move Participants operation completed successfully.');
            } catch (error: any) {
                console.log(`Error in move participants operation: ${error.message}`);
            }
        }
    });

    websocket.on('close', () => {
        webSocketConnection = null;
        console.log('WebSocket connection closed.');
    });
});

app.get('/targetCallToAcsUser', async (req, res) => {
    const acsTargetUserId = req.query.acsTarget as string;
    console.log('\n============ Creating Target Call ============\n');

    if (!acsTargetUserId) {
        return res.status(400).send('Missing acsTarget query parameter');
    }

    try {
        const callbackUri = `${CALLBACK_URI_HOST}/api/callbacks`;
        const targetParticipant: CommunicationUserIdentifier = {
            communicationUserId: acsTargetUserId
        };
        const callInvite: CallInvite = {
            targetParticipant: targetParticipant
        };
        const createCallOptions = {
            callIntelligenceOptions: {
                cognitiveServicesEndpoint: COGNITIVE_SERVICES_ENDPOINT
            }
        };
        
        const createCallResult = await acsClient.createCall(callInvite, callbackUri, createCallOptions);
        targetCallConnectionId = createCallResult.callConnectionProperties.callConnectionId;

        const responseMessage = `
            Target Call Created:
            ------------------
            From: Call Automation
            To:   ${acsTargetUserId}
            Connection ID: ${targetCallConnectionId}
            Correlation ID: ${createCallResult.callConnectionProperties.correlationId}
        `;
        
        console.log(responseMessage);
        res.type('text/plain').send(responseMessage);
    } catch (error: any) {
        console.error('Error creating target call:', error);
        res.status(500).send('Error creating call: ' + error.message);
    }
});

async function getParticipants(): Promise<string[]> {
    const participantIds = ["", "", ""];
    
    if (!targetCallConnectionId) {
        return participantIds;
    }

    console.log(`\n============ Getting Participants for Call: ${targetCallConnectionId} ============\n`);
    
    try {
        const callConnection = acsClient.getCallConnection(targetCallConnectionId);
        const participantsResponse = await callConnection.listParticipants();
        const participants = participantsResponse.values;

        console.log(`Found ${participants.length} participants`);
        
        if (participants.length === 0) {
            console.log(`No participants found in call ${targetCallConnectionId}`);
        } else {
            for (let i = 0; i < Math.min(participants.length, 3); i++) {
                participantIds[i] = extractParticipantId(participants[i].identifier);
                console.log(`Participant ${i + 1}: ${participantIds[i]}`);
            }
        }
    } catch (error: any) {
        console.error(`Error getting participants for call ${targetCallConnectionId}: ${error.message}`);
    }

    return participantIds;
}

app.get('/getParticipants', async (req, res) => {
    const participantIds = await getParticipants();
    
    res.json({ 
        participantId1: participantIds[0], 
        participantId2: participantIds[1], 
        participantId3: participantIds[2] 
    });
});

app.get('/terminateCalls', async (req, res) => {
    console.log(`\n============ Terminating Calls ============`);
    console.log(`Lobby Call ID: ${lobbyCallConnectionId}`);
    console.log(`Target Call ID: ${targetCallConnectionId}`);

    const terminationPromises = [];

    if (lobbyCallConnectionId) {
        const terminateLobbyCall = async () => {
            try {
                console.log(`Terminating Lobby Call: ${lobbyCallConnectionId}`);
                const lobbyConnection = acsClient.getCallConnection(lobbyCallConnectionId);
                await lobbyConnection.hangUp(true);
                console.log('Lobby Call terminated successfully');
            } catch (error: any) {
                console.error(`Error terminating Lobby Call: ${error.message}`);
            }
        };
        terminationPromises.push(terminateLobbyCall());
    }

    if (targetCallConnectionId) {
        const terminateTargetCall = async () => {
            try {
                console.log(`Terminating Target Call: ${targetCallConnectionId}`);
                const targetConnection = acsClient.getCallConnection(targetCallConnectionId);
                await targetConnection.hangUp(true);
                console.log('Target Call terminated successfully');
            } catch (error: any) {
                console.error(`Error terminating Target Call: ${error.message}`);
            }
        };
        terminationPromises.push(terminateTargetCall());
    }

    // Wait for all termination operations to complete
    await Promise.all(terminationPromises);

    // Reset application state
    lobbyCallConnectionId = "";
    targetCallConnectionId = "";
    lobbyCallerId = "";
    
    console.log("All calls terminated and state reset successfully.");
    res.redirect('/');
});

app.post('/api/lobbyCallEventHandler', async (req, res) => {
    console.log('\n============ Lobby Call Event Handler ============');
    const event = req.body[0];
    const eventData = event.data;

    // Handle Event Grid subscription validation
    if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        console.log("Processing subscription validation event");
        res.status(200).json({
            validationResponse: eventData.validationCode,
        });
        return;
    }

    // Handle incoming call events
    if (event.eventType === 'Microsoft.Communication.IncomingCall') {
        const callerRawId = eventData.from.rawId;
        const recipientRawId = eventData.to.rawId;

        console.log(`Incoming call - From: ${callerRawId}, To: ${recipientRawId}`);

        // Check if this is a lobby call
        if (recipientRawId.includes(ACS_LOBBY_CALL_RECEIVER_ID)) {
            console.log('Identified as lobby call, answering automatically...');
            
            const callbackUri = `${CALLBACK_URI_HOST}/api/callbacks`;
            const answerCallOptions = {
                operationContext: 'LobbyCall',
                callIntelligenceOptions: {
                    cognitiveServicesEndpoint: COGNITIVE_SERVICES_ENDPOINT
                }
            };

            try {
                const answerResult = await acsClient.answerCall(
                    eventData.incomingCallContext,
                    callbackUri,
                    answerCallOptions
                );
                
                lobbyCallConnectionId = answerResult.callConnectionProperties.callConnectionId;

                console.log(`Lobby call answered successfully:
                    From: ${callerRawId}
                    To: ${recipientRawId}
                    Connection ID: ${lobbyCallConnectionId}
                    Correlation ID: ${eventData.correlationId}`);
            } catch (error: any) {
                console.error(`Error answering lobby call: ${error.message}`);
            }
        }
    }

    res.status(200).send();
});

app.post('/api/callbacks', async (req, res) => {
    console.log('\n============ ACS Callback Handler ============');
    const event = req.body[0];
    const eventData = event.data;
    
    console.log(`Event Type: ${event.type}`);
    console.log(`Correlation ID: ${eventData.correlationId}`);

    switch (event.type) {
        case "Microsoft.Communication.CallConnected":
            await handleCallConnectedEvent(eventData);
            break;
            
        case "Microsoft.Communication.PlayCompleted":
            await handlePlayCompletedEvent(res);
            return; // Early return since we send response in handler
            
        case "Microsoft.Communication.MoveParticipantSucceeded":
            await handleMoveParticipantSucceededEvent(eventData);
            break;
            
        case "Microsoft.Communication.CallDisconnected":
            handleCallDisconnectedEvent(eventData);
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).send();
});

async function handleCallConnectedEvent(eventData: any): Promise<void> {
    console.log('\n---- Processing Call Connected Event ----');
    
    if (eventData.operationContext === 'LobbyCall') {
        console.log(`Lobby call connected - Connection ID: ${eventData.callConnectionId}`);

        try {
            // Get call connection properties to extract caller information
            const lobbyCallConnection = acsClient.getCallConnection(eventData.callConnectionId);
            const callProperties = await lobbyCallConnection.getCallConnectionProperties();
            
            lobbyCallerId = getIdentifierRawId(callProperties.source);
            lobbyCallConnectionId = callProperties.callConnectionId;
            
            console.log(`Lobby Caller ID: ${lobbyCallerId}`);
            console.log(`Lobby Connection ID: ${lobbyCallConnectionId}`);

            // Play waiting message to lobby user
            await playLobbyWaitingMessage(eventData.callConnectionId);
        } catch (error: any) {
            console.error(`Error handling lobby call connection: ${error.message}`);
        }
    }
}

async function playLobbyWaitingMessage(connectionId: string): Promise<void> {
    try {
        const callMedia = acsClient.getCallConnection(connectionId).getCallMedia();
        const textSource: TextSource = {
            text: LOBBY_WAITING_MESSAGE,
            voiceName: "en-US-NancyNeural",
            kind: "textSource",
        };
        const playToParticipants: CommunicationUserIdentifier[] = [{ communicationUserId: lobbyCallerId }];
        const playOptions: PlayOptions = {
            operationContext: "LobbyWaitingMessage",
        };
        
        await callMedia.play([textSource], playToParticipants, playOptions);
        console.log('Lobby waiting message played successfully');
    } catch (error: any) {
        console.error(`Error playing lobby waiting message: ${error.message}`);
    }
}

async function handlePlayCompletedEvent(res: any): Promise<void> {
    console.log('\n---- Processing Play Completed Event ----');

    // Check if WebSocket connection is available
    if (!webSocketConnection || webSocketConnection.readyState !== WEBSOCKET_READY_STATE_OPEN) {
        console.log("ERROR: WebSocket connection is not available.");
        res.status(404).send("WebSocket not available");
        return;
    }

    // Notify target call user via WebSocket
    webSocketConnection.send(TARGET_CALL_CONFIRMATION_MESSAGE);
    console.log(`Target call notified: ${TARGET_CALL_CONFIRMATION_MESSAGE}`);
    res.status(200).send(`Target call notified: ${TARGET_CALL_CONFIRMATION_MESSAGE}`);
}

async function handleMoveParticipantSucceededEvent(eventData: any): Promise<void> {
    console.log('\n---- Processing Move Participant Succeeded Event ----');
    console.log(`Connection ID: ${eventData.callConnectionId}`);
    console.log(`Correlation ID: ${eventData.correlationId}`);
    console.log('Participant successfully moved to target call');
    
    // Get updated participants list after successful move
    const participantIds = await getParticipants();
    
    // Send participants update via WebSocket
    if (webSocketConnection && webSocketConnection.readyState === WEBSOCKET_READY_STATE_OPEN) {
        const participantsUpdate = {
            type: 'participantsUpdate',
            participants: {
                participantId1: participantIds[0],
                participantId2: participantIds[1],
                participantId3: participantIds[2]
            }
        };
        webSocketConnection.send(JSON.stringify(participantsUpdate));
        console.log('Participants update sent via WebSocket');
    }
}

function handleCallDisconnectedEvent(eventData: any): void {
    console.log('\n---- Processing Call Disconnected Event ----');
    console.log(`Connection ID: ${eventData.callConnectionId}`);
    console.log('Call has been disconnected');
}

// Serve the main webpage
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'src/webpage' });
});

// Start the server
server.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`\n============ Server Started ============`);
    console.log(`Server listening on port ${PORT} (all interfaces)`);
    console.log(`Web interface: http://localhost:${PORT}`);
    console.log(`Callback endpoint: ${CALLBACK_URI_HOST}/api/callbacks`);
    console.log(`Event handler endpoint: ${CALLBACK_URI_HOST}/api/lobbyCallEventHandler`);
    await initializeAcsClient();
    console.log('============ Server Ready ============\n');
});