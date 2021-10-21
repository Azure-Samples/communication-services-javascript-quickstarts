import { MessageType, Logger } from "./Logger";
import { CallConfiguration } from "./CallConfiguration";
import { NotificationCallback } from "./EventHandler/NotificationCallback";
import { EventDispatcher } from "./EventHandler/EventDispatcher";
import {
  CallingServerClient,
  CallConnection,
  CallMediaType,
  CallingEventSubscriptionType,
  ToneReceivedEvent,
  ToneInfo,
  PlayAudioResult,
  KnownCallingServerEventType,
  PlayAudioResultEvent,
  AddParticipantResultEvent,
  KnownToneValue,
  CallConnectionStateChangedEvent,
  KnownCallConnectionState,
  CreateCallConnectionOptions,
  PlayAudioOptions,
  AddParticipantOptions,
  CallConnectionsAddParticipantResponse,
  CancelAllMediaOperationsOptions,
} from "@azure/communication-callingserver";
import {
  CommunicationIdentifier,
  CommunicationUserIdentifier,
  PhoneNumberIdentifier,
} from "@azure/communication-common";
import { CommunicationIdentifierKind } from "./CommunicationIdentifierKind";
import { v4 as uuidv4 } from "uuid";
var configuration = require("./config");

export class OutboundCallReminder {
  callConfiguration: CallConfiguration = null;
  callingServerClient: CallingServerClient = null;
  callConnection: CallConnection = null;
  userIdentityRegex = new RegExp(
    "8:acs:[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}_[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}"
  );
  phoneIdentityRegex = new RegExp("^\\+\\d{10,14}$");
  maxRetryAttemptCount = 0;
  targetPhoneNumber = null;
  participant = null;
  retryAttemptCount = 1;
  toneReceivedEventComplete = false;
  playAudioTaskCompleted = false;
  playAudioTaskExecuted = false;

  constructor(callConfiguration: CallConfiguration) {
    this.callConfiguration = callConfiguration;
    this.callingServerClient = new CallingServerClient(
      this.callConfiguration.connectionString
    );
    this.maxRetryAttemptCount = configuration.MaxRetryCount;
  }

  public async report(targetPhoneNumber: string, participant: string) {
    try {
      this.targetPhoneNumber = targetPhoneNumber;
      this.participant = participant;
      await this.createCallAsync(targetPhoneNumber);
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Call ended unexpectedly, reason -- > " + ex.message
      );
    }
  }

  private async createCallAsync(targetPhoneNumber: string) {
    try {
      // Preparing request data
      var source: CommunicationUserIdentifier = {
        communicationUserId: this.callConfiguration.sourceIdentity,
      };
      var targets: PhoneNumberIdentifier[] = [
        { phoneNumber: targetPhoneNumber },
      ];
      var alternateCallerId: PhoneNumberIdentifier = {
        phoneNumber: this.callConfiguration.sourcePhoneNumber,
      };
      var callModality: CallMediaType[] = ["audio"];
      var eventSubscriptionType: CallingEventSubscriptionType[] = [
        "participantsUpdated",
        "toneReceived",
      ];

      var createCallOption: CreateCallConnectionOptions = {
        alternateCallerId: alternateCallerId,
        callbackUri: this.callConfiguration.appCallbackUrl,
        requestedMediaTypes: callModality,
        requestedCallEvents: eventSubscriptionType,
      };

      Logger.logMessage(
        MessageType.INFORMATION,
        "Performing CreateCall operation"
      );
      this.callConnection = await this.callingServerClient.createCallConnection(
        source,
        targets,
        createCallOption
      );

      Logger.logMessage(
        MessageType.INFORMATION,
        "createCallConnectionWithResponse -- >  Call connection ID: " +
          this.callConnection.getCallConnectionId()
      );
      Logger.logMessage(
        MessageType.INFORMATION,
        "Call initiated with Call Leg id -- > " +
          this.callConnection.getCallConnectionId()
      );

      await this.registerToCallStateChangeEvent(
        this.callConnection.getCallConnectionId()
      );
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failure occured while creating/establishing the call. Exception -- >" +
          ex.message
      );
    }
  }

  private async registerToCallStateChangeEvent(callLegId: string) {
    // Set the callback method
    var callStateChangeNotificaiton: NotificationCallback = {
      callback: async (callEvent) => {
        try {
          var callStateChanged: CallConnectionStateChangedEvent = callEvent;
          Logger.logMessage(
            MessageType.INFORMATION,
            "Call State changed to -- > " + callStateChanged.callConnectionState
          );

          if (
            callStateChanged.callConnectionState ==
            KnownCallConnectionState.Connected
          ) {
            Logger.logMessage(
              MessageType.INFORMATION,
              "Call State successfully connected"
            );

            if (!this.playAudioTaskExecuted) {
              // Play audio after call got connected
              this.playAudioTaskExecuted = true;
              await this.registerToDtmfResultEvent(callLegId);
              await this.playAudioAsync();
            }
          } else if (
            callStateChanged.callConnectionState ==
            KnownCallConnectionState.Disconnected
          ) {
            await EventDispatcher.getInstance().unsubscribe(
              KnownCallingServerEventType.CALL_CONNECTION_STATE_CHANGED_EVENT,
              callLegId
            );
          }
        } catch (ex) {
          Logger.logMessage(
            MessageType.INFORMATION,
            "Call State successfully connected"
          );
        }
      },
    };
    // Subscribe to the event
    await EventDispatcher.getInstance().subscribe(
      KnownCallingServerEventType.CALL_CONNECTION_STATE_CHANGED_EVENT,
      callLegId,
      callStateChangeNotificaiton
    );
  }

  private async registerToDtmfResultEvent(callLegId: string) {
    var dtmfReceivedEvent: NotificationCallback = {
      callback: async (callEvent) => {
        try {
          var toneReceivedEvent: ToneReceivedEvent = callEvent;
          var toneInfo: ToneInfo = toneReceivedEvent.toneInfo;
          Logger.logMessage(
            MessageType.INFORMATION,
            "Tone received -- > : " + toneInfo.tone
          );

          // cancel playing audio
          this.toneReceivedEventComplete = true;
          await this.cancelMediaProcessing();

          if (toneInfo.tone == KnownToneValue.Tone1) {
            await this.addParticipant(this.participant);
          } else {
            await this.hangupAsync();
          }
          await EventDispatcher.getInstance().unsubscribe(
            KnownCallingServerEventType.TONE_RECEIVED_EVENT,
            callLegId
          );
        } catch (ex) {
          Logger.logMessage(
            MessageType.ERROR,
            "Failed to add participant or cancel media operation - Exception: " +
              ex.message
          );
        }
      },
    };
    // Subscribe to event
    await EventDispatcher.getInstance().subscribe(
      KnownCallingServerEventType.TONE_RECEIVED_EVENT,
      callLegId,
      dtmfReceivedEvent
    );
  }

  private async cancelMediaProcessing() {
    try {
      if (this.playAudioTaskCompleted) {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Performing cancel media processing operation to stop playing audio"
        );
        var cancelMediaOptions: CancelAllMediaOperationsOptions = {};
        await this.callConnection.cancelAllMediaOperations(cancelMediaOptions);
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to perform cancel media processing operation Exception: " +
          ex.message
      );
    }
  }

  private async playAudioAsync() {
    try {
      // Preparing data for request
      var audioFileUri: string = this.callConfiguration.audioFileUrl;

      Logger.logMessage(
        MessageType.INFORMATION,
        "Performing PlayAudio operation"
      );
      var playAudioOptions: PlayAudioOptions = {
        loop: true,
        operationContext: uuidv4(),
        audioFileId: uuidv4(),
        callbackUri: this.callConfiguration.appCallbackUrl,
      };
      var response: PlayAudioResult = await this.callConnection.playAudio(
        audioFileUri,
        playAudioOptions
      );

      Logger.logMessage(
        MessageType.INFORMATION,
        "playAudioWithResponse -- > " +
          response.status +
          ", Id: " +
          response.operationId +
          ", OperationContext: " +
          response.operationContext +
          ", OperationStatus: " +
          response.status
      );

      if (response.status.toLowerCase() === "running") {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Play Audio state -- > " + response.status
        );
        this.playAudioTaskCompleted = true;

        // listen to play audio events
        this.registerToPlayAudioResultEvent(response.operationContext);

        await new Promise((resolve) => setTimeout(resolve, 30000));
        if (this.toneReceivedEventComplete == false) {
          Logger.logMessage(
            MessageType.INFORMATION,
            "No response from user in 30 sec, initiating hangup"
          );
          await this.hangupAsync();
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Play audio operation cancelled"
      );
      Logger.logMessage(
        MessageType.INFORMATION,
        "Failure occured while playing audio on the call. Exception: " +
          ex.message
      );
      await this.hangupAsync();
    }
  }

  async hangupAsync() {
    try {
      Logger.logMessage(MessageType.INFORMATION, "Performing Hangup operation");
      await this.callConnection.hangUp();
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to Hangup the call. Exception: " + ex.message
      );
    }
  }

  async registerToPlayAudioResultEvent(operationContext: string) {
    var playPromptResponseNotification: NotificationCallback = {
      callback: async (callEvent) => {
        try {
          var playAudioResultEvent: PlayAudioResultEvent = callEvent;

          Logger.logMessage(
            MessageType.INFORMATION,
            "Play audio status -- > " + playAudioResultEvent.status
          );

          if (playAudioResultEvent.status.toLowerCase() === "completed") {
            await EventDispatcher.getInstance().unsubscribe(
              KnownCallingServerEventType.PLAY_AUDIO_RESULT_EVENT,
              operationContext
            );
          }
        } catch (ex) {
          Logger.logMessage(
            MessageType.ERROR,
            "Failed to play audio -- > " + ex.message
          );
        }
      },
    };
    // Subscribe to event
    await EventDispatcher.getInstance().subscribe(
      KnownCallingServerEventType.PLAY_AUDIO_RESULT_EVENT,
      operationContext,
      playPromptResponseNotification
    );
  }

  async addParticipant(addedParticipant: string): Promise<Boolean> {
    try {
      var identifierKind = this.getIdentifierKind(addedParticipant);

      if (identifierKind == CommunicationIdentifierKind.UnknownIdentity) {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Unknown identity provided. Enter valid phone number or communication user id"
        );
        return true;
      } else {
        var participant: CommunicationIdentifier = null;
        var operationContext: string = uuidv4();
        var addParticipantOptions: AddParticipantOptions = {};
        await this.registerToAddParticipantsResultEvent(operationContext);

        if (identifierKind == CommunicationIdentifierKind.UserIdentity) {
          var communicationUser: CommunicationUserIdentifier = {
            communicationUserId: addedParticipant,
          };
          participant = communicationUser;
        } else if (
          identifierKind == CommunicationIdentifierKind.PhoneIdentity
        ) {
          var phoneNumber: PhoneNumberIdentifier = {
            phoneNumber: addedParticipant,
            rawId: null,
          };
          participant = phoneNumber;
        }

        Logger.logMessage(
          MessageType.INFORMATION,
          "Initiating add participant from number --> " +
            this.targetPhoneNumber +
            " and participant identifier is -- > " +
            addedParticipant
        );
        var response: CallConnectionsAddParticipantResponse =
          await this.callConnection.addParticipant(
            participant,
            configuration.SourcePhone,
            operationContext,
            addParticipantOptions
          );
        if (response && response.participantId) {
          Logger.logMessage(
            MessageType.INFORMATION,
            "addParticipantWithResponse -- > addParticipant completed with participant id" +
              +response.participantId
          );
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to add participant ExecutionException -- > " + ex.message
      );
    }
  }

  async registerToAddParticipantsResultEvent(operationContext: string) {
    var addParticipantReceivedEvent: NotificationCallback = {
      callback: async (callEvent) => {
        try {
          var addParticipantsUpdatedEvent: AddParticipantResultEvent =
            callEvent;
          var operationStatus = addParticipantsUpdatedEvent.status;

          if (operationStatus.toLowerCase() === "completed") {
            Logger.logMessage(
              MessageType.INFORMATION,
              "Add participant status -- > " + operationStatus
            );
            await this.hangupAsync();
          } else if (operationStatus.toLowerCase() === "failed") {
            Logger.logMessage(
              MessageType.INFORMATION,
              " add participant failed"
            );

            if (this.retryAttemptCount <= this.maxRetryAttemptCount) {
              Logger.logMessage(
                MessageType.INFORMATION,
                "Retrying add participant attempt -- > " +
                  this.retryAttemptCount +
                  " is in progress"
              );
              await this.addParticipant(this.participant);
              this.retryAttemptCount++;
            } else {
              await this.hangupAsync();
            }
          }
          await EventDispatcher.getInstance().unsubscribe(
            KnownCallingServerEventType.ADD_PARTICIPANT_RESULT_EVENT,
            operationContext
          );
        } catch (ex) {
          Logger.logMessage(
            MessageType.ERROR,
            "Add participant Failed -- > " + ex.message
          );
        }
      },
    };
    // Subscribe to event
    await EventDispatcher.getInstance().subscribe(
      KnownCallingServerEventType.ADD_PARTICIPANT_RESULT_EVENT,
      operationContext,
      addParticipantReceivedEvent
    );
  }

  private getIdentifierKind(participantnumber: string) {
    // checks the identity type returns as string
    return this.userIdentityRegex.test(participantnumber)
      ? CommunicationIdentifierKind.UserIdentity
      : this.phoneIdentityRegex.test(participantnumber)
      ? CommunicationIdentifierKind.PhoneIdentity
      : CommunicationIdentifierKind.UnknownIdentity;
  }
}
