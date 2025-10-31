import { config } from "dotenv";
import fs from "fs";
import http from 'http';
import https from 'https';
import path from 'path';
import WebSocket from 'ws';
import express, { Application } from "express";
import {
  CommunicationIdentifier,
  CommunicationUserIdentifier,
  PhoneNumberIdentifier,
} from "@azure/communication-common";
import { } from "@azure/communication-common";
import {
  CallAutomationClient,
  CallConnection,
  RecognitionChoice,
  CallInvite,
  CreateCallOptions,
  DtmfTone,
  FileSource,
  PlayToAllOptions,
  PlayOptions,
  CallMediaRecognizeDtmfOptions,
  Tone,
  CallLocator,
  StartRecordingOptions,
  RecordingStorage,
  AddParticipantOptions,
  TransferCallToParticipantOptions,
  MediaStreamingOptions,
  StartMediaStreamingOptions,
  StopMediaStreamingOptions,
  HoldOptions,
  UnholdOptions,
  StreamingData,
  AnswerCallOptions,
  RecordingContent,
  RecordingChannel,
  RecordingFormat
} from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static("webpage"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create common server for app and websocket
let server: any;
server = http.createServer(app);
console.log('HTTP server configured (no SSL certs found)');

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
let callerId: string;
let downloadRecordingFormat: string;

const confirmLabel = `Confirm`;
const cancelLabel = `Cancel`;
const MEDIA_URI = process.env.CALLBACK_URI + "/audioprompt/";
const BASE_MEDIA_PATH = "./src/resources/media_prompts/"

const acsPhoneNumber: PhoneNumberIdentifier = {
  phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER.trim(),
};

const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
const transportUrl = websocketUrl;
async function createAcsClient() {
  const connectionString = process.env.CONNECTION_STRING || "";
  console.log("Creating ACS Client with connection string:", connectionString ? "✓ Set" : "✗ Missing");
  console.log("Callback URI:", process.env.CALLBACK_URI + "/api/callbacks" || "✗ Missing");
  console.log("Port:", process.env.PORT || "✗ Missing");
  acsClient = new CallAutomationClient(connectionString);
  console.log("Initialized ACS Client.");
}

async function createOutboundCall(pstnTarget: string) {
  try {
    const target: PhoneNumberIdentifier = {
      phoneNumber: pstnTarget
    }
    const callInvite: CallInvite = {
      targetParticipant: target,
      sourceCallIdNumber: {
        phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
      },
    };

    const options: CreateCallOptions = {
      // callIntelligenceOptions: {
      //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
      // },
      operationContext: "CreatPSTNCallContext"
    };
    console.log("Placing pstn outbound call...");
    const createCallResult = await acsClient.createCall(
      callInvite,
      process.env.CALLBACK_URI + "/api/callbacks",
      options
    );
    console.log("Placed pstn outbound call...");
    console.log("Call created successfully. Call Connection:", (await createCallResult.callConnection.getCallConnectionProperties()).callConnectionId);
    console.log("Correlation Id:", (await createCallResult.callConnection.getCallConnectionProperties()).correlationId);
  }
  catch (error) {
    console.error("Failed to create pstn outbound call:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function createOutboundCallACS(acsTarget: string) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: acsTarget
    }
    const callInvite: CallInvite = {
      targetParticipant: communicationUserId,
    };

    const options: CreateCallOptions = {
      // callIntelligenceOptions: {
      //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
      // },
      operationContext:"CreateACSCallContext"
    };
    console.log("Placing acs outbound call...");
    const createCallResult = await acsClient.createCall(
      callInvite,
      process.env.CALLBACK_URI + "/api/callbacks",
      options
    );
    console.log("Call created successfully. Call Connection:", (await createCallResult.callConnection.getCallConnectionProperties()).callConnectionId);
  }
  catch (error) {
    console.error("Failed to create acs outbound call:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function getParticipant(isPstn: boolean, targetParticipant: string) {
  try {
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
    } else {
      target = { communicationUserId: targetParticipant }
    }

    const callConnection = acsClient.getCallConnection(callConnectionId); // Get the call connection using the global callConnectionId
    const participant = await callConnection.getParticipant(target); // Retrieve the participants

    console.log("----------------------------------------------------------------------");
    console.log("Participant:-->", JSON.stringify(participant.identifier));
    console.log("Is Participant on hold:-->", participant.isOnHold);
    console.log("Is Participant on Mute:-->", participant.isMuted);
    console.log("----------------------------------------------------------------------");
  }
  catch (error) {
    console.error("Failed to get participant in call:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function getParticipantListAsync() {
  try {
    const callConnection = acsClient.getCallConnection(callConnectionId); // Get the call connection using the global callConnectionId
    const participants = await callConnection.listParticipants(); // Retrieve the participants

    console.log("----------------------------------------------------------------------");
    participants.values.map((participant) => {
      console.log("Participant:-->", JSON.stringify(participant.identifier));
      console.log("Is Participant on hold:-->", participant.isOnHold);
      console.log("Is Participant on Mute:-->", participant.isMuted);
      console.log("----------------------------------------------------------------------");
    });
  }
  catch (error) {
    console.error("Failed to get participant list in call:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function createGroupCall(acsTarget: string) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: acsTarget
    }
    const targets = [communicationUserId];
    const options: CreateCallOptions = {
      // callIntelligenceOptions: {
      //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
      // },
      operationContext: "groupCallContext",
    };
    console.log("Placing group call...");
    const createCallResult = await acsClient.createGroupCall(
      targets,
      process.env.CALLBACK_URI + "/api/callbacks",
      options
    );
    console.log("Call created successfully. Call Connection:", (await createCallResult.callConnection.getCallConnectionProperties()).callConnectionId);
  } catch (error) {
    console.error("Failed to creaet group call:", error);
    console.log(`Error message:- ${error.message}`);
  }
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

async function createPSTNCallWithMediaStreaming(
  pstnTarget: string,
  isStartMediaStreaming: boolean,
  isMixed: boolean,
  isEnableBidirection: boolean,
  isPCM24k: boolean
) {
  try {
    const target: PhoneNumberIdentifier = {
      phoneNumber: pstnTarget
    }
    const callInvite: CallInvite = {
      targetParticipant: target,
      sourceCallIdNumber: {
        phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
      },
    };

    const mediaStreamingOptions: MediaStreamingOptions = {
      transportUrl: transportUrl,
      transportType: "websocket",
      contentType: "audio",
      audioChannelType: isMixed ? "mixed" : "unmixed",
      startMediaStreaming: isStartMediaStreaming,
      enableBidirectional: isEnableBidirection,
      audioFormat: isPCM24k ? "pcm24KMono" : "pcm16KMono",
    };

    const options: CreateCallOptions = {
      // callIntelligenceOptions: {
      //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
      // },
      mediaStreamingOptions: mediaStreamingOptions,

      operationContext: "CreatPSTNCallWithMediaStreamingContext"
    };
    console.log("Placing pstn call with media streaming...");
    const createCallResult = await acsClient.createCall(
      callInvite,
      process.env.CALLBACK_URI + "/api/callbacks",
      options
    );
    console.log("Call created successfully. Call Connection:", (await createCallResult.callConnection.getCallConnectionProperties()).callConnectionId);
  }
  catch (error) {
    console.error("Failed to create pstn call with media streaming:", error);
    console.log(`Error message:- ${error.message}`);
  }

}

async function createACSCallWithMediaStreamng(
  acsTarget: string,
  isStartMediaStreaming: boolean,
  isMixed: boolean,
  isEnableBidirection: boolean,
  isPCM24k: boolean
) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: acsTarget
    }
    const callInvite: CallInvite = {
      targetParticipant: communicationUserId,

    };

    const mediaStreamingOptions: MediaStreamingOptions = {
      transportUrl: transportUrl,
      transportType: "websocket",
      contentType: "audio",
      audioChannelType: isMixed ? "mixed" : "unmixed",
      startMediaStreaming: isStartMediaStreaming,
      enableBidirectional: isEnableBidirection,
      audioFormat: isPCM24k ? "pcm24KMono" : "pcm16KMono",
    };

    const options: CreateCallOptions = {
      // callIntelligenceOptions: {
      //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
      // },
      mediaStreamingOptions: mediaStreamingOptions,
    };
    console.log("Placing acs outbound call with media streaming...");
    const createCallResult = await acsClient.createCall(
      callInvite,
      process.env.CALLBACK_URI + "/api/callbacks",
      options
    );
    console.log("Call created successfully. Call Connection:", (await createCallResult.callConnection.getCallConnectionProperties()).callConnectionId);
  }
  catch (error) {
    console.error("Failed to create acs call with media streaming:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function terminateCallAsync(isForEveryone: boolean) {
  try {
    await acsClient.getCallConnection(callConnectionId).hangUp(isForEveryone);
  }
  catch (error) {
    console.error("Failed to terminate call:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function playMediaToAllWithFileSourceAsync() {
  try {
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
  catch (error) {
    console.error("Failed to play media to all with filesource:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function playMediaToTargetWithFileSourceAsync(isPstn: boolean, targetParticipant: string) {
  try {
    const fileSource: FileSource = {
      url: MEDIA_URI + "MainMenu.wav",
      kind: "fileSource",
    };
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }

    } else {
      target = { communicationUserId: targetParticipant }
    }
    const playOptions: PlayOptions = {
      operationContext: "playToContext",
    };
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .play([fileSource], [target], playOptions);
  }
  catch (error) {
    console.error("Failed to play media to target with filesource:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function playRecognizeAsync(isPstn: boolean, targetParticipant: string) {
  try {
    const fileSource: FileSource = {
      url: MEDIA_URI + "MainMenu.wav",
      kind: "fileSource",
    };

    const recognizeDtmfOptions: CallMediaRecognizeDtmfOptions = {
      playPrompt: fileSource,
      interToneTimeoutInSeconds: 5,
      initialSilenceTimeoutInSeconds: 15,
      maxTonesToCollect: 4,
      interruptPrompt: false,
      operationContext: "dtmfContext",
      kind: "callMediaRecognizeDtmfOptions",
    };

    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
      console.log(target);

    } else {
      target = { communicationUserId: targetParticipant }
      console.log(target);
    }
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .startRecognizing(target, recognizeDtmfOptions);
  }
  catch (error) {
    console.error("Failed to recognize with filesource:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function startContinuousDtmfAsync(isPstn: boolean, targetParticipant: string) {
  try {
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
      console.log(target);
    } else {
      target = { communicationUserId: targetParticipant }
      console.log(target);
    }
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .startContinuousDtmfRecognition(target);
    console.log(`Continuous Dtmf recognition started. press one on dialpad.`);
  }
  catch (error) {
    console.error("Failed to start continuous dtmf:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function stopContinuousDtmfAsync(isPstn: boolean, targetParticipant: string) {
  try {
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
      console.log(target);
    } else {
      target = { communicationUserId: targetParticipant }
      console.log(target);
    }
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .stopContinuousDtmfRecognition(target);
    console.log(`Continuous Dtmf recognition stopped.`);
  }
  catch (error) {
    console.error("Failed to stop continuous dtmf:", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function startSendingDtmfToneAsync(isPstn: boolean, targetParticipant: string) {
  try {
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
      console.log(target);
    } else {
      target = { communicationUserId: targetParticipant }
      console.log(target);
    }

    const tones: Tone[] = ["zero", "one"];

    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .sendDtmfTones(tones, target);
    console.log(`Send dtmf tones started.`);
  }
  catch (error) {
    console.error("Failed to send dtmf tones :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function startRecordingAsync(
  isRecordingWithCallConnectionId: boolean,
  isPauseOnStart: boolean,
  recordingContent: string,
  recordingChannel: string,
  recordingFormat: string
) {
  try {
    downloadRecordingFormat = recordingFormat;
    const callConnectionProperties = await acsClient
      .getCallConnection(callConnectionId)
      .getCallConnectionProperties();
    const serverCallId = callConnectionProperties.serverCallId;

    const callLocator: CallLocator = {
      id: serverCallId,
      kind: "serverCallLocator",
    };

    const recordingStorage: RecordingStorage = {
      recordingStorageKind: "azureBlobStorage",
      //recordingDestinationContainerUrl: bringYourOwnStorageUrl,
    };
    const recordingOptions: StartRecordingOptions = {
      callLocator: callLocator,
      recordingContent: recordingContent as RecordingContent,
      recordingChannel: recordingChannel as RecordingChannel,
      recordingFormat: recordingFormat as RecordingFormat,
      pauseOnStart: isPauseOnStart,
      recordingStateCallbackEndpointUrl: process.env.CALLBACK_URI + "/api/callbacks"
      // recordingStorage: isByos === true ? recordingStorage : undefined,
    };

    //  console.log("******************"+JSON.stringify(recordingOptions));
    const response = await acsClient.getCallRecording().start(recordingOptions);
    recordingId = response.recordingId;
    console.log(`Recording Id--> ${recordingId}`);
    console.log(`Pause on start--> ${isPauseOnStart}`);
  }
  catch (error) {
    console.error("Failed to start recording :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function pauseRecordingAsync() {
  try {
    if (recordingId) {
      await acsClient.getCallRecording().pause(recordingId);
    } else {
      console.log(`Recording id is empty.`);
    }
  }
  catch (error) {
    console.error("Failed to pause recording :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function resumeRecordingAsync() {
  try {
    if (recordingId) {
      await acsClient.getCallRecording().resume(recordingId);
    } else {
      console.log(`Recording id is empty.`);
    }
  }
  catch (error) {
    console.error("Failed to resume recording :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function stopRecordingAsync() {
  try {
    if (recordingId) {
      await acsClient.getCallRecording().stop(recordingId);
    } else {
      console.log(`Recording id is empty.`);
    }
  }
  catch (error) {
    console.error("Failed to stop recording :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function getRecordingState(recordingId: string) {
  try {
    const response = await acsClient.getCallRecording().getState(recordingId);
    recordingState = response.recordingState;
    console.log(`Recording current state-->${recordingState}`);
  }
  catch (error) {
    console.error("Failed to get recording state :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function addPSTNParticipantAsync(targetParticipant: string) {
  try {
    const callInvite: CallInvite = {
      targetParticipant: { phoneNumber: targetParticipant },
      sourceCallIdNumber: acsPhoneNumber,
    };
    const options: AddParticipantOptions = {
      operationContext: "addPstnUserContext",
      invitationTimeoutInSeconds: 30,
    };

    const response = await acsClient
      .getCallConnection(callConnectionId)
      .addParticipant(callInvite, options);

    console.log(`INVITATION ID:- ${response.invitationId}`)
  }
  catch (error) {
    console.error("Failed to add pstn participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function addACSParticipantAsync(acsParticipant: string) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: acsParticipant
    }
    const callInvite: CallInvite = {
      targetParticipant: communicationUserId,
    };
    const options: AddParticipantOptions = {
      operationContext: "addAcsUserContext",
      invitationTimeoutInSeconds: 30,
    };
    const response = await acsClient
      .getCallConnection(callConnectionId)
      .addParticipant(callInvite, options);
    console.log(`INVITATION ID:- ${response.invitationId}`)
  }
  catch (error) {
    console.error("Failed to add acs participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function muteACSParticipantAsync(acsParticipant: string) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: acsParticipant
    }
    await acsClient
      .getCallConnection(callConnectionId)
      .muteParticipant(communicationUserId);
    console.log(`Muted ACS participant: ${communicationUserId}`);
  }
  catch (error) {
    console.error("Failed to mute acs participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function removePSTNParticipantAsync(targetParticipant: string) {
  try {
    const participantPhoneNumber = { phoneNumber: targetParticipant }
    await acsClient
      .getCallConnection(callConnectionId)
      .removeParticipant(participantPhoneNumber);
  }
  catch (error) {
    console.error("Failed to remove pstn participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function removeACSParticipantAsync(targetParticipant: string) {
  try {
    const communicationUserId: CommunicationUserIdentifier = {
      communicationUserId: targetParticipant
    }
    await acsClient
      .getCallConnection(callConnectionId)
      .removeParticipant(communicationUserId);
  }
  catch (error) {
    console.error("Failed to remove acs participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function cancelAddParticipantAsync(invitationId: string) {
  try {
    await acsClient
      .getCallConnection(callConnectionId)
      .cancelAddParticipantOperation(invitationId);
  }
  catch (error) {
    console.error("Failed to cancel adding participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function cancelAllMediaOperationAsync() {
  try {
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .cancelAllOperations();
  }
  catch (error) {
    console.error("Failed to cancel media operation :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function transferCallToParticipantAsync(isPstn: boolean, transferTarget: string, targetParticipant: string) {
  try {
    let transferee: CommunicationIdentifier;
    let target: CommunicationIdentifier;

    if (isPstn) {
      target = { phoneNumber: transferTarget }
      transferee = { phoneNumber: targetParticipant }
    } else {
      target = { communicationUserId: transferTarget }
      transferee = { communicationUserId: targetParticipant }
    }

    const options: TransferCallToParticipantOptions = {
      operationContext: "transferCallContext",
      transferee: transferee,
    };
    await callConnection.transferCallToParticipant(
      target,
      options
    );
    console.log(`Transfer call initiated.`);
  }
  catch (error) {
    console.error("Failed to initiate transfer call :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function startMediaStreamingAsync() {
  try {
    const streamingOptions: StartMediaStreamingOptions = {
      operationContext: "startMediaStreamingContext",
      operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
    };
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .startMediaStreaming(streamingOptions);
  }
  catch (error) {
    console.error("Failed to start media streaming :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function stopMediaStreamingAsync() {
  try {
    const streamingOptions: StopMediaStreamingOptions = {
      operationContext: "stopMediaStreamingContext",
      operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
    };
    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .stopMediaStreaming(streamingOptions);
  }
  catch (error) {
    console.error("Failed to stop media streaming :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function holdParticipantAsync(isPstn: boolean, isWithPlaySource: boolean, targetParticipant: string) {
  try {
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
      console.log(target);
    } else {
      target = { communicationUserId: targetParticipant }
      console.log(target);
    }

    const fileSource: FileSource = {
      url: MEDIA_URI + "MainMenu.wav",
      kind: "fileSource",
    };

    const holdOptions: HoldOptions = {
      playSource: isWithPlaySource ? fileSource : undefined,
      operationContext: "holdUserContext",
      operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
    };

    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .hold(target, holdOptions);
  }
  catch (error) {
    console.error("Failed to hold participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function unholdParticipantAsync(isPstn: boolean, targetParticipant: string) {
  try {
    const unholdOptions: UnholdOptions = {
      operationContext: "unholdUserContext",
    };
    let target: CommunicationIdentifier;
    if (isPstn) {
      target = { phoneNumber: targetParticipant }
    } else {
      target = { communicationUserId: targetParticipant }
    }

    await acsClient
      .getCallConnection(callConnectionId)
      .getCallMedia()
      .unhold(target, unholdOptions);
  }
  catch (error) {
    console.error("Failed to unhold participant :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function playWithInterruptMediaFlagAsync() {
  try {
    const fileSource: FileSource = {
      url: MEDIA_URI + "MainMenu.wav",
      kind: "fileSource",
    };

    const playSources = [fileSource];

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
  catch (error) {
    console.error("Failed to play barge in :", error);
    console.log(`Error message:- ${error.message}`);
  }
}

async function getCallProperties(connectionId: string) {
  try {
    const response = await acsClient
      .getCallConnection(connectionId)
      .getCallConnectionProperties();
    return response;
  }
  catch (error) {
    console.error("Failed to get call properties :", error);
    console.log(`Error message:- ${error.message}`);
  }
}


app.post("/api/incomingCall", async (req: any, res: any) => {
  const event = req.body[0];
  const eventData = event.data;
  if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
    console.log("Received SubscriptionValidation event");
    res.status(200).json({
      validationResponse: eventData.validationCode,
    });

    return;
  }

  if (event.eventType === "Microsoft.Communication.IncomingCall") {
    console.log("INCOMING CALL...");
    callerId = eventData.from.rawId;
    console.log(`Caller Id:- ${callerId}`);

    const callbackUri = `${process.env.CALLBACK_URI + "/api/callbacks"}`;
    const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
    console.log(`WebSocket URL:- ${websocketUrl}`);
    const incomingCallContext = eventData.incomingCallContext;

    // const callIntelligenceOptions: CallIntelligenceOptions = {
    //   cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim(),
    // };
    const answerCallOptions: AnswerCallOptions = {
      //callIntelligenceOptions: callIntelligenceOptions,
      operationContext:"AnswerCallContext"
    };

    console.log("Answering incoming call with callback URI:", callbackUri);
    const answerResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
    console.log("Answer call result:", answerResult);
  }
});

// POST endpoint to handle ongoing call events
app.post("/api/testcall", async (req: any, res: any) => {
  try {
    console.log("=== CALLBACK RECEIVED ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    console.log("Request method:", req.method);
    console.log("Request URL:", req.url);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error processing callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST endpoint to handle ongoing call events
app.post("/api/callbacks", async (req: any, res: any) => {
  try {
    console.log("=== CALLBACK RECEIVED ===");
    
    // Handle both array and single event formats
    let events = Array.isArray(req.body) ? req.body : [req.body];
    
    if (!events || events.length === 0) {
      console.log("No events found in callback payload");
      return res.status(200).json({ message: "No events to process" });
    }

    for (const event of events) {
      if (!event || !event.data) {
        console.log("Invalid event structure:", event);
        continue;
      }

      const eventData = event.data;
      console.log("Processing event type:", event.type);
      
      if (eventData.callConnectionId) {
        callConnectionId = eventData.callConnectionId;
        console.log("Updated callConnectionId:", callConnectionId);
      }
      if (eventData.serverCallId) {
        serverCallId = eventData.serverCallId;
        console.log("Updated serverCallId:", serverCallId);
      }
      
      console.log(
        "Call back event received, callConnectionId=%s, serverCallId=%s, eventType=%s",
        callConnectionId,
        serverCallId,
        event.type
      );
      
      if (callConnectionId) {
        callConnection = acsClient.getCallConnection(callConnectionId);
      }

    if (event.type === "Microsoft.Communication.CallConnected") {
      console.log("Received CallConnected event");
      callConnectionId = eventData.callConnectionId;
      const properties = await getCallProperties(eventData.callConnectionId);
      console.log("CORRELATION ID****--> " + properties.correlationId);
      console.log("CALL CONNECTION ID****--> " + properties.callConnectionId);
      console.log("Answered For:-> " + properties.answeredFor);
      console.log("OperationContext:-> " + eventData.operationContext);

      console.log(
        "Media Streaming Subscription Id--> " +
        properties.mediaStreamingSubscription.id
      );
      console.log(
        "Media Streaming Subscription State--> " +
        properties.mediaStreamingSubscription.state
      );

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
      console.log(`Recording State:- ${eventData.state}`);
      recordingState = eventData.state;
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
    } else if (event.type === "Microsoft.Communication.CallDisconnected") {
      console.log("Received CallDisconnected event");
      console.log("CORELAITON ID:--" + eventData.correlationId);
    }
  }

  res.sendStatus(200);
  } catch (error) {
    console.error("Error processing callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST endpoint to receive recording events
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

// GET endpoint to download call audio
app.get("/download", async (req, res) => {
  if (recordingLocation === null || recordingLocation === undefined) {
    console.log("Failed to download, recordingLocation is invalid.");
    res.redirect("/");
  } else {
    try {
      // Set the appropriate response headers for the file download
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="recording.' + downloadRecordingFormat + '"'
      );
      res.setHeader("Content-Type", "audio/wav");
      const recordingStream = await acsClient
        .getCallRecording()
        .downloadStreaming(recordingLocation);

      // Pipe the recording stream to the response object.
      recordingStream.pipe(res);
    } catch (ex) {
      console.log(ex);
    }
  }
});

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

      // Pipe the recording metadata stream to the response object.
      recordingMetadataStream.pipe(res);
    } catch (ex) {
      console.log(ex);
    }
  }
});

// GET endpoint to serve the audio file
app.get("/audioprompt/:filename", (req, res) => {
  const filename = req.params.filename;
  const audioFilePath = path.join(BASE_MEDIA_PATH || "", filename);

  // Read the audio file
  fs.readFile(audioFilePath, (err, data) => {
    if (err) {
      console.error("Failed to read audio file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    // Set the appropriate response headers
    res.set("Content-Type", "audio/wav");
    res.set("Content-Length", data.length.toString());
    res.set("Cache-Control", "no-cache, no-store");
    res.set("Pragma", "no-cache");

    // Send the audio file as the response
    res.send(data);
  });
});

// GET endpoint to serve the webpage
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "src/webpage" });
});

// GET endpoint to place phone call
app.get("/outboundCall", async (req, res) => {
  console.log("Placing call...");
  const targetPhoneNumber = req.query.targetPhoneNumber;
  const pstn = req.query.isPstn === undefined ? false : true
  console.log("Target number: " + targetPhoneNumber);
  if (pstn) {
    console.log("Placing call to PSTN number...");
  } else {
    console.log("Placing call to ACS user...");
  }
  await createOutboundCall(targetPhoneNumber.toString());
  res.redirect("/");
});

app.get("/outboundCallACS", async (req, res) => {
  const acsUser = req.query.acsUserId;
  console.log("ACS MRI ID:-->" + acsUser)

  await createOutboundCallACS(acsUser.toString());
  res.redirect("/");
});

app.get("/groupCall", async (req, res) => {
  const acsUser = req.query.acsUserId;
  await createGroupCall(acsUser.toString());
  res.redirect("/");
});

app.get("/addPSTNParticipant", async (req, res) => {
  const targetParticipant = req.query.participantPhoneNumber;
  console.log(targetParticipant);
  await addPSTNParticipantAsync(targetParticipant.toString());
  res.redirect("/");
});

app.get("/addACSParticipant", async (req, res) => {
  const acsParticipant = req.query.acsParticipant;
  console.log(acsParticipant);
  await addACSParticipantAsync(acsParticipant.toString());
  res.redirect("/");
});

app.get("/getParticipant", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await getParticipant(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/getParticipantListAsync", async (req, res) => {
  await getParticipantListAsync();
  res.redirect("/");
});

app.get("/removePSTNParticipant", async (req, res) => {
  const targetParticipant = req.query.participantPhoneNumber;
  await removePSTNParticipantAsync(targetParticipant.toString());
  res.redirect("/");
});

app.get("/removeACSParticipant", async (req, res) => {
  const acsParticipant = req.query.acsParticipant;
  await removeACSParticipantAsync(acsParticipant.toString());
  res.redirect("/");
});

app.get("/cancelAddParticipant", async (req, res) => {
  const invitationId = req.query.invitationId;
  await cancelAddParticipantAsync(invitationId.toString());
  res.redirect("/");
});

app.get("/transferCallToParticipant", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const transferTarget = req.query.transferTarget;
  const targetParticipant = req.query.targetParticipant;
  await transferCallToParticipantAsync(pstn, transferTarget.toString(), targetParticipant.toString());
  res.redirect("/");
});

app.get("/playMediaToAllWithFileSource", async (req, res) => {
  await playMediaToAllWithFileSourceAsync();
  res.redirect("/");
});

app.get("/terminateCallAsync", async (req, res) => {
  const isForEveryone = req.query.isForEveryone === undefined ? false : true
  console.log("Is for everyone -->" + isForEveryone)
  await terminateCallAsync(isForEveryone);
  res.redirect("/");
});

app.get("/playMediaToTargetWithFileSource", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await playMediaToTargetWithFileSourceAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/playWithInterruptMediaFlag", async (req, res) => {
  await playWithInterruptMediaFlagAsync();
  res.redirect("/");
});

app.get("/recognizeMedia", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await playRecognizeAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/startContinuousDtmf", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await startContinuousDtmfAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/stopContinuousDtmf", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await stopContinuousDtmfAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/sendDtmfTones", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await startSendingDtmfToneAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/startRecording", async (req, res) => {
  const isRecordingWithCallConnectionId = req.query.isRecordingWithCallConnectionId === undefined ? false : true
  const isPauseOnStart = req.query.isPauseOnStart === undefined ? false : true
  const recordingContent = req.query.recordingContent;
  const recordingChannel = req.query.recordingChannel;
  const recordingFormat = req.query.recordingFormat;
  await startRecordingAsync(
    isRecordingWithCallConnectionId,
    isPauseOnStart,
    recordingContent.toString(),
    recordingChannel.toString(),
    recordingFormat.toString()
  );
  res.redirect("/");
});

app.get("/getRecordingState", async (req, res) => {
  if (recordingId) {
    await getRecordingState(recordingId);
  }
  else {
    console.log("Recording is not initiated.")
  }
  res.redirect("/");
});

app.get("/pauseRecording", async (req, res) => {
  await pauseRecordingAsync();
  res.redirect("/");
});

app.get("/resumeRecording", async (req, res) => {
  await resumeRecordingAsync();
  res.redirect("/");
});

app.get("/stopRecording", async (req, res) => {
  await stopRecordingAsync();
  res.redirect("/");
});

app.get("/startMediaStreaming", async (req, res) => {
  await startMediaStreamingAsync();
  res.redirect("/");
});

app.get("/stopMediaStreaming", async (req, res) => {
  await stopMediaStreamingAsync();
  res.redirect("/");
});

app.get("/muteACSParticipant", async (req, res) => {
  const acsParticipant = req.query.acsParticipant;
  await muteACSParticipantAsync(acsParticipant.toString());
  res.redirect("/");
});

app.get("/holdParticipant", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const isWithPlaySource = req.query.isWithPlaySource === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await holdParticipantAsync(pstn, isWithPlaySource, targetParticipant.toString());
  res.redirect("/");
});

app.get("/unholdParticipant", async (req, res) => {
  const pstn = req.query.isPstn === undefined ? false : true
  const targetParticipant = req.query.targetParticipant;
  await unholdParticipantAsync(pstn, targetParticipant.toString());
  res.redirect("/");
});

app.get("/cancelAllMediaOperation", async (req, res) => {
  await cancelAllMediaOperationAsync();
  res.redirect("/");
});

app.get("/createPSTNCallWithMediaStreaming", async (req, res) => {
  const targetPhoneNumber = req.query.targetPhoneNumber;
  const isStartMediaStreaming = req.query.isStartMediaStreaming === undefined ? false : true
  const isMixed = req.query.isMixed === undefined ? false : true
  const isEnableBidirection = req.query.isEnableBidirection === undefined ? false : true
  const isPCM24k = req.query.isPCM24k === undefined ? false : true
  console.log("PHONENUMBER:-->" + targetPhoneNumber.toString())
  await createPSTNCallWithMediaStreaming(targetPhoneNumber.toString(), isStartMediaStreaming, isMixed, isEnableBidirection, isPCM24k);
  res.redirect("/");
});

app.get("/createACSCallWithMediaStreaming", async (req, res) => {
  const acsUser = req.query.acsUserId;
  const isStartMediaStreaming = req.query.isStartMediaStreaming === undefined ? false : true
  const isMixed = req.query.isMixed === undefined ? false : true
  const isEnableBidirection = req.query.isEnableBidirection === undefined ? false : true
  const isPCM24k = req.query.isPCM24k === undefined ? false : true
  await createACSCallWithMediaStreamng(acsUser.toString(), isStartMediaStreaming, isMixed, isEnableBidirection, isPCM24k);
  res.redirect("/");
});

// Start the server
server.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  await createAcsClient();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  // console.log('Client connected');
  ws.on('message', (packetData: ArrayBuffer) => {
    const decoder = new TextDecoder();
    //const stringJson = decoder.decode(packetData);
    // console.log("STRING JSON=>--" + stringJson)
    var response = StreamingData.parse(packetData);
    const kind = StreamingData.getStreamingKind();

    if (kind === "AudioMetadata") {
      if ('encoding' in response) {
        console.log("--------------------------------------------")
        console.log("Audio metadata")
        console.log("SUBSCRIPTION ID:-->" + response.subscriptionId);
        console.log("ENCODING:-->" + response.encoding);
        console.log("SAMPLE RATE:-->" + response.sampleRate);
        console.log("CHANNELS:-->" + response.channels);
        // console.log("LENGTH:-->" + response.length);
        console.log("--------------------------------------------")
      }
    }
    else if (kind === "AudioData") {

      if ('isSilent' in response) {
        console.log("--------------------------------------------")
        console.log("Audio data")
        console.log("DATA:-->" + response.data);
        console.log("TIMESTAMP:-->" + response.timestamp);
        console.log("IS SILENT:-->" + response.isSilent);
        if (response.participant !== undefined) {
          if ('phoneNumber' in response.participant) {
            console.log("PARTICIPANT:-->" + response.participant.phoneNumber);
          }
          if ('communicationUserId' in response.participant) {
            console.log("PARTICIPANT:-->" + response.participant.communicationUserId);
          }
        }
        console.log("--------------------------------------------")
      }
    }
    else if (kind === "DtmfData") {
      if ('data' in response) {
        console.log("--------------------------------------------");
        console.log("DTMF Data:-->" + response.data);
        console.log("--------------------------------------------");
      }
    }
    else if (kind === "TranscriptionMetadata") {
      if ('locale' in response) {
        console.log("--------------------------------------------")
        console.log("Transcription Metadata")
        console.log("CALL CONNECTION ID:-->" + response.callConnectionId);
        console.log("CORRELATION ID:-->" + response.correlationId);
        console.log("LOCALE:-->" + response.locale);
        console.log("SUBSCRIPTION ID:-->" + response.subscriptionId);
        console.log("--------------------------------------------")
      }
    }
    else if (kind === "TranscriptionData") {
      if ('text' in response) {
        console.log("--------------------------------------------")
        console.log("Transcription Data")
        console.log("TEXT:-->" + response.text);
        console.log("FORMAT:-->" + response.format);
        console.log("CONFIDENCE:-->" + response.confidence);
        console.log("OFFSET IN TICKS:-->" + response.offsetInTicks);
        console.log("DURATION IN TICKS:-->" + response.durationInTicks);
        console.log("RESULT STATE:-->" + response.resultState);
        if ('phoneNumber' in response.participant) {
          console.log("PARTICIPANT:-->" + response.participant.phoneNumber);
        }
        if ('communicationUserId' in response.participant) {
          console.log("PARTICIPANT:-->" + response.participant.communicationUserId);
        }
        response.words.forEach(element => {
          console.log("TEXT:-->" + element.text)
          console.log("DURATION IN TICKS:-->" + element.durationInTicks)
          console.log("OFFSET IN TICKS:-->" + element.offsetInTicks)
        });
        console.log("--------------------------------------------")
      }
    }
    else {
      //do nothing
    }
  });

  //send recent logs on connected.
  recentLogs.forEach(log => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(log);
    }

  });

  ws.on('close', () => {
    //console.log('Client disconnected');
  });
});

console.log(`WebSocket server running on port ${PORT}`);

let recentLogs = [];

function broadcastLog(log) {
  recentLogs.push(log);
  if (recentLogs.length > 1000) recentLogs.shift();
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(log);
    }
  });
}

const originalLog = console.log;
console.log = (...args) => {
  const message = args.join(' ');
  originalLog(message);
  broadcastLog(message);
};

app.get("/clearLogs", async (req, res) => {
  recentLogs = [];
});
