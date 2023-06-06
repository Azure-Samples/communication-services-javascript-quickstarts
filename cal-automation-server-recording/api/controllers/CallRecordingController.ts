import {
  CallLocator,
  StartRecordingOptions,
  RecordingChannel,
  CallRecording,
  CallInvite,
  CreateCallOptions,
  parseCallAutomationEvent,
  CallAutomationEvent
} from "@azure/communication-call-automation";
import { Request, Response } from "express";
import * as fs from "fs";
import Root from "../../Root";
import { Mapper, FileFormat, FileDownloadType } from "../../FileFormat";
import { PhoneNumberIdentifier } from "@azure/communication-common";
import { CloudEvent, SubscriptionValidationEventData,EventGridEvent, AcsRecordingFileStatusUpdatedEventData } from "@azure/eventgrid";

var cfg = require("../../config");

const connectionString = cfg.ConnectionString;

var CallAutomationClient = require("@azure/communication-call-automation");
const { Logger, MessageType } = require("../../Logger");
var appCallbackUrl = cfg.CallbackUri +  "/api/callbacks";
// for simplicity using static values
var serverCallId = "";
var callConnectionId = "";
var recordingId = "";
var contentLocation = "";
var deleteLocation = "";

const client = new CallAutomationClient.CallAutomationClient(connectionString);

let recordingData = new Map<string, string>();
let recFileFormat: FileFormat = FileFormat.mp4;

exports.startUp = function (req: Request, res: Response) {
  res.json("App is running...");
};

/// <summary>
/// Start outbound call, Run before start recording
exports.outboundCall=async function(req: Request, res: Response)
{
  var callerId: PhoneNumberIdentifier ={ phoneNumber: cfg.ACSAcquiredPhoneNumber};
    var target:PhoneNumberIdentifier={ phoneNumber: req.query.targetPhoneNumber as string};
    var callInvite:CallInvite = {
      targetParticipant:target,
      sourceCallIdNumber:callerId,
    sourceDisplayName: "ServerRecording App"
    };

    var createCallOptions: CreateCallOptions = {
      sourceCallIdNumber: callerId,
      sourceDisplayName: "ServerRecording App",
  };

  Logger.logMessage(MessageType.INFORMATION, "Performing CreateCall operation");

 var callConnection = await client.createCall(
      callInvite,
      appCallbackUrl,
      createCallOptions
  );
    callConnectionId = callConnection.Value.CallConnection.CallConnectionId;
    res.status(200).send(`CallConnectionId: ${callConnectionId}`);
}

exports.startRecording = async function (req: Request, res: Response) {
  try {
  serverCallId = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    Logger.logMessage(
      MessageType.INFORMATION,
      "Start recording API called with serverCallId =  " + serverCallId
    );
    var locator: CallLocator = { id: serverCallId,kind:"serverCallLocator" };
    var options: StartRecordingOptions = { callLocator: locator };
    var startRecordingRequestOutput = await client
      .getCallRecording()
      .startRecording(options);

    recordingData.set(serverCallId, startRecordingRequestOutput.recordingId);
    return res.json(startRecordingRequestOutput);
  } catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
};

exports.pauseRecording = async function (req: Request, res: Response) {
  try {
    let recordingId: string = req.query.recordingId!.toString();
      var response = await client.getCallRecording().pauseRecording(recordingId);
      Logger.logMessage(MessageType.INFORMATION,"Pause Recording response -- > "+response);
      return res.json("Ok");
  } catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
};

exports.resumeRecording = async function (req: Request, res: Response) {
  try {
     recordingId = req.query.recordingId!.toString();
      var response = await client.getCallRecording().resumeRecording(recordingId);
      Logger.logMessage(MessageType.INFORMATION,"Pause Recording response -- > "+response);
      return res.json("Ok");
  } catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
};

exports.stopRecording = async function (req: Request, res: Response) {
  try {
     recordingId = req.query.recordingId!.toString();
      var response=await client.getCallRecording().stopRecording(recordingId);
      Logger.logMessage(MessageType.INFORMATION,"Pause Recording response -- > "+response);
      return res.json("Ok");
  } catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
};

exports.getRecordingState = async function (req: Request, res: Response) {
  try {
     recordingId = req.query.recordingId!.toString();
    var RecordingStateRequestOutput = await client
      .getCallRecording()
      .getRecordingState(recordingId);
    if (
      RecordingStateRequestOutput &&
      RecordingStateRequestOutput.recordingState
    ) {
      return res.json(RecordingStateRequestOutput.recordingState);
    } else {
      return res
        .status(
          RecordingStateRequestOutput.statusCode
            ? RecordingStateRequestOutput.statusCode
            : "500"
        )
        .json(RecordingStateRequestOutput.message);
    }
  } catch (e) {
    return res.status(e.statusCode).json(String(e.output));
  }
};

exports.recordingFileStatus = async function (req: Request, res: Response) {
  Logger.logMessage(MessageType.INFORMATION, "Request data ---- >" + JSON.stringify(req.body));
        var eventGridEvents = req.body;
        for (var eventGridEvent of eventGridEvents) {
            if (eventGridEvent.eventType == "Microsoft.EventGrid.SubscriptionValidationEvent") {
                var subscriptionValidationEventData:SubscriptionValidationEventData=eventGridEvent.data;
                if (subscriptionValidationEventData.validationCode) {
                    let responseData = {validationResponse: subscriptionValidationEventData.validationCode};
                    return res.json(responseData);
                }
            }

          if (eventGridEvent.eventType== "Microsoft.EventGrid.AcsRecordingFileStatusUpdatedEventData")
          {
            var statusUpdated:AcsRecordingFileStatusUpdatedEventData=eventGridEvent.status;
              contentLocation = statusUpdated.recordingStorageInfo.recordingChunks[0].contentLocation;
              deleteLocation = statusUpdated.recordingStorageInfo.recordingChunks[0].deleteLocation;
          }
      }
      return res.status(200).send(`Recording Download Location :${contentLocation}, Recording Delete Location: ${deleteLocation}`);
  }
  /// <summary>
        /// Download Recording
exports.downloadRecording= async function(req: Request,res:Response)
{
  var callRecording = client.GetCallRecording();
  callRecording.DownloadTo(contentLocation, "Recording_File.wav");
  return res.status(200).send("Ok");
}

/// <summary>
/// Delete Recording
exports.deleteRecording= async function(req: Request,res:Response)
{
    client.GetCallRecording().Delete(deleteLocation);
    return res.status(200).send("Ok");
}

   /// <summary>
   /// Call backs for signalling events, [Do not call from debugger tool]
exports.callbacks= async function(req: Request,res:Response)
{
  var cloudEvents=req.body;
    try
    {
      for (var cloudEvent of cloudEvents) {
          Logger.logMessage(MessageType.INFORMATION,"Event received: " +JSON.stringify(cloudEvent));
          var event:CallAutomationEvent = parseCallAutomationEvent(cloudEvent)
            // for start recording we required server call id, so capture it when call connected.
            if (event.kind="CallConnected")
            {
              Logger.logMessage(MessageType.INFORMATION,"Server Call Id: " +event.serverCallId);
              break;
            }
        }
    }
    catch (e)
    {
      return res.status(e.statusCode).json(String(e.output));
    }
    return res.status(200).send("Ok");
}