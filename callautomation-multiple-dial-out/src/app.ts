import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
import {
	CallAutomationClient,
	CallInvite,
	AnswerCallOptions,
	MoveParticipantsOptions
} from "@azure/communication-call-automation";
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

config();

// Configuration
const PORT = process.env.PORT || 8080;
const app: Application = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Azure Communication Services Call Automation API',
			version: '1.0.0',
			description: 'API for Azure Communication Services Call Automation with multiple dial-out scenarios',
		},
		servers: [
			{
				url: `http://localhost:${PORT}`,
				description: 'Development server',
			},
		],
		tags: [
			{
				name: 'Call Management',
				description: 'Operations for managing calls'
			},
			{
				name: 'Participant Management',
				description: 'Operations for managing participants'
			},
			{
				name: 'System',
				description: 'System operations and data retrieval'
			}
		]
	},
	apis: ['./src/app.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global variables for managing call state
let callConnectionId1: string;
let callConnectionId2: string;
let callConnectionId3: string;
let acsInboundPhoneNumber: string;
let acsOutboundPhoneNumber: string;
let userPhoneNumber: string;
let acsTestIdentity2: string;
let acsTestIdentity3: string;
let acsClient: CallAutomationClient;
let lastWorkflowCallType: string; 
let callerId1: string;
let callerId2: string;
let callerId3: string;
let calleeId1: string;
let calleeId2: string;
let calleeId3: string;

// Environment variables
const callbackUriHost = process.env.CALLBACK_URI || "";
const connectionString = process.env.CONNECTION_STRING || "";

/**
 * Initialize the Azure Communication Services client and reset all call state variables
 */

async function createAcsClient(): Promise<void> {
	// Reset call connection IDs
	callConnectionId1 = "";
	callConnectionId2 = "";
	callConnectionId3 = "";
	
	// Load environment variables
	acsInboundPhoneNumber = process.env.ACS_INBOUND_PHONE_NUMBER || "";
	acsOutboundPhoneNumber = process.env.ACS_OUTBOUND_PHONE_NUMBER || "";
	userPhoneNumber = process.env.USER_PHONE_NUMBER || "";
	acsTestIdentity2 = process.env.ACS_TEST_IDENTITY_2 || "";
	acsTestIdentity3 = process.env.ACS_TEST_IDENTITY_3 || "";
	
	// Reset workflow and participant tracking
	lastWorkflowCallType = "";
	callerId1 = "";
	callerId2 = "";
	callerId3 = "";
	calleeId1 = "";
	calleeId2 = "";
	calleeId3 = "";
	
	// Initialize ACS client
	acsClient = new CallAutomationClient(connectionString);
	console.log("✅ ACS Client initialized successfully");
}

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /userCallToCallAutomation:
 *   get:
 *     summary: Initiate Call 1 - User to Call Automation
 *     description: Creates a call from the user's phone number to the ACS inbound number (Scenario 1)
 *     tags: [Call Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after call initiation
 *       500:
 *         description: Error creating call
 */
app.get('/userCallToCallAutomation', async (req, res) => {
    console.log("📞 Initiating Call 1: User to Call Automation");
    
    try {
        const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
        
        const callee: PhoneNumberIdentifier = {
            phoneNumber: acsInboundPhoneNumber
        };
        
        const callInvite: CallInvite = {
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
        
        const createCallResult = await acsClient.createCall(callInvite, callbackUri, options);
        callConnectionId1 = createCallResult.callConnectionProperties.callConnectionId;
        callerId1 = userPhoneNumber;
        calleeId1 = acsInboundPhoneNumber;

        console.log("✅ Call 1 created successfully");
        console.log(`   From: ${userPhoneNumber}`);
        console.log(`   To: ${acsInboundPhoneNumber}`);
        console.log(`   Connection ID: ${callConnectionId1}`);
        console.log(`   Operation Context: CallOne`);
    } catch (error) {
        console.error('❌ Error creating Call 1:', error);
    }
    
    res.redirect('/');
});

/**
 * @swagger
 * /createCall2:
 *   get:
 *     summary: Create Call 2 - Workflow call to be redirected to ACS User 2
 *     description: Creates a call from ACS inbound to outbound number that will be redirected to ACS test identity 2
 *     tags: [Call Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after call initiation
 *       500:
 *         description: Error creating call
 */
app.get('/createCall2', async (req, res) => {
    console.log('📞 Initiating Call 2: Workflow call for ACS User 2 redirection');
    
    try {
        const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
        
        const callee: PhoneNumberIdentifier = {
            phoneNumber: acsOutboundPhoneNumber
        };
        
        const callInvite: CallInvite = {
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
        
        const createCallResult = await acsClient.createCall(callInvite, callbackUri, options);
        callConnectionId2 = createCallResult.callConnectionProperties.callConnectionId;
        lastWorkflowCallType = "CallTwo";
        callerId2 = acsInboundPhoneNumber;
        calleeId2 = acsOutboundPhoneNumber;

        console.log('✅ Call 2 workflow initiated successfully');
        console.log(`   From: ${acsInboundPhoneNumber}`);
        console.log(`   To: ${acsOutboundPhoneNumber}`);
        console.log(`   Connection ID: ${callConnectionId2}`);
        console.log(`   Will redirect to ACS User: ${acsTestIdentity2}`);
        console.log(`   Operation Context: CallTwo`);
    } catch (error) {
        console.error('❌ Error creating Call 2:', error);
    }
    
    res.redirect('/');
});

/**
 * @swagger
 * /createCall3:
 *   get:
 *     summary: Create Call 3 - Workflow call to be redirected to ACS User 3
 *     description: Creates a call from ACS inbound to outbound number that will be redirected to ACS test identity 3
 *     tags: [Call Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after call initiation
 *       500:
 *         description: Error creating call
 */
app.get('/createCall3', async (req, res) => {
    console.log('📞 Initiating Call 3: Workflow call for ACS User 3 redirection');
    
    try {
        const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
        
        const callee: PhoneNumberIdentifier = {
            phoneNumber: acsOutboundPhoneNumber
        };
        
        const callInvite: CallInvite = {
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
        
        const createCallResult = await acsClient.createCall(callInvite, callbackUri, options);
        callConnectionId3 = createCallResult.callConnectionProperties.callConnectionId;
        lastWorkflowCallType = "CallThree";
        callerId3 = acsInboundPhoneNumber;
        calleeId3 = acsOutboundPhoneNumber;

        console.log('✅ Call 3 workflow initiated successfully');
        console.log(`   From: ${acsInboundPhoneNumber}`);
        console.log(`   To: ${acsOutboundPhoneNumber}`);
        console.log(`   Connection ID: ${callConnectionId3}`);
        console.log(`   Will redirect to ACS User: ${acsTestIdentity3}`);
        console.log(`   Operation Context: CallThree`);
    } catch (error) {
        console.error('❌ Error creating Call 3:', error);
    }
    
    res.redirect('/');
});

/**
 * @swagger
 * /moveParticipant2:
 *   get:
 *     summary: Move Participant from Call 2 to Call 1
 *     description: Moves participants from Call 2 to Call 1 and updates tracking variables
 *     tags: [Participant Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after move operation
 *       500:
 *         description: Error moving participant
 */
app.get('/moveParticipant2', async (req, res) => {
    console.log('🔄 Move Participant: Call 2 → Call 1');

    try {
        console.log(`   Source Connection: ${callConnectionId2}`);
        console.log(`   Target Connection: ${callConnectionId1}`);
        console.log(`   Participant: ${acsOutboundPhoneNumber}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Create participant identifier based on the format
        let participantToMove;
        if (acsOutboundPhoneNumber.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsOutboundPhoneNumber };
            console.log(`   Participant Type: Phone Number`);
        } else if (acsOutboundPhoneNumber.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsOutboundPhoneNumber };
            console.log(`   Participant Type: ACS User`);
        } else {
            throw new Error("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options: MoveParticipantsOptions = {
            operationContext: "MoveParticipant2"
        };

        // Call the ACS SDK to move participants
        await targetConnection.moveParticipants([participantToMove], callConnectionId2, options);
        
        // Update tracking variables
        callConnectionId2 = "";
        callerId2 = "";
        calleeId2 = "";
        calleeId1 = acsTestIdentity2;

        console.log('✅ Move Participant operation is initiated.');
    } catch (error) {
        console.error(`❌ Error in move participant operation:`, error);
    }
    
    res.redirect('/');
});

/**
 * @swagger
 * /moveParticipant3:
 *   get:
 *     summary: Move Participant from Call 3 to Call 1
 *     description: Moves participants from Call 3 to Call 1 and updates tracking variables
 *     tags: [Participant Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after move operation
 *       500:
 *         description: Error moving participant
 */
app.get('/moveParticipant3', async (req, res) => {
    console.log('🔄 Move Participant: Call 3 → Call 1');

    try {
        console.log(`   Source Connection: ${callConnectionId3}`);
        console.log(`   Target Connection: ${callConnectionId1}`);
        console.log(`   Participant: ${acsOutboundPhoneNumber}`);

        // Get the target connection (where we want to move participants to)
        const targetConnection = acsClient.getCallConnection(callConnectionId1);

        // Create participant identifier based on the format
        let participantToMove;
        if (acsOutboundPhoneNumber.startsWith('+')) {
            // Phone number
            participantToMove = { phoneNumber: acsOutboundPhoneNumber };
            console.log(`   Participant Type: Phone Number`);
        } else if (acsOutboundPhoneNumber.startsWith('8:acs:')) {
            // ACS Communication User
            participantToMove = { communicationUserId: acsOutboundPhoneNumber };
            console.log(`   Participant Type: ACS User`);
        } else {
            throw new Error("Invalid participant format. Use phone number (+1234567890) or ACS user ID (8:acs:...)");
        }

        // Prepare move participants options
        const options: MoveParticipantsOptions = {
            operationContext: "MoveParticipant3"
        };

        // Call the ACS SDK to move participants
        await targetConnection.moveParticipants([participantToMove], callConnectionId3, options);
        
        // Update tracking variables
        callConnectionId3 = "";
        callerId3 = "";
        calleeId3 = "";
        calleeId1 = acsTestIdentity3;

        console.log('✅  Move Participant operation is initiated.');
        console.log(`   Moved participant to Call 1`);
        console.log(`   Updated calleeId1 to: ${acsTestIdentity3}`);
    } catch (error) {
        console.error(`❌ Error in move participant operation:`, error);
    }
    
    res.redirect('/');
});

/**
 * @swagger
 * /terminateCalls:
 *   get:
 *     summary: Terminate All Active Calls
 *     description: Hangs up all active calls and resets all tracking variables
 *     tags: [Call Management]
 *     responses:
 *       302:
 *         description: Redirects to home page after terminating calls
 *       500:
 *         description: Error terminating calls
 */
app.get('/terminateCalls', async (req, res) => {
    console.log('🔚 Terminating all active calls');
    console.log(`   Active calls - 1: ${callConnectionId1 || 'none'}, 2: ${callConnectionId2 || 'none'}, 3: ${callConnectionId3 || 'none'}`);
    
    // Terminate Call 1
    if (callConnectionId1) {
        try {
            console.log(`   📞❌ Terminating Call 1: ${callConnectionId1}`);
            const callConnection1 = acsClient.getCallConnection(callConnectionId1);
            await callConnection1.hangUp(true);
            console.log(`   ✅ Call 1 terminated successfully`);
        } catch (error) {
            console.error(`   ❌ Error terminating Call 1:`, error);
        }
    }
    
    // Terminate Call 2
    if (callConnectionId2) {
        try {
            console.log(`   📞❌ Terminating Call 2: ${callConnectionId2}`);
            const callConnection2 = acsClient.getCallConnection(callConnectionId2);
            await callConnection2.hangUp(true);
            console.log(`   ✅ Call 2 terminated successfully`);
        } catch (error) {
            console.error(`   ❌ Error terminating Call 2:`, error);
        }
    }
    
    // Terminate Call 3
    if (callConnectionId3) {
        try {
            console.log(`   📞❌ Terminating Call 3: ${callConnectionId3}`);
            const callConnection3 = acsClient.getCallConnection(callConnectionId3);
            await callConnection3.hangUp(true);
            console.log(`   ✅ Call 3 terminated successfully`);
        } catch (error) {
            console.error(`   ❌ Error terminating Call 3:`, error);
        }
    }
    
    // Reset all tracking variables
    callConnectionId1 = "";
    callConnectionId2 = "";
    callConnectionId3 = "";
    callerId1 = "";
    callerId2 = "";
    callerId3 = "";
    calleeId1 = "";
    calleeId2 = "";
    calleeId3 = "";
    
    console.log('✅ All calls terminated and variables reset');
    res.redirect('/');
});

// =============================================================================
// WEBHOOK ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /api/moveParticipantEvent:
 *   post:
 *     summary: Handle Move Participant Events from Azure Event Grid
 *     description: Webhook endpoint for processing incoming calls and move participant events
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Event processed successfully
 *       400:
 *         description: Invalid event data
 */
app.post('/api/moveParticipantEvent', async (req, res) => {
    console.log('🔔 Move Participant Event received');
    
    const event = req.body[0];
    const eventData = event.data;
    
    // Handle Event Grid subscription validation
    if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        console.log('📋 Event Grid subscription validation event');
        res.status(200).json({
            validationResponse: eventData.validationCode,
        });
        return;
    }

    // Handle ACS Incoming Call events
    if (event.eventType === 'Microsoft.Communication.IncomingCall') {
        const fromCallerId = eventData.from.rawId;
        const toCallerId = eventData.to.rawId;

        console.log(`📞 Incoming call - From: ${fromCallerId}, To: ${toCallerId}`);

        // Scenario 1: User calls from their phone number to ACS inbound number
        if (fromCallerId.includes(userPhoneNumber)) {
            console.log('📱 Scenario 1: User incoming call');

            const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
            const options: AnswerCallOptions = {
                operationContext: "CallOne"
            };

            const answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
            callConnectionId1 = answerCallResult.callConnectionProperties.callConnectionId;

            console.log('✅ User call answered successfully');
            console.log(`   Connection ID: ${callConnectionId1}`);
            console.log(`   Correlation ID: ${eventData.correlationId}`);
            console.log(`   Operation Context: CallOne`);
        }
        // Scenario 2: ACS inbound number calls ACS outbound number (workflow triggered)
        else if (fromCallerId.includes(acsInboundPhoneNumber)) {
            console.log('🔄 Scenario 2: Workflow call redirection');
            console.log(`   Last workflow type: ${lastWorkflowCallType}`);

            let redirectTarget;
            if (lastWorkflowCallType === 'CallTwo') {
                // Redirect the call to ACS User Identity 2
                redirectTarget = acsTestIdentity2;
                const callee: CommunicationUserIdentifier = {
                    communicationUserId: redirectTarget
                };
                const callInvite: CallInvite = {
                    targetParticipant: callee
                };
                
                await acsClient.redirectCall(eventData.incomingCallContext, callInvite);
                console.log('✅ Call 2 redirected to ACS User Identity 2');
                console.log(`   Target: ${redirectTarget}`);
            } else if (lastWorkflowCallType === 'CallThree') {
                // Redirect the call to ACS User Identity 3
                redirectTarget = acsTestIdentity3;
                const callee: CommunicationUserIdentifier = {
                    communicationUserId: redirectTarget
                };
                const callInvite: CallInvite = {
                    targetParticipant: callee
                };
                
                await acsClient.redirectCall(eventData.incomingCallContext, callInvite);
                console.log('✅ Call 3 redirected to ACS User Identity 3');
                console.log(`   Target: ${redirectTarget}`);
            }
        }
        // Scenario 3: Incoming call to ACS Test Identity 2
        else if (toCallerId.includes(acsTestIdentity2)) {
            console.log('📞 Scenario 3: Incoming call to ACS Test Identity 2');
            console.log(`   From: ${fromCallerId}`);
            console.log(`   To: ${toCallerId}`);

            const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
            const options: AnswerCallOptions = {
                operationContext: "CallTwo"
            };

            const answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
            callConnectionId2 = answerCallResult.callConnectionProperties.callConnectionId;

            console.log('✅ Call to ACS Test Identity 2 answered successfully');
            console.log(`   Connection ID: ${callConnectionId2}`);
            console.log(`   Correlation ID: ${eventData.correlationId}`);
            console.log(`   Operation Context: CallTwo`);
        }
        // Scenario 4: Incoming call to ACS Test Identity 3
        else if (toCallerId.includes(acsTestIdentity3)) {
            console.log('📞 Scenario 4: Incoming call to ACS Test Identity 3');
            console.log(`   From: ${fromCallerId}`);
            console.log(`   To: ${toCallerId}`);

            const callbackUri = new URL('/api/callbacks', callbackUriHost).toString();
            const options: AnswerCallOptions = {
                operationContext: "CallThree"
            };

            const answerCallResult = await acsClient.answerCall(eventData.incomingCallContext, callbackUri, options);
            callConnectionId3 = answerCallResult.callConnectionProperties.callConnectionId;

            console.log('✅ Call to ACS Test Identity 3 answered successfully');
            console.log(`   Connection ID: ${callConnectionId3}`);
            console.log(`   Correlation ID: ${eventData.correlationId}`);
            console.log(`   Operation Context: CallThree`);
        }
    }
    
    res.status(200).send();
});

/**
 * @swagger
 * /api/callbacks:
 *   post:
 *     summary: Handle Call Automation callbacks
 *     description: Webhook endpoint for processing call events (connected, disconnected, etc.)
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Callback processed successfully
 */
app.post('/api/callbacks', async (req, res) => {
    console.log('📡 Call Automation callback received');
    
    const event = req.body[0];
    const eventData = event.data;
    
    console.log(`   Event Type: ${event.type}`);
    console.log(`   Correlation ID: ${eventData.correlationId}`);
    
    if (event.type === "Microsoft.Communication.CallConnected") {
        console.log('🔗 Call Connected Event');
        
        switch (eventData.operationContext) {
            case 'CallOne':
                console.log('✅ Call 1 Connected - User call established');
                break;
            case 'CallTwo':
                calleeId2 = acsTestIdentity2;
                console.log('✅ Call 2 Connected - Workflow call established');
                console.log(`   Updated calleeId2 to: ${acsTestIdentity2}`);
                break;
            case 'CallThree':
                calleeId3 = acsTestIdentity3;
                console.log('✅ Call 3 Connected - Workflow call established');
                console.log(`   Updated calleeId3 to: ${acsTestIdentity3}`);
                break;
            default:
                console.log(`   Unknown operation context: ${eventData.operationContext}`);
        }
    } else if (event.type === 'Microsoft.Communication.CallDisconnected') {
        console.log(`📞❌ Call Disconnected: ${eventData.callConnectionId}`);
    } else if (event.type === 'Microsoft.Communication.MoveParticipantSucceeded') {
        console.log('🔄✅ Move Participants Succeeded Event');
        console.log(`   Call Connection ID: ${eventData.callConnectionId}`);
        console.log(`   Operation Context: ${eventData.operationContext}`);
        
        // Get and log participants after successful move operation
        try {
            console.log('👥 Listing participants after successful move operation:');
            
            const callConnection = acsClient.getCallConnection(eventData.callConnectionId);
            const participantsResult = await callConnection.listParticipants();
            const participants = participantsResult.values || [];
            
            console.log(`   📞 Call ${eventData.callConnectionId} now has ${participants.length} participants:`);
            
            participants.forEach((participant, index) => {
                let identifier = 'Unknown';
                let participantType = 'Unknown';
                
                if ('phoneNumber' in participant.identifier) {
                    const phoneIdentifier = participant.identifier as PhoneNumberIdentifier;
                    identifier = phoneIdentifier.phoneNumber;
                    participantType = 'PhoneNumber';
                } else if ('communicationUserId' in participant.identifier) {
                    const userIdentifier = participant.identifier as CommunicationUserIdentifier;
                    identifier = userIdentifier.communicationUserId;
                    participantType = 'CommunicationUser';
                }
                
                console.log(`      ${index + 1}. ${participantType}: ${identifier}`);
            });
            
        } catch (error) {
            console.log(`   ⚠️ Could not list participants after move: ${error}`);
        }
    } else if (event.type === 'Microsoft.Communication.MoveParticipantsFailed') {
        console.log('🔄❌ Move Participants Failed Event');
        console.log(`   Call Connection ID: ${eventData.callConnectionId}`);
        console.log(`   Operation Context: ${eventData.operationContext}`);
        console.log(`   Error: ${eventData.resultInformation?.message || 'Unknown error'}`);
    } else {
        console.log(`📋 Event logged: ${event.type} `);
    }
    
    res.status(200).send();
});

// =============================================================================
// DATA ENDPOINTS
// =============================================================================

/**
 * @swagger
 * /call-data:
 *   get:
 *     summary: Get current call data
 *     description: Returns the current state of all calls including connection IDs and participant information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Current call data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 callConnectionId1:
 *                   type: string
 *                 callConnectionId2:
 *                   type: string
 *                 callConnectionId3:
 *                   type: string
 *                 callerId1:
 *                   type: string
 *                 callerId2:
 *                   type: string
 *                 callerId3:
 *                   type: string
 *                 calleeId1:
 *                   type: string
 *                 calleeId2:
 *                   type: string
 *                 calleeId3:
 *                   type: string
 */
app.get('/call-data', (req, res) => {
    console.log("Call Data Endpoint Hit");
    console.log(`call 1: ${callConnectionId1}, call 2: ${callConnectionId2}, call 3: ${callConnectionId3}`);
    res.json({ callConnectionId1, callConnectionId2, callConnectionId3, callerId1, callerId2, callerId3, calleeId1, calleeId2, calleeId3 });
});

// =============================================================================
// STATIC ROUTES
// =============================================================================

/**
 * @swagger
 * /:
 *   get:
 *     summary: Redirect to Swagger UI
 *     description: Redirects to the Swagger API documentation interface
 *     tags: [System]
 *     responses:
 *       302:
 *         description: Redirects to Swagger UI
 */
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Start the server
app.listen(PORT, async () => {
    console.log('🚀 Azure Communication Services Call Automation Server');
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`📖 Swagger UI (Main Interface) at: http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Root URL redirects to: http://localhost:${PORT}/`);
    console.log('=' .repeat(60));
    
    await createAcsClient();
});
