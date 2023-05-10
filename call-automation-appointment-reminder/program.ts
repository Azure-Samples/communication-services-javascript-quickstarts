import {
    CommunicationUserIdentifier,
    PhoneNumberIdentifier,
} from "@azure/communication-common";
import { MessageType, Logger } from "./Logger";
import {
    CallAutomationClient,
    CreateCallOptions,
    CreateCallResult,
    CallAutomationEventParser,
    CallAutomationEvent,
    CallMediaRecognizeDtmfOptions,
    DtmfTone,
    RecognizeInputType,
    RecognizeCompleted,
    FileSource,
    CallInvite,
} from "@azure/communication-call-automation";
import { CloudEvent } from "@azure/eventgrid";
import { Request, Response } from "express";

var configuration = require("./config");
var express = require("express");
var router = express.Router();
var fileSystem = require("fs");
var path = require("path");

var url = "http://localhost:8080";
var callConnection: CreateCallResult;
var callInviteOptions: CallInvite;
var callAutomationEventParser = new CallAutomationEventParser();
var userIdentityRegex = new RegExp(
    "8:acs:[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}_[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}"
);
var phoneIdentityRegex = new RegExp("^\\+\\d{10,14}$");
enum CommunicationIdentifierKind {
    UserIdentity,
    PhoneIdentity,
    UnknownIdentity,
}

var targets: { [callConnection: string]: CommunicationUserIdentifier | PhoneNumberIdentifier; } = {};
var callAutomationClient: CallAutomationClient = new CallAutomationClient(configuration.ConnectionString);
var identifierKind;
var targetParticipant: CommunicationUserIdentifier | PhoneNumberIdentifier;
var appCallbackUrl = configuration.AppBaseUri + configuration.EventCallBackRoute;

async function runSample() {
    try {
        var sourcePhoneNumber: PhoneNumberIdentifier = {
            phoneNumber: configuration.SourcePhoneNumber,
        };
        var targetIds = configuration.TargetIdentifier;
        var targetIdentities = targetIds.split(";");
        targetIdentities.forEach(async (targetId: any) => {
            identifierKind = getIdentifierKind(targetId);

            if (identifierKind == CommunicationIdentifierKind.PhoneIdentity) {
                targetParticipant = { phoneNumber: targetId };
                callInviteOptions = new CallInvite(targetParticipant, sourcePhoneNumber);
            } else if (identifierKind == CommunicationIdentifierKind.UserIdentity) {
                targetParticipant = { communicationUserId: targetId };
                callInviteOptions = new CallInvite(targetParticipant);
            }

            var createCallOptions: CreateCallOptions = {
                sourceCallIdNumber: sourcePhoneNumber,
                sourceDisplayName: "Reminder App",
            };

            Logger.logMessage(MessageType.INFORMATION, "Performing CreateCall operation");

            callConnection = await callAutomationClient.createCall(
                callInviteOptions,
                appCallbackUrl,
                createCallOptions
            );
            targets[callConnection.callConnectionProperties.callConnectionId] = targetParticipant;
            Logger.logMessage(MessageType.INFORMATION, "Reponse from create call: " +
                callConnection.callConnectionProperties.callConnectionState +
                "CallConnection Id : " + callConnection.callConnectionProperties.callConnectionId);
        });

    } catch (ex) {
        Logger.logMessage(MessageType.ERROR, "Failed to initiate the reminder call Exception -- > " + ex.getMessage());
    }
}

//api to handle call back events
async function callbacks(cloudEvents: CloudEvent<CallAutomationEvent>[]) {
    cloudEvents.forEach(async (cloudEvent) => {
        Logger.logMessage(MessageType.INFORMATION, "Event received: " + JSON.stringify(cloudEvent));

        var eventType = await callAutomationEventParser.parse(JSON.stringify(cloudEvent));
        var playSource: FileSource = { uri: "" };
        if (eventType?.callConnectionId) {
            var callConnection = callAutomationClient.getCallConnection(eventType.callConnectionId);
            var callConnectionMedia = callConnection.getCallMedia();
            if (eventType.kind == "CallConnected") {
                //Initiate recognition as call connected event is received
                Logger.logMessage(MessageType.INFORMATION, "CallConnected event received for call connection id: " + eventType.callConnectionId);
                playSource.uri = configuration.AppBaseUri + configuration.AppointmentReminderMenuAudio;
                playSource.playSourceId = "AppointmentReminderMenu";
                var recognizeOptions: CallMediaRecognizeDtmfOptions = {
                    interruptPrompt: true,
                    interToneTimeoutInSeconds: 10,
                    maxTonesToCollect: 1,
                    recognizeInputType: RecognizeInputType.Dtmf,
                    targetParticipant: targets[eventType?.callConnectionId],
                    operationContext: "AppointmentReminderMenu",
                    playPrompt: playSource,
                    initialSilenceTimeoutInSeconds: 5,
                };

                //Start recognition
                await callConnectionMedia.startRecognizing(recognizeOptions);
            }
            if (eventType.kind == "RecognizeCompleted") {
                // Play audio once recognition is completed sucessfully
                Logger.logMessage(MessageType.INFORMATION, "RecognizeCompleted event received for call connection id: " + eventType.callConnectionId);
                var recognizeCompletedEvent: RecognizeCompleted = eventType;
                var toneDetected = (recognizeCompletedEvent?.collectTonesResult?.tones ? recognizeCompletedEvent?.collectTonesResult?.tones[0] : undefined) as DtmfTone;
                var playSourceForTone = getAudioForTone(toneDetected);

                // Play audio for dtmf response
                await callConnectionMedia.playToAll(playSourceForTone, {
                    operationContext: "ResponseToDtmf",
                    loop: false,
                });
            }
            if (eventType.kind == "RecognizeFailed") {
                Logger.logMessage(MessageType.INFORMATION, "RecognizeFailed event received for call connection id: " + eventType.callConnectionId);
                var recognizeFailedEvent = eventType;
                // Check for time out, and then play audio message
                if (recognizeFailedEvent?.resultInformation?.subCode == 8511) {
                    Logger.logMessage(MessageType.INFORMATION, "Recognition timed out for call connection id: " + eventType.callConnectionId);
                    playSource.uri = configuration.AppBaseUri + configuration.TimedoutAudio;

                    //Play audio for time out
                    await callConnectionMedia.playToAll(playSource, {
                        operationContext: "ResponseToDtmf",
                        loop: false,
                    });
                }
            }
            if (eventType.kind == "PlayCompleted") {
                Logger.logMessage(MessageType.INFORMATION, "PlayCompleted event received for call connection id: " + eventType.callConnectionId);
                await callConnection.hangUp(true);
            }
            if (eventType.kind == "PlayFailed") {
                Logger.logMessage(MessageType.INFORMATION, "PlayFailed event received for call connection id: " + eventType.callConnectionId);
                await callConnection.hangUp(true);
            }
        } else {
            return;
        }
    });
}

function getAudioForTone(toneDetected: DtmfTone) {
    var playSource: FileSource = { uri: "" };
    if (toneDetected == DtmfTone.One) {
        playSource.uri = configuration.AppBaseUri + configuration.AppointmentConfirmedAudio;
    }
    else if (toneDetected == DtmfTone.Two) {
        playSource.uri = configuration.AppBaseUri + configuration.AppointmentCancelledAudio;
    } // Invalid Dtmf tone
    else {
        playSource.uri = configuration.AppBaseUri + configuration.InvalidInputAudio;
    }

    return playSource;
}

function getIdentifierKind(participantnumber: string) {
    // checks the identity type returns as string
    return userIdentityRegex.test(participantnumber) ?
        CommunicationIdentifierKind.UserIdentity : phoneIdentityRegex.test(participantnumber) ?
            CommunicationIdentifierKind.PhoneIdentity : CommunicationIdentifierKind.UnknownIdentity;
}

var program = function () {
    // Api to initiate out bound call
    router.route("/api/call").post(async function (req: Request, res: Response) {
        Logger.logMessage(MessageType.INFORMATION, "Starting ACS Sample App");
        const ngrokUrl = configuration.AppBaseUri;
        try {
            if (ngrokUrl) {
                Logger.logMessage(MessageType.INFORMATION, "Server started at:" + url);
                new Promise((resolve) => runSample());
            } else {
                Logger.logMessage(MessageType.ERROR, "Failed to start Ngrok service");
            }
        } catch (ex) {
            Logger.logMessage(MessageType.ERROR, "Failed to start Ngrok service : " + ex.message);
        }
        Logger.logMessage(MessageType.INFORMATION, "Press 'Ctrl + C' to exit the sample"
        );
        res.status(200).send("OK");
    });

    router.route("/api/callbacks").post(function (req: Request, res: Response) {
        console.log("req.body \n" + req.body);
        callbacks(req.body);
        res.status(200).send("OK");
    });

    router.route("/audio").get(function (req: Request, res: Response) {
        var fileName = "/audio/" + req.query.filename;
        var filePath = path.join(__dirname, fileName);
        var stat = fileSystem.statSync(filePath);

        res.writeHead(200, {
            "Content-Type": "audio/x-wav",
            "Content-Length": stat.size,
        });
        var readStream = fileSystem.createReadStream(filePath);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
    });

    return router;
};
module.exports = program;
