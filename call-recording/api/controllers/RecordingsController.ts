import {
  CallLocator,
  StartRecordingOptions,
  CallInvite,
  CreateCallOptions,
  parseCallAutomationEvent,
  CallAutomationEvent
} from "@azure/communication-call-automation";
import { Request, Response } from "express";
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { SubscriptionValidationEventData, AcsRecordingFileStatusUpdatedEventData } from "@azure/eventgrid";

var cfg = require("../../config");
var CallAutomationClient = require("@azure/communication-call-automation");
const { Logger, MessageType } = require("../../Logger");
const connectionString = cfg.ConnectionString;
var appCallbackUrl = cfg.CallbackUri + "/api/callbacks";
// for simplicity using static values
var serverCallId = "";
var callConnectionId = "";
var recordingId = "";
var contentLocation = "";
var deleteLocation = "";

const client = new CallAutomationClient.CallAutomationClient(connectionString);

exports.startUp = function (req: Request, res: Response) {
  res.json("App is running...");
};

/// <summary>
/// Start outbound call, Run before start recording
exports.outboundCall = async function (req: Request, res: Response) {
  var callerId: PhoneNumberIdentifier = { phoneNumber: cfg.ACSAcquiredPhoneNumber };
  var target: PhoneNumberIdentifier = { phoneNumber: cfg.TargetPhoneNumber as string };
  var callInvite: CallInvite = {
    targetParticipant: target,
    sourceCallIdNumber: callerId,
    sourceDisplayName: "ServerRecording App"
  };

  var createCallOptions: CreateCallOptions = {
    sourceCallIdNumber: callerId,
    sourceDisplayName: "ServerRecording App",
  };

  Logger.logMessage(MessageType.INFORMATION, "Performing CreateCall operation");

  var callConnection = await client.createCall(callInvite,appCallbackUrl,createCallOptions);
  callConnectionId = callConnection.callConnectionProperties.callConnectionId;
  res.status(200).send(`CallConnectionId: ${callConnectionId}`);
}

exports.startRecording = async function (req: Request, res: Response) {
  try {
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    Logger.logMessage(MessageType.INFORMATION,"Start recording API called with serverCallId =  " + serverCallId);
    var locator: CallLocator = { id: serverCallId, kind: "serverCallLocator" };
    var options: StartRecordingOptions = { callLocator: locator };
    var startRecordingRequestOutput = await client.getCallRecording().start(options);
    recordingId = startRecordingRequestOutput.recordingId;
    return res.json(startRecordingRequestOutput);
  } catch (e) {
    return res.json(String(e.message));
  }
};

exports.pauseRecording = async function (req: Request, res: Response) {
  try {
    await client.getCallRecording().pause(recordingId);
    return res.json("Ok");
  } catch (e) {
    return res.json(String(e.message));
  }
};

exports.resumeRecording = async function (req: Request, res: Response) {
  try {
    await client.getCallRecording().resume(recordingId);
    return res.json("Ok");
  } catch (e) {
    return res.json(String(e.message));
  }
};

exports.stopRecording = async function (req: Request, res: Response) {
  try {
    await client.getCallRecording().stop(recordingId);
    return res.json("Ok");
  } catch (e) {
    return res.json(String(e.message));
  }
};

exports.getRecordingState = async function (req: Request, res: Response) {
  try {
    var RecordingStateRequestOutput = await client.getCallRecording().getState(recordingId);
    if (RecordingStateRequestOutput && RecordingStateRequestOutput.recordingState) {
      return res.json(RecordingStateRequestOutput.recordingState);
    } else {
      return res.status(RecordingStateRequestOutput.statusCode ? RecordingStateRequestOutput.statusCode  : "500").json(RecordingStateRequestOutput.message);
    }
  } catch (e) {
    return res.json(String(e.message));
  }
};

exports.recordingFileStatus = async function (req: Request, res: Response) {
  Logger.logMessage(MessageType.INFORMATION, "Request data ---- >" + JSON.stringify(req.body));
  var eventGridEvents = req.body;
  for (var eventGridEvent of eventGridEvents) {
    if (eventGridEvent.eventType == "Microsoft.EventGrid.SubscriptionValidationEvent") {
      var subscriptionValidationEventData: SubscriptionValidationEventData = eventGridEvent.data;
      if (subscriptionValidationEventData.validationCode) {
        let responseData = { validationResponse: subscriptionValidationEventData.validationCode };
        return res.json(responseData);
      }
    }

    if (eventGridEvent.eventType == "Microsoft.Communication.RecordingFileStatusUpdated") {
      var statusUpdated: AcsRecordingFileStatusUpdatedEventData = eventGridEvent.data;
      contentLocation = statusUpdated.recordingStorageInfo.recordingChunks[0].contentLocation;
      deleteLocation = statusUpdated.recordingStorageInfo.recordingChunks[0].deleteLocation;
    }
  }
  return res.status(200).send(`Recording Download Location :${contentLocation}, Recording Delete Location: ${deleteLocation}`);
}
/// <summary>
/// Download Recording
exports.downloadRecording = async function (req: Request, res: Response) {
  var callRecording = client.getCallRecording();
  callRecording.downloadToPath(contentLocation, "Recording_File.wav");
  return res.status(200).send("Ok");
}

/// <summary>
/// Delete Recording
exports.deleteRecording = async function (req: Request, res: Response) {
  client.getCallRecording().delete(deleteLocation);
  return res.status(200).send("Ok");
}

/// <summary>
/// Call backs for signalling events, [Do not call from debugger tool]
exports.callbacks = async function (req: Request, res: Response) {
  var cloudEvents = req.body;
  try {
    for (var cloudEvent of cloudEvents) {
      Logger.logMessage(MessageType.INFORMATION, "Event received: " + JSON.stringify(cloudEvent));
      var event: CallAutomationEvent = parseCallAutomationEvent(cloudEvent)
      // for start recording we required server call id, so capture it when call connected.
      if (event.kind = "CallConnected") {
        serverCallId = event.serverCallId;
        break;
      }
    }
  }
  catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
  return res.status(200).send("Ok");
}