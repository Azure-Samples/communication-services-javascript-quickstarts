import { CallingServerEventTypeValue } from "@azure/communication-calling-server";
import { CallConnectionStateChangedEvent, KnownCallConnectionState } from "@azure/communication-calling-server/src/generated/src/models";
import { IncomingCallEvent } from "../incomingCallEvent";
import { subscribe, unsubscribeAll } from "./notificationHandler";

function registerCallConnectionDisconnectedEvent(callConnectionId: string) {
    subscribe(callConnectionId, CallingServerEventTypeValue.CallConnectionStateChangedEvent, async (eventData: IncomingCallEvent) => {
        const { callConnectionState } = eventData as CallConnectionStateChangedEvent;

        if (callConnectionState === KnownCallConnectionState.Disconnected) {
            unsubscribeAll(callConnectionId);
        }
    });
}

function registerCallConnectionConnectedEvent(callConnecionId: string, notifyConnectionState: (value :boolean) => void) {
    subscribe(callConnecionId, CallingServerEventTypeValue.CallConnectionStateChangedEvent, async (eventData: IncomingCallEvent) => {
        const { callConnectionState } = eventData as CallConnectionStateChangedEvent;

        if (callConnectionState === KnownCallConnectionState.Connected) {
            notifyConnectionState(true);
        }
    });
}

function establishConnection(callConnecionId: string) {
    return new Promise<boolean>(resolver => registerCallConnectionConnectedEvent(callConnecionId, resolver));
}

export { 
    registerCallConnectionDisconnectedEvent,
    registerCallConnectionConnectedEvent,
    establishConnection
 }
