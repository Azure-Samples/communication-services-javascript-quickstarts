import { config } from "dotenv";
import fs, { accessSync, unwatchFile } from "fs";
import http from 'http';
import WebSocket from 'ws';
import { Request, Response } from 'express';
import express, { Application } from "express";
import {
  CommunicationIdentifier,
  CommunicationUserIdentifier,
  isCommunicationUserIdentifier,
  PhoneNumberIdentifier,
} from "@azure/communication-common";
import { } from "@azure/communication-common";
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
  MediaStreamingOptions,
  TranscriptionOptions,
  StartMediaStreamingOptions,
  StopMediaStreamingOptions,
  StartTranscriptionOptions,
  UpdateTranscriptionOptions,
  StopTranscriptionOptions,
  HoldOptions,
  UnholdOptions,
  StreamingData,
  StreamingDataKind,
  AudioFormat,
  CallIntelligenceOptions,
  AnswerCallOptions,
  ConnectCallOptions,
  parseCallAutomationEvent,
  SummarizationOptions,
  SummarizeCallOptions
} from "@azure/communication-call-automation";
import path from "path";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static("webpage"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create common server for app and websocket
const server = http.createServer(app);

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
const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
const transportUrl = websocketUrl;
async function createAcsClient() {
  const connectionString = process.env.CONNECTION_STRING || "";
  acsClient = new CallAutomationClient(connectionString);
  console.log("Initialized ACS Client.");
}

async function sumarizeCall() {
  const summarizeCallOptions: SummarizeCallOptions = {
    operationContext: "SummarizeCallContext",
    summarizationOptions: {
      enableEndCallSummary: false,
      locale: "es-ES"
    }
  }
  await acsClient.getCallConnection(callConnectionId)
    .getCallMedia()
    .summarizeCall(summarizeCallOptions)
}

async function connectCall() {

  const mediaStreamingOptions: MediaStreamingOptions = {
    transportUrl: transportUrl,
    transportType: "websocket",
    contentType: "audio",
    audioChannelType: "unmixed",
    startMediaStreaming: true,
    // // enableDtmfTones: true,
    // enableBidirectional: true,
    // // audioFormat:"pcm24KMono",
    // audioFormat:"pcm16KMono",
  };

  const roomCallLocator: CallLocator = {
    id: "99455010479855809",
    kind: "roomCallLocator"
  }

  const transcriptionOptions: TranscriptionOptions = {
    transportUrl: transportUrl,
    transportType: "websocket",
    locale: "en-US",
    startTranscription: true,
  };

  const options: ConnectCallOptions = {
    callIntelligenceOptions: {
      cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
    },
    //mediaStreamingOptions: mediaStreamingOptions,
    transcriptionOptions: transcriptionOptions,
  };
  console.log("Connecting call...");
  const connectResult = await acsClient.connectCall(
    roomCallLocator,
    process.env.CALLBACK_URI + "/api/callbacks",
    options
  );

  console.log(`{Connect Correlation Id:- ${connectResult.callConnectionProperties.correlationId}}`)
}

async function createOutboundCall() {
  const callInvite: CallInvite = {
    targetParticipant: callee,
    sourceCallIdNumber: {
      phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER || "",
    },
  };

  const mediaStreamingOptions: MediaStreamingOptions = {
    transportUrl: transportUrl,
    //transportUrl: "https://abc.com",
    transportType: "websocket",
    contentType: "audio",
    audioChannelType: "unmixed",
    startMediaStreaming: true,
    // enableDtmfTones: true,
    // enableBidirectional: true,
    //audioFormat:"pcm24KMono",
    //audioFormat:"pcm16KMono",
  };

  const transcriptionOptions: TranscriptionOptions = {
    transportUrl: transportUrl,
    locale:"es-ES",
    transportType: "websocket",
    startTranscription: true,
    // enableSentimentAnalysis:true,
    // piiRedactionOptions:{
    //   enable:true,
    //   redactionType:"maskWithCharacter"
    // },
    // locales:["es-ES","en-US"],
    // summarizationOptions:{
    //   enableEndCallSummary:true,
    //   locale:"es-ES"
    // }
  };

  const options: CreateCallOptions = {
    callIntelligenceOptions: {
      cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
    },
    //mediaStreamingOptions: mediaStreamingOptions,
    transcriptionOptions: transcriptionOptions,
    operationContext: "CreatPSTNCallContext",
    enableLoopbackAudio:true
  };
  console.log("Placing outbound call...");
  await acsClient.createCall(
    callInvite,
    process.env.CALLBACK_URI + "/api/callbacks",
    options
  );
}

async function createOutboundCallACS() {
  // const communicationUserId: CommunicationUserIdentifier = {
  //   communicationUserId: targetCommuncationUser
  // }
  const callInvite: CallInvite = {
    targetParticipant: targetCommuncationUser,
  };

  const mediaStreamingOptions: MediaStreamingOptions = {
    transportUrl: transportUrl,
    transportType: "websocket",
    contentType: "audio",
    audioChannelType: "unmixed",
    startMediaStreaming: true,
  }

  // const transcriptionOptions: TranscriptionOptions = {
  //   transportUrl: transportUrl,
  //   transportType: "websocket",
  //   locale: "en-US",
  //   startTranscription: true,
  //   // enableSentimentAnalysis:true,
  //   // piiRedactionOptions:{
  //   //   enable:true,
  //   //   redactionType:"maskWithCharacter"
  //   // },
  //   // locales:["hi-IN","en-US"],
  //   // summarizationOptions:{
  //   //   enableEndCallSummary:true,
  //   //   locale:"en-us"
  //   // }
  // };

  const options: CreateCallOptions = {
    callIntelligenceOptions: {
      cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
    },
    //mediaStreamingOptions: mediaStreamingOptions,
    //transcriptionOptions: transcriptionOptions,
  };

  debugger;
  console.log("Placing outbound call...");
  await acsClient.createCall(
    callInvite,
    process.env.CALLBACK_URI + "/api/callbacks",
    options
  );
}

async function getParticipantAsync() {
  const callConnection = acsClient.getCallConnection(callConnectionId); // Get the call connection using the global callConnectionId
  const target = GetCommunicationTarget();

  const participant = await callConnection.getParticipant(target); // Retrieve the participants

  console.log("----------------------------------------------------------------------");

  console.log("Participant:-->", participant.identifier);
  console.log("Is Participant on hold:-->", participant.isOnHold);
  console.log("Is Participant on Mute:-->", participant.isMuted);
  console.log("----------------------------------------------------------------------");

}

async function getParticipantListAsync() {
  const callConnection = acsClient.getCallConnection(callConnectionId); // Get the call connection using the global callConnectionId
  const participants = await callConnection.listParticipants(); // Retrieve the participants

  console.log("----------------------------------------------------------------------");
  participants.values.map((participant) => {
    console.log("Participant:-->", participant.identifier);
    console.log("Is Participant on hold:-->", participant.isOnHold);
    console.log("Is Participant on Mute:-->", participant.isMuted);
    console.log("----------------------------------------------------------------------");
  });

}

async function createGroupCall() {
  const mediaStreamingOptions: MediaStreamingOptions = {
    transportUrl: transportUrl,
    transportType: "websocket",
    contentType: "audio",
    audioChannelType: "unmixed",
    startMediaStreaming: true,
  };

  const transcriptionOptions: TranscriptionOptions = {
    transportUrl: transportUrl,
    transportType: "websocket",
    locale: "en-US",
    startTranscription: true,
  };
  const communicationUserId = participantCommuncationUser
  const targets = [targetPhoneNumber, communicationUserId];
  //const targets = [targetPhoneNumber];
  const options: CreateCallOptions = {
    callIntelligenceOptions: {
      cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT,
    },
    operationContext: "groupCallContext",
    sourceCallIdNumber: acsPhoneNumber,
    mediaStreamingOptions: mediaStreamingOptions,
    //transcriptionOptions: transcriptionOptions,
    enableLoopbackAudio:false
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
    loop: false
  };
  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .playToAll([textSource], playToAllOptions);

    // await acsClient
    // .getCallConnection(callConnectionId)
    // .getCallMedia()
    // .playToAll([textSource]);
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
  const fileSource: FileSource = {
    url: MEDIA_URI + "MainMenu.wav",
    kind: "fileSource",
  };
  const target = GetCommunicationTarget();
  const playOptions: PlayOptions = {
    operationContext: "playToContext",
  };
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .play([textSource,fileSource], [target], playOptions);

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .play([textSource, fileSource], [target]);
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
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .play([fileSource], [target], playOptions);

    await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .play([fileSource], [target]);
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
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .playToAll(playSources, playToAllOptions);

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .playToAll(playSources);
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
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .play(playSources, [target], playOptions);

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .play(playSources, [target]);
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

async function playRecognizeAsync() {
  const textSource: TextSource = {
    text: "Hi, this recognize test please provide input.",
    voiceName: "en-US-NancyNeural",
    kind: "textSource",
  };

  const fileSource: FileSource = {
     url: MEDIA_URI + "MainMenu.wav",
    //url:"https://dummy.com/data",
    kind: "fileSource",
  };

    const ssmlSource: SsmlSource = {
    ssmlText:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="en-US-JennyNeural">Hi, this is ssml test played through ssml source thanks. Goodbye!</voice></speak>',
    kind: "ssmlSource",
  };

  const playSources = [textSource, fileSource, ssmlSource]

  

  const recognizeChoiceOptions: CallMediaRecognizeChoiceOptions = {
    choices: await getChoices(),
    interruptPrompt: false,
    initialSilenceTimeoutInSeconds: 10,
    //playPrompt: textSource,
    playPrompts:playSources,
    operationContext: "choiceContex",
    kind: "callMediaRecognizeChoiceOptions",
    speechLanguages: ["en-us", "en-au"],
    enableSentimentAnalysis: true
  };

  const recognizeDtmfOptions: CallMediaRecognizeDtmfOptions = {
    //playPrompt: textSource,
    playPrompts: playSources,
    interToneTimeoutInSeconds: 5,
    initialSilenceTimeoutInSeconds: 15,
    maxTonesToCollect: 4,
    interruptPrompt: false,
    operationContext: "dtmfContext",
    kind: "callMediaRecognizeDtmfOptions",
  };

  const recognizeSpeechOptions: CallMediaRecognizeSpeechOptions = {
    endSilenceTimeoutInSeconds: 30,
    // playPrompt: textSource,
    playPrompts: playSources,
    operationContext: "speechContext",
    kind: "callMediaRecognizeSpeechOptions",
    speechLanguages: ["en-us", "en-au"],
    enableSentimentAnalysis: true
  };

  const recongnizeSpeechOrDtmfOptions: CallMediaRecognizeSpeechOrDtmfOptions = {
    maxTonesToCollect: 2,
    endSilenceTimeoutInSeconds: 1,
    //playPrompt: textSource,
    playPrompts: playSources,
    initialSilenceTimeoutInSeconds: 30,
    interruptPrompt: true,
    operationContext: "sppechOrDtmfContext",
    kind: "callMediaRecognizeSpeechOrDtmfOptions",
    speechLanguages: ["en-us", "en-au"],
    enableSentimentAnalysis: true
  };

  const target = GetCommunicationTarget();

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .startRecognizing(target, recognizeSpeechOptions);
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

  // const callLocator: CallLocator = {
  //   id: "99472844827083807",
  //   kind: "roomCallLocator"
  // }
  const recordingStorage: RecordingStorage = {
    recordingStorageKind: "azureBlobStorage",
    recordingDestinationContainerUrl: bringYourOwnStorageUrl,
  };
  const recordingOptions: StartRecordingOptions = {
    callLocator: callLocator,
    // callConnectionId: callConnectionProperties.callConnectionId,
    recordingContent: "audioVideo",
    recordingChannel: "mixed",
    recordingFormat: "mp4",
    pauseOnStart: isPauseOnStart,
    // recordingStorage: isByos === true ? recordingStorage : undefined,
    recordingStateCallbackEndpointUrl:process.env.CALLBACK_URI + "/api/callbacks",
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

  const communicationUserId = participantCommuncationUser
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
  const communicationUserId = participantCommuncationUser
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
  const communicationUserId = participantCommuncationUser;
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
    // participantPhoneNumber,
    participantCommuncationUser,
    options
  );
  console.log(`Transfer call initiated.`);
}

async function startMediaStreamingAsync() {
  const streamingOptions: StartMediaStreamingOptions = {
    operationContext: "startMediaStreamingContext",
    operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
  };
  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .startMediaStreaming(streamingOptions);

  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .startMediaStreaming();
}

async function stopMediaStreamingAsync() {
  const streamingOptions: StopMediaStreamingOptions = {
    operationContext: "stopMediaStreamingContext",
    operationCallbackUrl: process.env.CALLBACK_URI + "/api/callbacks",
  };
  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .stopMediaStreaming(streamingOptions);
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .stopMediaStreaming();

}

async function startTranscriptionAsync() {
  const startTranscriptionOptions: StartTranscriptionOptions = {
    locale: "en-us",
    operationContext: "startTranscriptionContext",
    // enableSentimentAnalysis: true,
    // piiRedactionOptions: {
    //   enable: true,
    //   redactionType: "maskWithCharacter"
    // },
    // // locales:["hi-IN","en-US"],
    // // summarizationOptions:{
    // //   enableEndCallSummary:true,
    // //   locale:"en-us"
    // // }
  };
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .startTranscription(startTranscriptionOptions);

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .startTranscription();

}
async function updateTranscriptionAsync() {
  const options: UpdateTranscriptionOptions = {
    operationContext: "updateTranscriptionContext",
    // piiRedactionOptions: {
    //   enable: true,
    //   redactionType: "maskWithCharacter"
    // },
    // summarizationOptions: {
    //   enableEndCallSummary: false,
    //   locale: "en-us"
    // }
  };
  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .updateTranscription("en-au", options);
}

async function stopTranscriptionAsync() {
  const stopTranscriptionOptions: StopTranscriptionOptions = {
    operationContext: "stopTranscriptionOptions",
  };
  // await acsClient
  //   .getCallConnection(callConnectionId)
  //   .getCallMedia()
  //   .stopTranscription(stopTranscriptionOptions);

  await acsClient
    .getCallConnection(callConnectionId)
    .getCallMedia()
    .stopTranscription();

}

async function holdParticipantAsync() {
  const textSource: TextSource = {
    text: "Hi, You are on hold please wait...",
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

    // await acsClient
    // .getCallConnection(callConnectionId)
    // .getCallMedia()
    // .hold(target);
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
    text: "Hi, this is barge in test played through play source thanks. Goodbye!",
    voiceName: "en-US-NancyNeural",
    kind: "textSource",
  };

  const fileSource: FileSource = {
    url: MEDIA_URI + "MainMenu.wav",
    kind: "fileSource",
  };

  const ssmlSource: SsmlSource = { ssmlText: "", kind: "ssmlSource" };

  // const playSources = [textSource, fileSource, ssmlSource];
  const playSources = [textSource];

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
    //const uuid = uuidv4();
    //const callbackUri = `${process.env.CALLBACK_HOST_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
    const callbackUri = `${process.env.CALLBACK_URI + "/api/callbacks"}`;
    const websocketUrl = process.env.CALLBACK_URI.replace(/^https:\/\//, 'wss://');
    console.log(`WebSocket URL:- ${websocketUrl}`);
    const incomingCallContext = eventData.incomingCallContext;
    //console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICES_ENDPOINT.trim()}`);

    const mediaStreamingOptions: MediaStreamingOptions = {
      transportUrl: websocketUrl,
      transportType: "websocket",
      contentType: "audio",
      audioChannelType: "unmixed",
      startMediaStreaming: true,
      // enableDtmfTones: true,
      // enableBidirectional: false,
      // //audioFormat:"pcm24KMono",
      // audioFormat: "pcm16KMono",
    };

    // const transcriptionOptions: TranscriptionOptions = {
    //   transportUrl: websocketUrl,
    //   transportType: "websocket",
    //   locale: "en-US",
    //   startTranscription: true,
    //   // enableSentimentAnalysis: true,
    //   // piiRedactionOptions: {
    //   //   enable: true,
    //   //   redactionType: "maskWithCharacter"
    //   // },
    //   // locales: ["hi-IN", "en-US"],
    //   // summarizationOptions: {
    //   //   enableEndCallSummary: true,
    //   //   locale: "hi-IN"
    //   // }
    // // }

    const transcriptionOptions: TranscriptionOptions = {
      transportUrl: websocketUrl,
      transportType: "websocket",
      locale: "en-US",
      startTranscription: true,
    }
    const callIntelligenceOptions: CallIntelligenceOptions = {
      cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICES_ENDPOINT.trim(),
    };
    const answerCallOptions: AnswerCallOptions = {
      callIntelligenceOptions: callIntelligenceOptions,
      //mediaStreamingOptions: mediaStreamingOptions,
      transcriptionOptions: transcriptionOptions,
      enableLoopbackAudio:true
    };

    // const callInvite : CallInvite = {
		// 			targetParticipant: {
    //         communicationUserId:"8:acs:19ae37ff-1a44-4e19-aade-198eedddbdf2_00000029-3849-70e9-9ef3-3a3a0d00438f"
    //       }
		// 		};

    // await acsClient.redirectCall(incomingCallContext, callInvite)

    await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
  }
});


// POST endpoint to handle ongoing call events
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

  const eventParser = parseCallAutomationEvent(event)
  if (eventParser.kind === "TranscriptionStarted") {
    console.log("OperationContext:--" + eventParser.operationContext)
    console.log("CorrelationId:--" + eventParser.correlationId)
  }
  if (eventParser.kind === "TranscriptionCallSummaryUpdated") {
    console.log("OperationContext:--" + eventParser.operationContext)
    console.log("CorrelationId:--" + eventParser.correlationId)
    var transcriptionUpdate = eventParser.transcriptionUpdate
    console.log("Summarization Message:--" + transcriptionUpdate?.transcriptionMessage)
  }
  if (eventParser.kind === "TranscriptionStopped") {
    console.log("OperationContext:--" + eventParser.operationContext)
    console.log("CorrelationId:--" + eventParser.correlationId)
  }

  if (event.type === "Microsoft.Communication.CallConnected") {
    console.log("Received CallConnected event");
    callConnectionId = eventData.callConnectionId;
    debugger;
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

    console.log(
      "Transcription Subscription Id--> " +
      properties.transcriptionSubscription.id
    );
    console.log(
      "Transcription Subscription State--> " +
      properties.transcriptionSubscription.state
    );
  } else if (event.type === "Microsoft.Communication.RecognizeCompleted") {
    console.log("Received RecognizeCompleted event");
    callConnectionId = eventData.callConnectionId;
    if (eventData.recognitionType === "choices") {
      const labelDetected = eventData.choiceResult.label;
      console.log(`Detected label:--> ${labelDetected}`);
      console.log("#######"+ JSON.stringify(eventData.choiceResult));
      console.log(`Language Identified-${eventData.choiceResult.languageIdentified}`)
      if (eventData.choiceResult && eventData.choiceResult.sentimentAnalysisResult !== undefined) {
        console.log(`Sentiment-${eventData?.choiceResult.sentimentAnalysisResult.sentiment}`)
      }
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
      console.log(`Language Identified-${eventData.speechResult.languageIdentified}`)
      if (eventData.speechResult && eventData.speechResult.sentimentAnalysisResult !== undefined) {
        console.log(`Sentiment-${eventData?.speechResult.sentimentAnalysisResult.sentiment}`)
      }
    }
  } else if (event.type === "Microsoft.Communication.RecognizeFailed") {
    console.log("Received RecognizeFailed event");
    callConnectionId = eventData.callConnectionId;
    console.log(
      `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
    );
    console.log(`Message:->${eventData.resultInformation.message}`);
    console.log(`PlayFailedSourceIndex:->${eventData.failedPlaySourceIndex}`);
  } else if (event.type === "Microsoft.Communication.RecognizeCanceled") {
    console.log("Received RecognizeCanceled event");
    callConnectionId = eventData.callConnectionId;
  } else if (event.type === "Microsoft.Communication.PlayStarted") {
    console.log("Received PlayStarted event");
    callConnectionId = eventData.callConnectionId;
  } else if (event.type === "Microsoft.Communication.PlayCompleted") {
    console.log("Received PlayCompleted event");
    callConnectionId = eventData.callConnectionId;
    console.log("OperationContext:- " + eventData?.operationContext);
  } else if (event.type === "Microsoft.Communication.PlayFailed") {
    console.log("Received PlayFailed event");
    callConnectionId = eventData.callConnectionId;
    console.log(
      `Code:->${eventData.resultInformation.code}, Subcode:->${eventData.resultInformation.subCode}`
    );
    console.log(`Message:->${eventData.resultInformation.message}`);
    console.log(`PlayFailedSourceIndex:->${eventData.failedPlaySourceIndex}`);
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
    console.log(`RECORDING STATE:->${eventData.state}`);
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
    // } else if (event.type === "Microsoft.Communication.TranscriptionStarted") {
    //   console.log("Received TranscriptionStarted event");
    //   callConnectionId = eventData.callConnectionId;
    //   console.log("OperationContext:- "+eventData.operationContext);
    //   console.log(eventData.transcriptionUpdate.transcriptionStatus);
    //   console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
    // } else if (event.type === "Microsoft.Communication.TranscriptionStopped") {
    //   console.log("Received TranscriptionStopped event");
    //   callConnectionId = eventData.callConnectionId;
    //   console.log("############ "+JSON.stringify(eventData))
    //   console.log("OperationContext:- "+eventData.operationContext);
    //   console.log(eventData.transcriptionUpdate.transcriptionStatus);
    //   console.log(eventData.transcriptionUpdate.transcriptionStatusDetails);
  } else if (event.type === "Microsoft.Communication.TranscriptionUpdated") {
    console.log("Received TranscriptionUpdated event");
    callConnectionId = eventData.callConnectionId;
    console.log("OperationContext:- " + eventData.operationContext);
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
    console.log("CORELAITON ID:--" + eventData.correlationId);
  }

  res.sendStatus(200);
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
        'attachment; filename="recording.wav"'
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
  const audioFilePath = path.join(process.env.BASE_MEDIA_PATH || "", filename);

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

app.get("/connectCall", async (req, res) => {

  await connectCall();
  res.redirect("/");
});

// GET endpoint to place phone call
app.get("/outboundCall", async (req, res) => {
  callee = {
    phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
  };

  await createOutboundCall();
  res.redirect("/");
});

app.get("/outboundCallACS", async (req, res) => {
  await createOutboundCallACS();
  res.redirect("/");
});
app.get("/groupCall", async (req, res) => {
  await createGroupCall();
  res.redirect("/");
});

app.get("/outboundCall", async (req, res) => {
  const targetPhoneNumber = req.query.targetPhoneNumber;
  console.log("PHONENUMBER:-->" + targetPhoneNumber)
  callee = {
    phoneNumber: process.env.TARGET_PHONE_NUMBER || "",
  };

  await createOutboundCall();
  res.redirect("/");
});

app.get("/addPSTNParticipant", async (req, res) => {
  await addPSTNParticipantAsync();
  res.redirect("/");
});

app.get("/addACSParticipant", async (req, res) => {
  await addACSParticipantAsync();
  res.redirect("/");
});

app.get("/getParticipantAsync", async (req, res) => {
  await getParticipantAsync();
  res.redirect("/");
});

app.get("/getParticipantListAsync", async (req, res) => {
  await getParticipantListAsync();
  res.redirect("/");
});

app.get("/removePSTNParticipant", async (req, res) => {
  await removePSTNParticipantAsync();
  res.redirect("/");
});

app.get("/removeACSParticipant", async (req, res) => {
  await removeACSParticipantAsync();
  res.redirect("/");
});

app.get("/transferCallToParticipant", async (req, res) => {
  await transferCallToParticipantAsync();
  res.redirect("/");
});

app.get("/playMediaToAllWithTextSource", async (req, res) => {
  await playMediaToAllWithTextSourceAsync();
  res.redirect("/");
});

app.get("/playMediaToAllWithFileSource", async (req, res) => {
  await playMediaToAllWithFileSourceAsync();
  res.redirect("/");
});

app.get("/terminateCallAsync", async (req, res) => {
  await terminateCallAsync();
  res.redirect("/");
});
app.get("/playMediaToAllWithSSMLSource", async (req, res) => {
  await playMediaToAllWithSSMLSourceAsync();
  res.redirect("/");
});

app.get("/playMediaToTargetWithTextSource", async (req, res) => {
  await playMediaToTargetWithTextSourceAsync();
  res.redirect("/");
});

app.get("/playMediaToTargetWithFileSource", async (req, res) => {
  await playMediaToTargetWithFileSourceAsync();
  res.redirect("/");
});

app.get("/playMediaToTargetWithSSMLSource", async (req, res) => {
  await playMediaToTargetWithSSMLSourceAsync();
  res.redirect("/");
});

app.get("/playMediaToAllWithMultiplePlaySources", async (req, res) => {
  await playMediaToAllWithMultiplePlaySourcesAsync();
  res.redirect("/");
});

app.get(
  "/playMediaToTargetWithMultiplePlaySources",
  async (req, res) => {
    await playMediaToTargetWithMultiplePlaySourcesAsync();
    res.redirect("/");
  }
);

app.get("/playMediaToAllWithInvalidPlaySource", async (req, res) => {
  await playMediaToAllWithInvalidPlaySourceAsync();
  res.redirect("/");
});

app.get(
  "/playMediaToTargetWithInvalidPlaySource",
  async (req, res) => {
    await playMediaToTargetWithInvalidPlaySourceAsync();
    res.redirect("/");
  }
);

app.get("/recognizeMedia", async (req, res) => {
  await playRecognizeAsync();
  res.redirect("/");
});

app.get("/startContinuousDtmf", async (req, res) => {
  await startContinuousDtmfAsync();
  res.redirect("/");
});

app.get("/stopContinuousDtmf", async (req, res) => {
  await stopContinuousDtmfAsync();
  res.redirect("/");
});

app.get("/sendDtmfTones", async (req, res) => {
  await startSendingDtmfToneAsync();
  res.redirect("/");
});

app.get("/startRecording", async (req, res) => {
  await startRecordingAsync();
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

app.get("/startTranscription", async (req, res) => {
  await startTranscriptionAsync();
  res.redirect("/");
});

app.get("/muteACSParticipant", async (req, res) => {
  await muteACSParticipantAsync();
  res.redirect("/");
});

app.get("/updateTranscription", async (req, res) => {
  await updateTranscriptionAsync();
  res.redirect("/");
});

app.get("/stopTranscriptionAsync", async (req, res) => {
  await stopTranscriptionAsync();
  res.redirect("/");
});

app.get("/holdParticipant", async (req, res) => {
  await holdParticipantAsync();
  res.redirect("/");
});

app.get("/unholdParticipant", async (req, res) => {
  await unholdParticipantAsync();
  res.redirect("/");
});

app.get("/playWithInterruptMediaFlag", async (req, res) => {
  await playWithInterruptMediaFlagAsync();
  res.redirect("/");
});

app.get("/cancelAllMediaOperation", async (req, res) => {
  await cancelAllMediaOperationAsync();
  res.redirect("/");
});

app.get("/summarizeCall", async (req, res) => {
  await sumarizeCall();
  res.redirect("/");
});

// Start the server
server.listen(PORT, async () => {
  console.log(`Server is listening on port ${PORT}`);
  await createAcsClient();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  ws.on('message', (packetData: ArrayBuffer) => {
    const decoder = new TextDecoder();
    const stringJson = decoder.decode(packetData);
    console.log("STRING JSON=>--" + stringJson)
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
        console.log("SPEECH MODEL ENDPOINT:-->" + response.speechRecognitionModelEndpointId);
        console.log("IS ENABLE SENTIMENT ANALYSIS:-->" + response?.enableSentimentAnalysis);
        if (response.piiRedactionOptions) {
          console.log("PII REDACTION ENABLE:-->" + response.piiRedactionOptions?.enable);
          console.log("PII REDACTION TYPE:-->" + response.piiRedactionOptions?.redactionType);
        }

        if (response.locales) {
          response.locales.map(language => {
            console.log("LOCALES:-->" + language);
          })
        }

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
        if (response.sentimentAnalysisResult) {
          console.log("SENTIMENT:-->" + response.sentimentAnalysisResult.sentiment)
        }
        console.log("LANGUAGE IDENTIFIED:-->" + response.languageIdentified);
        console.log("--------------------------------------------")
      }
    }
    else {
      //console.log(stringJson)
      //{"kind":"DtmfData","dtmfData":{"data":"8"}}
    }

  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server running on port ${PORT}`);