import { config } from "dotenv";
import fs from "fs";
import { Request, Response } from 'express';
import express, { Application } from "express";
import {
    CommunicationIdentifier,
    CommunicationUserIdentifier,
    PhoneNumberIdentifier,
} from "@azure/communication-common";
import {
    CallAutomationClient,
    CallConnection,
    CallMediaRecognizeChoiceOptions,
    RecognitionChoice,
    TextSource,
    CallInvite,
    CreateCallOptions,
    CallMedia,
    DtmfTone,
    FileSource,
    SsmlSource,
    PlayToAllOptions,
    PlayOptions,
    CallMediaRecognizeSpeechOptions,
    CallMediaRecognizeSpeechOrDtmfOptions,
    CallMediaRecognizeDtmfOptions,
    Tone,
    CallLocator,
    StartRecordingOptions,
    RecordingStorage,
    AddParticipantOptions,
    TransferCallToParticipantOptions,
    HoldOptions,
    UnholdOptions,
    ConnectCallOptions,
} from "@azure/communication-call-automation";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Server } from "http";

config();

const PORT = process.env.PORT;
const app: Application = express();

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Call Automation API",
            version: "1.0.0",
            description: "API for managing calls using Azure Communication Services",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
            },
        ],
    },
    apis: [__filename], // Point to this file for JSDoc parsing
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.static("webpage"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let serverCallId: string;
let callee: PhoneNumberIdentifier;
let acsClient: CallAutomationClient;
let recordingId: string;
let recordingLocation: string;
let recordingMetadataLocation: string;
let recordingDeleteLocation: string;
let recordingState: string;
let connectApiCalled: boolean;

const confirmLabel = `Confirm`;
const cancelLabel = `Cancel`;
const MEDIA_URI = process.env.CALLBACK_URI + "/audioprompt/";
const isByos =
    process.env.IS_BYOS.trim().toLowerCase() === "true" ? true : false;
const bringYourOwnStorageUrl = process.env.BRING_YOUR_OWN_STORAGE_URL;
const isPauseOnStart =
    process.env.PAUSE_ON_START.trim().toLowerCase() === "true" ? true : false;
const targetPhoneNumber: PhoneNumberIdentifier = {
    phoneNumber: process.env.TARGET_PHONE_NUMBER.trim(),
};
const participantPhoneNumber: PhoneNumberIdentifier = {
    phoneNumber: process.env.PARTICIPANT_PHONE_NUMBER.trim(),
};
const acsPhoneNumber: PhoneNumberIdentifier = {
    phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER.trim(),
};
const targetCommuncationUser: CommunicationUserIdentifier = {
    communicationUserId: process.env.TARGET_COMMUNICATION_USER.trim(),
};
const participantCommuncationUser: CommunicationUserIdentifier = {
    communicationUserId: process.env.PARTICIPANT_COMMUNICATION_USER.trim(),
};
const transportUrl = process.env.TRANSPORT_URL.trim();

async function createAcsClient() {
    const connectionString = process.env.CONNECTION_STRING || "";
    acsClient = new CallAutomationClient(connectionString);
    console.log("Initialized ACS Client.");
}

async function createOutboundCall() {
    const callInvite: CallInvite = {
        targetParticipant: callee,
        sourceCallIdNumber: {
            phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
        },
    };

    const options: CreateCallOptions = {
        callIntelligenceOptions: {
            cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
        },
    };
    console.log("Placing outbound call...");
    await acsClient.createCall(
        callInvite,
        process.env.CALLBACK_URI + "/api/callbacks",
        options
    );
}

async function createOutboundCallACS() {
    const communicationUserId: CommunicationUserIdentifier = {
        communicationUserId: "8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000027-49e5-54a3-f883-08482200a831"
    };
    const callInvite: CallInvite = {
        targetParticipant: communicationUserId,
    };

    const options: CreateCallOptions = {
        callIntelligenceOptions: {
            cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
        },
    };
    console.log("Placing outbound call...");
    await acsClient.createCall(
        callInvite,
        process.env.CALLBACK_URI + "/api/callbacks",
        options
    );
}


async function connectCall() {

    console.log("connect call initiated...")

    connectApiCalled = true;

    // callee = {

    // 	phoneNumber: process.env.TARGET_PHONE_NUMBER || "",

    // };

    const callLocator: CallLocator = {

        id: "99416800913141485",

        kind: "roomCallLocator"

    }

    // const callLocator: CallLocator = {

    // 	id: "3fd941d7-f161-4c3c-a4b4-839f5b8e4a5d",

    // 	kind: "groupCallLocator"

    // }

    // const callLocator: CallLocator = {

    // 	id: "aHR0cHM6Ly9hcGkuZmxpZ2h0cHJveHkuc2t5cGUuY29tL2FwaS92Mi9jcC9jb252LWtyY2UtMDEtcHJvZC1ha3MuY29udi5za3lwZS5jb20vY29udi9ETGtfS0E4RDJVTzlxSlNNbTdpMFZRP2k9MTAtNjAtMTMtMjE2JmU9NjM4NTIwMDcxNzg5Mjk0NTgy",

    // 	kind: "serverCallLocator"

    // }

    const connectCallOptions: ConnectCallOptions = {

        callIntelligenceOptions: { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT },

        operationContext: "connectCallContext"

    }

    //console.log(`${process.env.CALLBACK_HOST_URI}/api/callbacks/${guid}?callerId=${callerId}`)

    const response = await acsClient.connectCall(callLocator, process.env.CALLBACK_HOST_URI + "/api/callbacks", connectCallOptions)

    console.log("connecting call....")

}

async function getParticipantListAsync() {
    const callConnection = acsClient.getCallConnection(callConnectionId);
    const participants = await callConnection.listParticipants();
    console.log("----------------------------------------------------------------------");
    participants.values.map((participant) => {
        console.log("Participant:-->", participant.identifier);
        console.log("Is Participant on hold:-->", participant.isOnHold);
        console.log("----------------------------------------------------------------------");
    });
}

async function createGroupCall() {
    const communicationUserId: CommunicationUserIdentifier = {
        communicationUserId: ""
    };
    const targets = [targetPhoneNumber, communicationUserId];
    const options: CreateCallOptions = {
        callIntelligenceOptions: {
            cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
        },
        operationContext: "groupCallContext",
        sourceCallIdNumber: acsPhoneNumber,
    };
    console.log("Placing outbound call...");
    await acsClient.createGroupCall(
        targets,
        process.env.CALLBACK_URI + "/api/callbacks",
        options
    );
}

async function getChoices() {
    const choices: RecognitionChoice[] = [
        {
            label: confirmLabel,
            phrases: ["Confirm", "First", "One"],
            tone: DtmfTone.One,
        },
        {
            label: cancelLabel,
            phrases: ["Cancel", "Second", "Two"],
            tone: DtmfTone.Two,
        },
    ];
    return choices;
}

async function hangUpCallAsync() {
    await acsClient.getCallConnection(callConnectionId).hangUp(false);
}

async function terminateCallAsync() {
    await acsClient.getCallConnection(callConnectionId).hangUp(true);
}

async function playMediaToAllWithTextSourceAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const playToAllOptions: PlayToAllOptions = {
        operationContext: "playToAllContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll([textSource], playToAllOptions);
}

async function playMediaToAllWithFileSourceAsync() {
    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };
    const playToAllOptions: PlayToAllOptions = {
        operationContext: "playToAllContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll([fileSource], playToAllOptions);
}

async function playMediaToAllWithSSMLSourceAsync() {
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const playToAllOptions: PlayToAllOptions = {
        operationContext: "playToAllContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll([ssmlSource], playToAllOptions);
}

async function playMediaToTargetWithTextSourceAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const target = GetCommunicationTarget();
    const playOptions: PlayOptions = {
        operationContext: "playToContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .play([textSource], [target], playOptions);
}

async function playMediaToTargetWithFileSourceAsync() {
    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };
    const target = GetCommunicationTarget();
    const playOptions: PlayOptions = {
        operationContext: "playToContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .play([fileSource], [target], playOptions);
}

async function playMediaToTargetWithSSMLSourceAsync() {
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const target = GetCommunicationTarget();
    const playOptions: PlayOptions = {
        operationContext: "playToContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .play([ssmlSource], [target], playOptions);
}

async function playMediaToAllWithMultiplePlaySourcesAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const playSources = [textSource, fileSource, ssmlSource];
    const playToAllOptions: PlayToAllOptions = {
        operationContext: "playToAllContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll(playSources, playToAllOptions);
}

async function playMediaToTargetWithMultiplePlaySourcesAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const playSources = [textSource, fileSource, ssmlSource];
    const target = GetCommunicationTarget();
    const playOptions: PlayOptions = {
        operationContext: "playToContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .play(playSources, [target], playOptions);
}

async function playMediaToAllWithInvalidPlaySourceAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const fileSource: FileSource = {
        url: "https://dummy/crowd-cheering.mp3",
        kind: "fileSource",
    };
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const playSources = [textSource, fileSource, ssmlSource];
    const playToAllOptions: PlayToAllOptions = {
        operationContext: "playToAllContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll(playSources, playToAllOptions);
}

async function playMediaToTargetWithInvalidPlaySourceAsync() {
    const textSource: TextSource = {
        text: "Hi, This is play media with text source",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };
    const fileSource: FileSource = {
        url: "https://dummy/crowd-cheering.mp3",
        kind: "fileSource",
    };
    const ssmlSource: SsmlSource = {
        ssmlText:
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
        kind: "ssmlSource",
    };
    const playSources = [textSource, fileSource, ssmlSource];
    const target = GetCommunicationTarget();
    const playOptions: PlayOptions = {
        operationContext: "playToContext",
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .play(playSources, [target], playOptions);
}

async function playRecognizeChoiceAsync() {
    const textSource: TextSource = {
        text: "Hello, please enter your pin",
        voiceName: "en-US-NancyNeural",
        kind: "textSource"
    };

    const recognizeChoiceOptions: CallMediaRecognizeChoiceOptions = {
        choices: await getChoices(),
        interruptPrompt: false,
        initialSilenceTimeoutInSeconds: 10,
        playPrompt: textSource,
        operationContext: "choiceContex",
        kind: "callMediaRecognizeChoiceOptions"
    };

    const target = GetCommunicationTarget();

    console.log("play recognize choice initiated...");
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .startRecognizing(target, recognizeChoiceOptions);
    console.log("play recognize choice initiated...");
}

async function playRecognizeDtmfAsync() {
    const textSource: TextSource = {
        text: "Hello, please enter your pin",
        voiceName: "en-US-NancyNeural",
        kind: "textSource"
    };

    const recognizeDtmfOptions: CallMediaRecognizeDtmfOptions = {
        playPrompt: textSource,
        interToneTimeoutInSeconds: 5,
        initialSilenceTimeoutInSeconds: 15,
        maxTonesToCollect: 4,
        interruptPrompt: false,
        operationContext: "dtmfContext",
        kind: "callMediaRecognizeDtmfOptions"
    };

    const target = GetCommunicationTarget();

    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .startRecognizing(target, recognizeDtmfOptions);
}

async function playRecognizeSpeechAsync() {
    const textSource: TextSource = {
        text: "Hello, please enter your pin",
        voiceName: "en-US-NancyNeural",
        kind: "textSource"
    };

    const recognizeSpeechOptions: CallMediaRecognizeSpeechOptions = {
        endSilenceTimeoutInSeconds: 1,
        playPrompt: textSource,
        operationContext: "speechContext",
        kind: "callMediaRecognizeSpeechOptions"
    };

    const target = GetCommunicationTarget();

    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .startRecognizing(target, recognizeSpeechOptions);
}

async function playRecognizeSpeechOrDtmfAsync() {
    const textSource: TextSource = {
        text: "Hello, please enter your pin",
        voiceName: "en-US-NancyNeural",
        kind: "textSource"
    };

    const recongnizeSpeechOrDtmfOptions: CallMediaRecognizeSpeechOrDtmfOptions = {
        maxTonesToCollect: 2,
        endSilenceTimeoutInSeconds: 1,
        playPrompt: textSource,
        initialSilenceTimeoutInSeconds: 30,
        interruptPrompt: true,
        operationContext: "speechOrDtmfContext",
        kind: "callMediaRecognizeSpeechOrDtmfOptions"
    };

    const target = GetCommunicationTarget();

    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .startRecognizing(target, recongnizeSpeechOrDtmfOptions);
}

async function startContinuousDtmfAsync() {
    const target = GetCommunicationTarget();
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .startContinuousDtmfRecognition(target);
    console.log(`Continuous Dtmf recognition started. press one on dialpad.`);
}

async function stopContinuousDtmfAsync() {
    const target = GetCommunicationTarget();
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .stopContinuousDtmfRecognition(target);
    console.log(`Continuous Dtmf recognition stopped.`);
}

async function startSendingDtmfToneAsync() {
    const tones: Tone[] = ["zero", "one"];
    const target = GetCommunicationTarget();
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .sendDtmfTones(tones, target);
    console.log(`Send dtmf tones started.`);
}

async function startRecordingAsync() {
    const callConnectionProperties = await acsClient
        .getCallConnection(callConnectionId)
        .getCallConnectionProperties();
    const serverCallId = callConnectionProperties.serverCallId;

    console.log(`IS BYOS--> ${isByos}`);
    if (isByos) {
        console.log(`BYOS URL--> ${bringYourOwnStorageUrl}`);
    }

    const callLocator: CallLocator = {
        id: serverCallId,
        kind: "serverCallLocator",
    };
    const recordingStorage: RecordingStorage = {
        recordingStorageKind: "azureBlobStorage",
        recordingDestinationContainerUrl: bringYourOwnStorageUrl,
    };
    const recordingOptions: StartRecordingOptions = {
        callLocator: callLocator,
        recordingContent: "audio",
        recordingChannel: "unmixed",
        recordingFormat: "wav",
        pauseOnStart: isPauseOnStart,
        recordingStorage: isByos === true ? recordingStorage : undefined,
    };
    const response = await acsClient.getCallRecording().start(recordingOptions);
    recordingId = response.recordingId;
    console.log(`Recording Id--> ${recordingId}`);
    console.log(`Pause on start--> ${isPauseOnStart}`);
}

async function pauseRecordingAsync() {
    if (recordingId) {
        await getRecordingState(recordingId);
        if (recordingState === "active") {
            await acsClient.getCallRecording().pause(recordingId);
        } else {
            console.log(`Recording is inactive.`);
        }
    } else {
        console.log(`Recording id is empty.`);
    }
}

async function resumeRecordingAsync() {
    if (recordingId) {
        await getRecordingState(recordingId);
        if (recordingState === "inactive") {
            await acsClient.getCallRecording().resume(recordingId);
        } else {
            console.log(`Recording is already active.`);
        }
    } else {
        console.log(`Recording id is empty.`);
    }
}

async function stopRecordingAsync() {
    if (recordingId) {
        await getRecordingState(recordingId);
        if (recordingState === "active") {
            await acsClient.getCallRecording().stop(recordingId);
        } else {
            console.log(`Recording is already inactive.`);
        }
    } else {
        console.log(`Recording id is empty.`);
    }
}

async function getRecordingState(recordingId: string) {
    const response = await acsClient.getCallRecording().getState(recordingId);
    recordingState = response.recordingState;
    console.log(`Recording current state-->${recordingState}`);
}

async function addPSTNParticipantAsync() {
    const isCancelAddParticipant = false;

    const callInvite: CallInvite = {
        targetParticipant: participantPhoneNumber,
        sourceCallIdNumber: acsPhoneNumber,
    };
    const options: AddParticipantOptions = {
        operationContext: "addPstnUserContext",
        invitationTimeoutInSeconds: 30,
    };

    const response = await acsClient
        .getCallConnection(callConnectionId)
        .addParticipant(callInvite, options);

    if (isCancelAddParticipant) {
        await acsClient
            .getCallConnection(callConnectionId)
            .cancelAddParticipantOperation(response.invitationId);
    }
}

async function addACSParticipantAsync() {
    const isCancelAddParticipant = false;

    const communicationUserId: CommunicationUserIdentifier = {
        communicationUserId: ""
    };
    const callInvite: CallInvite = {
        targetParticipant: communicationUserId,
    };
    const options: AddParticipantOptions = {
        operationContext: "addPstnUserContext",
        invitationTimeoutInSeconds: 30,
    };
    const response = await acsClient
        .getCallConnection(callConnectionId)
        .addParticipant(callInvite, options);

    if (isCancelAddParticipant) {
        await acsClient
            .getCallConnection(callConnectionId)
            .cancelAddParticipantOperation(response.invitationId);
    }
}

async function muteACSParticipantAsync() {
    const communicationUserId: CommunicationUserIdentifier = {
        communicationUserId: ""
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .muteParticipant(communicationUserId);
    console.log(`Muted ACS participant: ${communicationUserId}`);
}

async function removePSTNParticipantAsync() {
    await acsClient
        .getCallConnection(callConnectionId)
        .removeParticipant(participantPhoneNumber);
}

async function removeACSParticipantAsync() {
    const communicationUserId: CommunicationUserIdentifier = {
        communicationUserId: ""
    };
    await acsClient
        .getCallConnection(callConnectionId)
        .removeParticipant(communicationUserId);
}

async function cancelAddParticipantAsync(invitationId: string) {
    await acsClient
        .getCallConnection(callConnectionId)
        .cancelAddParticipantOperation(invitationId);
}

async function cancelAllMediaOperationAsync() {
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .cancelAllOperations();
}

async function transferCallToParticipantAsync() {
    const options: TransferCallToParticipantOptions = {
        operationContext: "transferCallContext",
        transferee: targetPhoneNumber,
    };
    await callConnection.transferCallToParticipant(
        participantPhoneNumber,
        options
    );
    console.log(`Transfer call initiated.`);
}

async function holdParticipantAsync() {
    const textSource: TextSource = {
        text: "",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };

    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };

    const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" };

    const holdOptions: HoldOptions = {
        playSource: textSource,
        operationContext: "holdUserContext",
        operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
    };
    const target = GetCommunicationTarget();
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .hold(target, holdOptions);
}

async function unholdParticipantAsync() {
    const unholdOptions: UnholdOptions = {
        operationContext: "unholdUserContext",
    };

    const target = GetCommunicationTarget();
    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .unhold(target, unholdOptions);
}

async function playWithInterruptMediaFlagAsync() {
    const textSource: TextSource = {
        text: "",
        voiceName: "en-US-NancyNeural",
        kind: "textSource",
    };

    const fileSource: FileSource = {
        url: MEDIA_URI + "MainMenu.wav",
        kind: "fileSource",
    };

    const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" };

    const playSources = [textSource, fileSource, ssmlSource];

    const interruptOption: PlayToAllOptions = {
        loop: true,
        interruptCallMediaOperation: true,
        operationContext: "interruptOperationContext",
        operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
    };

    await acsClient
        .getCallConnection(callConnectionId)
        .getCallMedia()
        .playToAll(playSources, interruptOption);
}

function GetCommunicationTarget(): CommunicationIdentifier {
    const isPstnParticipant = false;
    const isAcsParticipant = false;

    const pstnIdentifier = isPstnParticipant
        ? participantPhoneNumber
        : targetPhoneNumber;
    const target = isAcsParticipant
        ? participantCommuncationUser
        : pstnIdentifier;

    return target;
}

async function getCallProperties(connectionId: string) {
    const response = await acsClient
        .getCallConnection(connectionId)
        .getCallConnectionProperties();
    return response;
}

/**
 * @swagger
 * /api/callbacks:
 *   post:
 *     summary: Handle call event callbacks
 *     description: Processes callbacks from Azure Communication Services for call events.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: Type of the event (e.g., Microsoft.Communication.CallConnected).
 *                 data:
 *                   type: object
 *                   description: Event data containing call details.
 *     responses:
 *       200:
 *         description: Event processed successfully
 */
app.post("/api/callbacks", async (req: any, res: any) => {
    const event = req.body[0];
    const eventData = event.data;
    callConnectionId = eventData.callConnectionId;
    serverCallId = eventData.serverCallId;
    console.log(
        "Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s",
        callConnectionId,
        serverCallId,
        event.type
    );
    callConnection = acsClient.getCallConnection(callConnectionId);

    if (event.type === "Microsoft.Communication.CallConnected") {
        console.log("Received CallConnected event");
        callConnectionId = eventData.callConnectionId;
        const properties = await getCallProperties(eventData.callConnectionId);
        console.log("CORRELATION ID****--> " + properties.correlationId);
        console.log("CALL CONNECTION ID****--> " + properties.callConnectionId);
        console.log("Answered For:-> " + properties.answeredFor);
    } else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
        console.log("Received RecognizeCompleted event");
        callConnectionId = eventData.callConnectionId;
        if (eventData.recognitionType === "choices") {
            const labelDetected = eventData.choiceResult.label;
            console.log(`Detected label:--> ${labelDetected}`);
        }
        if (eventData.recognitionType === "dtmf") {
            const tones = eventData.dtmfResult.tones;
            console.log(`DTMF TONES:-->${tones}`);
            console.log(`Current context-->${eventData.operationContext}`);
        }
        if (eventData.recognitionType === "speech") {
            const text = eventData.speechResult.speech;
            console.log(
                "Recognition completed, text=%s, context=%s",
                text,
                eventData.operationContext
            );
        }
    } else if (event.type === "Microsoft.Communication.RecognizeFailed") {
        console.log("Received PlayFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.RecognizeCanceled") {
        console.log("Received RecognizeCanceled event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.PlayStarted") {
        console.log("Received PlayStarted event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.PlayCompleted") {
        console.log("Received PlayCompleted event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.PlayFailed") {
        console.log("Received PlayFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.PlayCanceled") {
        console.log("Received PlayCanceled event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.AddParticipantSucceeded") {
        console.log("Received AddParticipantSucceeded event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.AddParticipantFailed") {
        console.log("Received AddParticipantFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (
        event.type === "Microsoft.Communication.RemoveParticipantSucceeded"
    ) {
        console.log("Received RemoveParticipantSucceeded event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.RemoveParticipantFailed") {
        console.log("Received RemoveParticipantFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (
        event.type === "Microsoft.Communication.CancelAddParticipantSucceeded"
    ) {
        console.log("Received CancelAddParticipantSucceeded event");
        callConnectionId = eventData.callConnectionId;
    } else if (
        event.type === "Microsoft.Communication.CancelAddParticipantFailed"
    ) {
        console.log("Received CancelAddParticipantFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (
        event.type ===
        "Microsoft.Communication.ContinuousDtmfRecognitionToneReceived"
    ) {
        console.log("Received ContinuousDtmfRecognitionToneReceived event");
        callConnectionId = eventData.callConnectionId;
        console.log(`Tone received:--> ${eventData.tone}`);
        console.log(`SequenceId:--> ${eventData.sequenceId}`);
    } else if (
        event.type === "Microsoft.Communication.ContinuousDtmfRecognitionToneFailed"
    ) {
        console.log("Received ContinuousDtmfRecognitionToneFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.SendDtmfTonesCompleted") {
        console.log("Received SendDtmfTonesCompleted event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.SendDtmfTonesFailed") {
        console.log("Received SendDtmfTonesFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.RecordingStateChanged") {
        console.log("Received RecordingStateChanged event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.CallTransferAccepted") {
        console.log("Received CallTransferAccepted event");
        callConnectionId = eventData.callConnectionId;
    } else if (event.type === "Microsoft.Communication.CallTransferFailed") {
        console.log("Received CallTransferFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.HoldFailed") {
        console.log("Received HoldFailed event");
        callConnectionId = eventData.callConnectionId;
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.MediaStreamingStarted") {
        console.log("Received MediaStreamingStarted event");
        callConnectionId = eventData.callConnectionId;
        console.log(eventData.operationContext);
        console.log(eventData.mediaStreamingUpdate.contentType);
        console.log(eventData.mediaStreamingUpdate.mediaStreamingStatus);
        console.log(eventData.mediaStreamingUpdate.mediaStreamingStatusDetails);
    } else if (event.type === "Microsoft.Communication.MediaStreamingStopped") {
        console.log("Received MediaStreamingStopped event");
        callConnectionId = eventData.callConnectionId;
        console.log(eventData.operationContext);
        console.log(eventData.mediaStreamingUpdate.contentType);
        console.log(eventData.mediaStreamingUpdate.mediaStreamingStatus);
        console.log(eventData.mediaStreamingUpdate.mediaStreamingStatusDetails);
    } else if (event.type === "Microsoft.Communication.MediaStreamingFailed") {
        console.log("Received MediaStreamingFailed event");
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.TranscriptionStarted") {
        console.log("Received TranscriptionStarted event");
        callConnectionId = eventData.callConnectionId;
        console.log(eventData.operationContext);
        console.log(eventData.transcriptionUpdate.transcriptionStatus);
        console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
    } else if (event.type === "Microsoft.Communication.TranscriptionStopped") {
        console.log("Received TranscriptionStopped event");
        callConnectionId = eventData.callConnectionId;
        console.log(eventData.operationContext);
        console.log(eventData.transcriptionUpdate.transcriptionStatus);
        console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
    } else if (event.type === "Microsoft.Communication.TranscriptionUpdated") {
        console.log("Received TranscriptionUpdated event");
        callConnectionId = eventData.callConnectionId;
        console.log(eventData.operationContext);
        console.log(eventData.transcriptionUpdate.transcriptionStatus);
        console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
    } else if (event.type === "Microsoft.Communication.TranscriptionFailed") {
        console.log("Received TranscriptionFailed event");
        console.log(
            `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
        );
        console.log(`Message:->${eventData.resultInformation.message}`);
    } else if (event.type === "Microsoft.Communication.CallDisconnected") {
        console.log("Received CallDisconnected event");
    }

    res.sendStatus(200);
});

/**
 * @swagger
 * /api/recordingFileStatus:
 *   post:
 *     summary: Handle recording file status events
 *     description: Processes recording file status updates from Azure Communication Services.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 eventType:
 *                   type: string
 *                   description: Type of the event (e.g., Microsoft.Communication.RecordingFileStatusUpdated).
 *                 data:
 *                   type: object
 *                   description: Event data containing recording details.
 *     responses:
 *       200:
 *         description: Recording event processed successfully
 */
app.post("/api/recordingFileStatus", async (req, res) => {
    const event = req.body[0];
    const eventData = event.data;
    console.log(`Received ${event.eventType}`);
    if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        res.status(200).json({
            validationResponse: eventData.validationCode,
        });
    } else if (
        event.eventType === "Microsoft.Communication.RecordingFileStatusUpdated"
    ) {
        recordingLocation =
            eventData.recordingStorageInfo.recordingChunks[0].contentLocation;
        recordingMetadataLocation =
            eventData.recordingStorageInfo.recordingChunks[0].metadataLocation;
        recordingDeleteLocation =
            eventData.recordingStorageInfo.recordingChunks[0].deleteLocation;
        console.log(`CONTENT LOCATION:-->${recordingLocation}`);
        console.log(`METADATA LOCATION:-->${recordingMetadataLocation}`);
        console.log(`DELETE LOCATION:-->${recordingDeleteLocation}`);
        res.sendStatus(200);
    }
});

/**
 * @swagger
 * /download:
 *   get:
 *     summary: Download call recording
 *     description: Downloads the recorded audio file for a call.
 *     responses:
 *       200:
 *         description: Audio file downloaded successfully
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirect to home page if recording is unavailable
 */
app.get("/download", async (req, res) => {
    if (recordingLocation === null || recordingLocation === undefined) {
        console.log("Failed to download, recordingLocation is invalid.");
        res.redirect("/");
    } else {
        try {
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="recording.wav"'
            );
            res.setHeader("Content-Type", "audio/wav");
            const recordingStream = await acsClient
                .getCallRecording()
                .downloadStreaming(recordingLocation);
            recordingStream.pipe(res);
        } catch (ex) {
            console.log(ex);
        }
    }
});

/**
 * @swagger
 * /downloadMetadata:
 *   get:
 *     summary: Download recording metadata
 *     description: Downloads the metadata file for a call recording.
 *     responses:
 *       200:
 *         description: Metadata file downloaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirect to home page if metadata is unavailable
 */
app.get("/downloadMetadata", async (req, res) => {
    if (
        recordingMetadataLocation === null ||
        recordingMetadataLocation === undefined
    ) {
        console.log(
            "Failed to download metadata, recordingMetadataLocation is invalid."
        );
        res.redirect("/");
    } else {
        try {
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="recordingMetadata.json"'
            );
            res.setHeader("Content-Type", "application/json");
            const recordingMetadataStream = await acsClient
                .getCallRecording()
                .downloadStreaming(recordingMetadataLocation);
            recordingMetadataStream.pipe(res);
        } catch (ex) {
            console.log(ex);
        }
    }
});

/**
 * @swagger
 * /audioprompt/{filename}:
 *   get:
 *     summary: Serve audio prompt file
 *     description: Serves an audio file for call prompts.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the audio file
 *     responses:
 *       200:
 *         description: Audio file served successfully
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Internal server error
 */
app.get("/audioprompt/:filename", (req, res) => {
    const filename = req.params.filename;
    const audioFilePath = path.join(process.env.BASE_MEDIA_PATH || "", filename);
    fs.readFile(audioFilePath, (err, data) => {
        if (err) {
            console.error("Failed to read audio file:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.set("Content-Type", "audio/wav");
        res.set("Content-Length", data.length.toString());
        res.set("Cache-Control", "no-cache, no-store");
        res.set("Pragma", "no-cache");
        res.send(data);
    });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Serve webpage
 *     description: Serves the main webpage for the application.
 *     responses:
 *       200:
 *         description: Webpage served successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "src/webpage" });
});

/**
 * @swagger
 * /outboundCall:
 *   get:
 *     summary: Place outbound phone call
 *     description: Initiates an outbound call to a phone number.
 *     responses:
 *       302:
 *         description: Redirect to home page after initiating call
 */
app.get("/outboundCall", async (req, res) => {
    callee = {
        phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
    };
    await createOutboundCall();
    res.redirect("/");
});

/**
 * @swagger
 * /outboundCallACS:
 *   get:
 *     summary: Place outbound ACS call
 *     description: Initiates an outbound call to an ACS user.
 *     responses:
 *       302:
 *         description: Redirect to home page after initiating call
 */
app.get("/outboundCallACS", async (req, res) => {
    await createOutboundCallACS();
    res.redirect("/");
});

/**
 * @swagger
 * /groupCall:
 *   get:
 *     summary: Place group call
 *     description: Initiates a group call with multiple participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after initiating call
 */
app.get("/groupCall", async (req, res) => {
    await createGroupCall();
    res.redirect("/");
});

/**
 * @swagger
 * /addPSTNParticipant:
 *   get:
 *     summary: Add PSTN participant
 *     description: Adds a PSTN participant to an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after adding participant
 */
app.get("/addPSTNParticipant", async (req, res) => {
    await addPSTNParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /addACSParticipant:
 *   get:
 *     summary: Add ACS participant
 *     description: Adds an ACS participant to an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after adding participant
 */
app.get("/addACSParticipant", async (req, res) => {
    await addACSParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /getParticipantListAsync:
 *   get:
 *     summary: Get participant list
 *     description: Retrieves the list of participants in an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after retrieving participant list
 */
app.get("/getParticipantListAsync", async (req, res) => {
    await getParticipantListAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /removePSTNParticipant:
 *   get:
 *     summary: Remove PSTN participant
 *     description: Removes a PSTN participant from an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after removing participant
 */
app.get("/removePSTNParticipant", async (req, res) => {
    await removePSTNParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /removeACSParticipant:
 *   get:
 *     summary: Remove ACS participant
 *     description: Removes an ACS participant from an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after removing participant
 */
app.get("/removeACSParticipant", async (req, res) => {
    await removeACSParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /transferCallToParticipant:
 *   get:
 *     summary: Transfer call to participant
 *     description: Transfers an ongoing call to a participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after initiating transfer
 */
app.get("/transferCallToParticipant", async (req, res) => {
    await transferCallToParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToAllWithTextSource:
 *   get:
 *     summary: Play media to all with text source
 *     description: Plays a text-based media to all call participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToAllWithTextSource", async (req, res) => {
    await playMediaToAllWithTextSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToAllWithFileSource:
 *   get:
 *     summary: Play media to all with file source
 *     description: Plays a file-based media to all call participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToAllWithFileSource", async (req, res) => {
    await playMediaToAllWithFileSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /terminateCallAsync:
 *   get:
 *     summary: Terminate call
 *     description: Terminates an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after terminating call
 */
app.get("/terminateCallAsync", async (req, res) => {
    await terminateCallAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToAllWithSSMLSource:
 *   get:
 *     summary: Play media to all with SSML source
 *     description: Plays an SSML-based media to all call participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToAllWithSSMLSource", async (req, res) => {
    await playMediaToAllWithSSMLSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToTargetWithTextSource:
 *   get:
 *     summary: Play media to target with text source
 *     description: Plays a text-based media to a specific call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToTargetWithTextSource", async (req, res) => {
    await playMediaToTargetWithTextSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToTargetWithFileSource:
 *   get:
 *     summary: Play media to target with file source
 *     description: Plays a file-based media to a specific call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToTargetWithFileSource", async (req, res) => {
    await playMediaToTargetWithFileSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToTargetWithSSMLSource:
 *   get:
 *     summary: Play media to target with SSML source
 *     description: Plays an SSML-based media to a specific call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToTargetWithSSMLSource", async (req, res) => {
    await playMediaToTargetWithSSMLSourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToAllWithMultiplePlaySources:
 *   get:
 *     summary: Play multiple media sources to all
 *     description: Plays multiple media sources to all call participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToAllWithMultiplePlaySources", async (req, res) => {
    await playMediaToAllWithMultiplePlaySourcesAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToTargetWithMultiplePlaySources:
 *   get:
 *     summary: Play multiple media sources to target
 *     description: Plays multiple media sources to a specific call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playMediaToTargetWithMultiplePlaySources", async (req, res) => {
    await playMediaToTargetWithMultiplePlaySourcesAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToAllWithInvalidPlaySource:
 *   get:
 *     summary: Play invalid media source to all
 *     description: Attempts to play an invalid media source to all call participants.
 *     responses:
 *       302:
 *         description: Redirect to home page after attempting to play media
 */
app.get("/playMediaToAllWithInvalidPlaySource", async (req, res) => {
    await playMediaToAllWithInvalidPlaySourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playMediaToTargetWithInvalidPlaySource:
 *   get:
 *     summary: Play invalid media source to target
 *     description: Attempts to play an invalid media source to a specific call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after attempting to play media
 */
app.get("/playMediaToTargetWithInvalidPlaySource", async (req, res) => {
    await playMediaToTargetWithInvalidPlaySourceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /recognizeChoiceMedia:
 *   get:
 *     summary: Start media recognition
 *     description: Starts media recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting recognition
 */
app.get("/recognizeChoiceMedia", async (req, res) => {
    await playRecognizeChoiceAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /recognizeDtmfMedia:
 *   get:
 *     summary: Start media recognition
 *     description: Starts media recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting recognition
 */
app.get("/recognizeDtmfMedia", async (req, res) => {
    await playRecognizeDtmfAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /recognizeSpeechMedia:
 *   get:
 *     summary: Start media recognition
 *     description: Starts media recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting recognition
 */
app.get("/recognizeSpeechMedia", async (req, res) => {
    await playRecognizeSpeechAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /recognizeSpeechOrDtmfMedia:
 *   get:
 *     summary: Start media recognition
 *     description: Starts media recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting recognition
 */
app.get("/recognizeSpeechOrDtmfMedia", async (req, res) => {
    await playRecognizeSpeechOrDtmfAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /startContinuousDtmf:
 *   get:
 *     summary: Start continuous DTMF recognition
 *     description: Starts continuous DTMF recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting DTMF recognition
 */
app.get("/startContinuousDtmf", async (req, res) => {
    await startContinuousDtmfAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /stopContinuousDtmf:
 *   get:
 *     summary: Stop continuous DTMF recognition
 *     description: Stops continuous DTMF recognition for a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after stopping DTMF recognition
 */
app.get("/stopContinuousDtmf", async (req, res) => {
    await stopContinuousDtmfAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /sendDtmfTones:
 *   get:
 *     summary: Send DTMF tones
 *     description: Sends DTMF tones to a call participant.
 *     responses:
 *       302:
 *         description: Redirect to home page after sending DTMF tones
 */
app.get("/sendDtmfTones", async (req, res) => {
    await startSendingDtmfToneAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /startRecording:
 *   get:
 *     summary: Start call recording
 *     description: Starts recording an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after starting recording
 */
app.get("/startRecording", async (req, res) => {
    await startRecordingAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /pauseRecording:
 *   get:
 *     summary: Pause call recording
 *     description: Pauses an ongoing call recording.
 *     responses:
 *       302:
 *         description: Redirect to home page after pausing recording
 */
app.get("/pauseRecording", async (req, res) => {
    await pauseRecordingAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /resumeRecording:
 *   get:
 *     summary: Resume call recording
 *     description: Resumes a paused call recording.
 *     responses:
 *       302:
 *         description: Redirect to home page after resuming recording
 */
app.get("/resumeRecording", async (req, res) => {
    await resumeRecordingAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /stopRecording:
 *   get:
 *     summary: Stop call recording
 *     description: Stops an ongoing call recording.
 *     responses:
 *       302:
 *         description: Redirect to home page after stopping recording
 */
app.get("/stopRecording", async (req, res) => {
    await stopRecordingAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /muteACSParticipant:
 *   get:
 *     summary: Mute ACS participant
 *     description: Mutes an ACS participant in an ongoing call.
 *     responses:
 *       302:
 *         description: Redirect to home page after muting participant
 */
app.get("/muteACSParticipant", async (req, res) => {
    await muteACSParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /holdParticipant:
 *   get:
 *     summary: Hold participant
 *     description: Puts a call participant on hold.
 *     responses:
 *       302:
 *         description: Redirect to home page after holding participant
 */
app.get("/holdParticipant", async (req, res) => {
    await holdParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /unholdParticipant:
 *   get:
 *     summary: Unhold participant
 *     description: Takes a call participant off hold.
 *     responses:
 *       302:
 *         description: Redirect to home page after unholding participant
 */
app.get("/unholdParticipant", async (req, res) => {
    await unholdParticipantAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /playWithInterruptMediaFlag:
 *   get:
 *     summary: Play media with interrupt flag
 *     description: Plays media to all participants with an interrupt flag.
 *     responses:
 *       302:
 *         description: Redirect to home page after playing media
 */
app.get("/playWithInterruptMediaFlag", async (req, res) => {
    await playWithInterruptMediaFlagAsync();
    res.redirect("/");
});

/**
 * @swagger
 * /cancelAllMediaOperation:
 *   get:
 *     summary: Cancel all media operations
 *     description: Cancels all ongoing media operations for a call.
 *     responses:
 *       302:
 *         description: Redirect to home page after canceling operations
 */
app.get("/cancelAllMediaOperation", async (req, res) => {
    await cancelAllMediaOperationAsync();
    res.redirect("/");
});
/**
 * @swagger
 * /connectCall:
 *   get:
 *     summary: Cancel all media operations
 *     description: Cancels all ongoing media operations for a call.
 *     responses:
 *       302:
 *         description: Redirect to home page after canceling operations
 */
app.get("/connectCall", async (req, res) => {
    await connectCall();
    res.redirect("/");
});
// Start the server
app.listen(PORT, async () => {
    console.log(`Server is listening on port ${PORT}`);
    await createAcsClient();
});

// const wss = new WebSocket.Server({server});

// wss.on('connection', (ws: WebSocket) => {
// 	console.log('Client connected');
// 	ws.on('message', (packetData: ArrayBuffer) => {
// 		const decoder = new TextDecoder();
// 		const stringJson = decoder.decode(packetData);
// 		console.log("STRING JSON=>--" + stringJson)
// 		var response = streamingData(packetData);
// 		if ('locale' in response) {
// 			console.log("--------------------------------------------")
// 			console.log("Transcription Metadata")
// 			console.log("CALL CONNECTION ID:-->" + response.callConnectionId);
// 			console.log("CORRELATION ID:-->" + response.correlationId);
// 			console.log("LOCALE:-->" + response.locale);
// 			console.log("SUBSCRIPTION ID:-->" + response.subscriptionId);
// 			console.log("--------------------------------------------")
// 		}
// 		if ('text' in response) {
// 			console.log("--------------------------------------------")
// 			console.log("Transcription Data")
// 			console.log("TEXT:-->" + response.text);
// 			console.log("FORMAT:-->" + response.format);
// 			console.log("CONFIDENCE:-->" + response.confidence);
// 			console.log("OFFSET IN TICKS:-->" + response.offsetInTicks);
// 			console.log("DURATION IN TICKS:-->" + response.durationInTicks);
// 			console.log("RESULT STATE:-->" + response.resultState);
// 			if ('phoneNumber' in response.participant) {
// 				console.log("PARTICIPANT:-->" + response.participant.phoneNumber);
// 			}
// 			if ('communicationUserId' in response.participant) {
// 				console.log("PARTICIPANT:-->" + response.participant.communicationUserId);
// 			}
// 			response.words.forEach(element => {
// 				console.log("TEXT:-->" + element.text)
// 				console.log("DURATION IN TICKS:-->" + element.durationInTicks)
// 				console.log("OFFSET IN TICKS:-->" + element.offsetInTicks)
// 			});
// 			console.log("--------------------------------------------")
// 		}
// 	});

// 	ws.on('close', () => {
// 		console.log('Client disconnected');
// 	});
// });

// console.log(`WebSocket server running on port ${PORT}`);