import { CloudEvent } from "@azure/eventgrid";
import {
    PlayAudioResultEvent,
    AddParticipantResultEvent,
} from "@azure/communication-calling-server";
import { IncomingCallEvent } from "../incomingCallEvent";

interface NotificationEvent {
    eventKey: string;
    eventData: IncomingCallEvent;
};

const notificationCallbacks: Map<string, (eventData: IncomingCallEvent) => void> = new Map();

async function processNotification(event: CloudEvent<IncomingCallEvent>) {
    const { eventData, eventKey } = extractEvent(event);
    const notificationCallback = notificationCallbacks.get(eventKey);

    if (notificationCallback !== undefined) {
        await notificationCallback(eventData);
        
        return true;
    }

    return false;
}

function subscribe(
    eventContext: string,
    eventType: string,
    notificationCallback: (event: IncomingCallEvent) => Promise<void>) {
    notificationCallbacks.set(buildEventKey(eventContext, eventType), notificationCallback);
}

function unsubscribe(eventKey: string) {
    notificationCallbacks.delete(eventKey);
}

function buildEventKey(eventContext: string, eventType: string) {
    return `${eventContext}-${eventType}`;
}

function extractEvent(event: CloudEvent<IncomingCallEvent>): NotificationEvent {
    const { type: eventType, data: eventData } = event;
    const eventKeyPrefix = (hasOperationContext(eventData) ? eventData.operationContext : eventData?.callConnectionId) || "";

    return {
        eventKey: buildEventKey(eventKeyPrefix, eventType),
        eventData
    };
}

function hasOperationContext(eventData: IncomingCallEvent): eventData is AddParticipantResultEvent | PlayAudioResultEvent {
    return (eventData as AddParticipantResultEvent || eventData as PlayAudioResultEvent)?.operationContext !== undefined;
}

export {
    subscribe,
    unsubscribe,
    processNotification,
    buildEventKey,
};
