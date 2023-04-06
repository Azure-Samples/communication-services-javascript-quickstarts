import {
  ServerCallLocator,
  StartRecordingOptions,
  RecordingChannel
} from "@azure/communication-call-automation";
import { Request, Response } from "express";
import * as fs from "fs";
import Root from "../../Root";
import { Mapper, FileFormat, FileDownloadType } from "../../FileFormat";
import { BlobDownloadResponseModel } from "@azure/storage-blob";

var cfg = require("../../config");

const connectionString = cfg.ConnectionString;
const callbackUri = cfg.CallbackUri;

var CallAutomationClient = require("@azure/communication-call-automation");
const { EventGridDeserializer } = require("@azure/eventgrid");
const { BlobStorageHelper } = require("../../BlobStorageHelper");
const { Logger, MessageType } = require("../../Logger");

const client = new CallAutomationClient.CallAutomationClient(connectionString);

let recordingData = new Map<string, string>();
let recFileFormat: FileFormat = FileFormat.mp4;

exports.startUp = function (req: Request, res: Response) {
  res.json("App is running...");
};

exports.startRecording = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    Logger.logMessage(
      MessageType.INFORMATION,
      "Start recording API called with serverCallId =  " + serverCallId
    );
    var locator: ServerCallLocator = { id: serverCallId };
    var output = await client.startRecording(locator, callbackUri);

    recordingData.set(serverCallId, output.recordingId);
    return res.json(output);
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.startRecordingWithOptions = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();

    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }

    let recordingContent: string = req.query.recordingContent
      ? req.query.recordingContent.toString()
      : "audiovideo";
    let recordingChannel: string = req.query.recordingChannel
      ? req.query.recordingChannel.toString()
      : "mixed";
    let recordingFormat: string = req.query.recordingFormat
      ? req.query.recordingFormat.toString()
      : "mp4";
  
    Logger.logMessage(
      MessageType.INFORMATION,
      "Start recording API called with serverCallId =  " + serverCallId
    );

    var locator: ServerCallLocator = { id: serverCallId };
    var mapper = new Mapper();
    var content = mapper.recContentMap.get(recordingContent)
      ? mapper.recContentMap.get(recordingContent)
      : "audiovideo";
    var channel = mapper.recChannelMap.get(recordingChannel)
      ? (mapper.recChannelMap.get(
          recordingChannel
        ) as RecordingChannel)
      : RecordingChannel.Mixed;
    var format = mapper.recFormatMap.get(recordingFormat)
      ? mapper.recFormatMap.get(recordingFormat)
      : "mp4";
    var options: StartRecordingOptions = {
      recordingContent: content,
      recordingChannel: channel,
      recordingFormat: format,
      callLocator: locator
    };
    var output = await client.startRecording(locator, callbackUri, options);

    recordingData.set(serverCallId, output.recordingId);
    return res.json(output);
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.pauseRecording = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }

    let recordingId: string = req.query.recordingId!.toString();

    if (!recordingId || String(recordingId).trim() == "") {
      recordingId = recordingData.get(serverCallId)!;
    }
    recordingData.set(serverCallId, recordingId);

    Logger.logMessage(
      MessageType.INFORMATION,
      "Pause recording API called with serverCallId =  " +
        serverCallId +
        " and recordingId =  " +
        recordingId
    );

    var output = await client.pauseRecording(recordingId);
    if (output) {
      return res.json("Ok");
    } else {
      return res
        .status(output.statusCode ? output.statusCode : "500")
        .json(output.message);
    }
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.resumeRecording = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    let recordingId: string = req.query.recordingId!.toString();

    if (!recordingId || String(recordingId).trim() == "") {
      recordingId = recordingData.get(serverCallId)!;
    }
    recordingData.set(serverCallId, recordingId);

    Logger.logMessage(
      MessageType.INFORMATION,
      "Resume recording API called with serverCallId =  " +
        serverCallId +
        " and recordingId =  " +
        recordingId
    );

    var output = await client.resumeRecording(recordingId);
    if (output) {
      return res.json("Ok");
    } else {
      return res
        .status(output.statusCode ? output.statusCode : "500")
        .json(output.message);
    }
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.stopRecording = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    let recordingId: string = req.query.recordingId!.toString();

    if (!recordingId || String(recordingId).trim() == "") {
      recordingId = recordingData.get(serverCallId)!;
    }
    recordingData.set(serverCallId, recordingId);

    Logger.logMessage(
      MessageType.INFORMATION,
      "Stop recording API called with serverCallId =  " +
        serverCallId +
        " and recordingId =  " +
        recordingId
    );

    var output = await client.stopRecording(recordingId);
    if (output) {
      return res.json("Ok");
    } else {
      return res
        .status(output.statusCode ? output.statusCode : "500")
        .json(output.message);
    }
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.getRecordingState = async function (req: Request, res: Response) {
  try {
    let serverCallId: string = req.query.serverCallId!.toString();
    if (!serverCallId || String(serverCallId).trim() == "") {
      return res.status(400).json("serverCallId is invalid");
    }
    let recordingId: string = req.query.recordingId!.toString();

    if (!recordingId || String(recordingId).trim() == "") {
      recordingId = recordingData.get(serverCallId)!;
    }
    recordingData.set(serverCallId, recordingId);

    Logger.logMessage(
      MessageType.INFORMATION,
      "Recording State API called with serverCallId =  " +
        serverCallId +
        " and recordingId =  " +
        recordingId
    );

    var output = await client.getRecordingProperties(recordingId);
    if (output && output.recordingState) {
      return res.json(output.recordingState);
    } else {
      return res
        .status(output.statusCode ? output.statusCode : "500")
        .json(output.message);
    }
  } catch (e) {
    var output = BlobStorageHelper.getExecptionDetails(e);
    return res.status(output.statusCode).json(String(output.output));
  }
};

exports.getRecordingFile = async function (req: Request, res: Response) {
  try {
    let data = req.body;

    Logger.logMessage(
      MessageType.INFORMATION,
      "Request data ---- >" + JSON.stringify(data)
    );
    const deserializedData =
      await new EventGridDeserializer().deserializeEventGridEvents(data[0]);
    const event = deserializedData[0];

    Logger.logMessage(
      MessageType.INFORMATION,
      "Event type is  ---->" + event.eventType
    );

    if (event.eventType == "Microsoft.EventGrid.SubscriptionValidationEvent") {
      try {
        if (event.data && event.data.validationCode) {
          let code = event.data.validationCode;
          Logger.logMessage(
            MessageType.INFORMATION,
            "validationCode = " + code
          );
          let output = { validationResponse: code };
          Logger.logMessage(
            MessageType.INFORMATION,
            "Successfully Subscribed EventGrid.ValidationEvent --> " +
              JSON.stringify(output)
          );
          return res.json(output);
        } else {
          return res.status(400).json("Not successfull");
        }
      } catch (e) {
        var output = BlobStorageHelper.getExecptionDetails(e);
        return res.status(output.statusCode).json(String(output.output));
      }
    }

    if (
      event.eventType == "Microsoft.Communication.RecordingFileStatusUpdated"
    ) {
      var acsRecordingChunkInfoProperties =
        event.data.recordingStorageInfo.recordingChunks[0];

      Logger.logMessage(
        MessageType.INFORMATION,
        "DownloadContent data -----> " +
          JSON.stringify(acsRecordingChunkInfoProperties)
      );

      const document_id = acsRecordingChunkInfoProperties["documentId"];
      const content_location =
        acsRecordingChunkInfoProperties["contentLocation"];
      const metadata_location =
        acsRecordingChunkInfoProperties["metadataLocation"];

      var processmetadataFileResponse = await process_file(
        document_id,
        metadata_location,
        FileFormat.json,
        FileDownloadType.metadata
      );

      if (processmetadataFileResponse.output.toString() == "true") {
        Logger.logMessage(
          MessageType.INFORMATION,
          `Processing ${FileDownloadType.metadata} file completed successfully.`
        );

        var processRecordingFileResponse = await process_file(
          document_id,
          content_location,
          recFileFormat,
          FileDownloadType.recording
        );
        if (processRecordingFileResponse.output.toString() == "true") {
          Logger.logMessage(
            MessageType.INFORMATION,
            `Processing ${FileDownloadType.recording} file completed successfully.`
          );
        } else {
          Logger.logMessage(
            MessageType.INFORMATION,
            `Processing ${FileDownloadType.recording} file failed with message --> ${processRecordingFileResponse.output}`
          );
          return res
            .status(parseInt(processmetadataFileResponse.statusCode))
            .json(String(processRecordingFileResponse.output));
        }

        return res
          .status(parseInt(processmetadataFileResponse.statusCode))
          .json(String(processmetadataFileResponse.output));
      } else {
        Logger.logMessage(
          MessageType.INFORMATION,
          `Processing ${FileDownloadType.metadata} file failed with message --> ${processmetadataFileResponse.output}`
        );

        return res
          .status(parseInt(processmetadataFileResponse.statusCode))
          .json(String(processmetadataFileResponse.output));
      }
    }
  } catch (e) {
    {
      var output = BlobStorageHelper.getExecptionDetails(e);
      return res.status(output.statusCode).json(String(output.output));
    }
  }
};

async function process_file(
  documentId: string,
  downloadLocation: string,
  fileFormat: FileFormat,
  downloadType: FileDownloadType
): Promise<{ output: string; statusCode: string }> {
  try {
    Logger.logMessage(
      MessageType.INFORMATION,
      "Start downloading " +
        downloadType +
        " file. Download url --> " +
        downloadLocation
    );
    var fileName = documentId + "." + fileFormat;

    var downloadResponse: BlobDownloadResponseModel = await client.download(
      downloadLocation
    );
      
    if (downloadResponse && downloadResponse.readableStreamBody) {
      var writeStream = fs.createWriteStream(fileName);
      writeStream.on("finish", () => {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Stream writing to file successful"
        );
      });
      writeStream.on("error", () => {
        Logger.logMessage(MessageType.ERROR, "Stream writing to file failed");
      });

      downloadResponse.readableStreamBody.pipe(writeStream);

      if (downloadType == FileDownloadType.metadata) {
        fs.readFile(fileName, "utf8", (err, jsonString) => {
          if (err) {
            console.log("Metadata file read failed:", err);
            return;
          }
          
          let obj: Root.RootObject = JSON.parse(jsonString);
          recFileFormat = (obj.recordingInfo.format as FileFormat)
            ? (obj.recordingInfo.format as FileFormat)
            : FileFormat.mp4;
        });
      }

      var blobUploadResult = await BlobStorageHelper.uploadFileToStorage(
        cfg.ContainerName,
        fileName,
        cfg.BlobStorageConnectionString
      );

      fs.unlink(fileName, (error) => {
        if (error) {
          Logger.logMessage(
            MessageType.ERROR,
            "Temporary recording file deletion failed"
          );
        }
      });

      if (blobUploadResult.output == true) {
        BlobStorageHelper.getBlobSasUri(
          cfg.ContainerName,
          fileName,
          cfg.StorageAccountName,
          cfg.StorageAccountKey
        );
      }
      return blobUploadResult;
    } else {
      return { output: "Error", statusCode: "500" };
    }
  } catch (e) {
    return BlobStorageHelper.getExecptionDetails(e);
  }
}
