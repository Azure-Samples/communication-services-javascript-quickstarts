import {
  KnownCallingServerEventType,
  CallConnectionStateChangedEvent,
  ToneReceivedEvent,
  PlayAudioResultEvent,
  AddParticipantResultEvent,
} from "@azure/communication-callingserver";
import { Logger, MessageType } from "../Logger";
import { NotificationCallback } from "./NotificationCallback";

export class EventDispatcher {
  private static instance: EventDispatcher = null;
  private notificationCallbacks: Map<string, NotificationCallback> = null;

  constructor() {
    this.notificationCallbacks = new Map();
  }

  /// <summary>
  /// Get instace of EventDispatcher
  /// </summary>
  public static getInstance(): EventDispatcher {
    if (this.instance == null) {
      this.instance = new EventDispatcher();
    }
    return this.instance;
  }

  public async subscribe(
    eventType: string,
    eventKey: string,
    notificationCallback: NotificationCallback
  ): Promise<Boolean> {
    var eventId: string = await this.buildEventKey(eventType, eventKey);
    return (
      this.notificationCallbacks.set(eventId, notificationCallback) == null
    );
  }

  public async unsubscribe(eventType: string, eventKey: string) {
    var eventId: string = await this.buildEventKey(eventType, eventKey);
    this.notificationCallbacks.delete(eventId);
  }

  public async buildEventKey(
    eventType: string,
    eventKey: string
  ): Promise<string> {
    return eventType + "-" + eventKey;
  }

  public async processNotification(request: string) {
    try {
      let [callEvent, eventKey] = await this.extractEvent(request);

      if (callEvent != null) {
        var notificationCallback: NotificationCallback =
          this.notificationCallbacks.get(eventKey.toString());
        if (notificationCallback != null) {
          notificationCallback.callback(callEvent);
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Failed to process notification Exception: " + ex.message
      );
    }
  }

  public async extractEvent(content: string) {
    try {
      if (content) {
        var cloudEvent = JSON.parse(content)[0];
        var eventData = cloudEvent.data;

        if (
          cloudEvent.type ==
          KnownCallingServerEventType.CALL_CONNECTION_STATE_CHANGED_EVENT
        ) {
          const eventObj: CallConnectionStateChangedEvent = eventData;
          const eventKey: string = await this.buildEventKey(
            KnownCallingServerEventType.CALL_CONNECTION_STATE_CHANGED_EVENT,
            eventObj.callConnectionId
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type == KnownCallingServerEventType.TONE_RECEIVED_EVENT
        ) {
          const eventObj: ToneReceivedEvent = eventData;
          const eventKey: string = await this.buildEventKey(
            KnownCallingServerEventType.TONE_RECEIVED_EVENT,
            eventObj.callConnectionId
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type == KnownCallingServerEventType.PLAY_AUDIO_RESULT_EVENT
        ) {
          const eventObj: PlayAudioResultEvent = eventData;
          const eventKey: string = await this.buildEventKey(
            KnownCallingServerEventType.PLAY_AUDIO_RESULT_EVENT,
            eventObj.operationContext
          );
          return [eventObj, eventKey];
        } else if (
          cloudEvent.type ==
          KnownCallingServerEventType.ADD_PARTICIPANT_RESULT_EVENT
        ) {
          const eventObj: AddParticipantResultEvent = eventData;
          const eventKey: string = await this.buildEventKey(
            KnownCallingServerEventType.ADD_PARTICIPANT_RESULT_EVENT,
            eventObj.operationContext
          );
          return [eventObj, eventKey];
        }
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.INFORMATION,
        "Failed to parse request content Exception: " + ex.message
      );
    }
    return [null, null];
  }
}
