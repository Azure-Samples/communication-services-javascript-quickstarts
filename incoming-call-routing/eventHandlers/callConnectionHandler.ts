import { CallingServerEventTypeValue } from "@azure/communication-calling-server";
import { CallConnectionStateChangedEvent, KnownCallConnectionState } from "@azure/communication-calling-server/src/generated/src/models";
import { getCallingServerClient } from "../clients/callingServerClient";
import { IncomingCallEvent } from "../incomingCallEvent";
import { subscribe } from "./notificationHandler";

function registerCallConnectionDisconnectedEvent(callConnectionId: string) {
    subscribe(callConnectionId, CallingServerEventTypeValue.CallConnectionStateChangedEvent, async (eventData: IncomingCallEvent) => {
        const callConnectionEvent = eventData as CallConnectionStateChangedEvent;

        if (callConnectionEvent.callConnectionState === KnownCallConnectionState.Disconnected) {
            const callConnection = getCallingServerClient().getCallConnection(callConnectionId);

            await callConnection.hangUp();
        } else {
            registerCallConnectionDisconnectedEvent(callConnectionId);
        }
    });
}

export { registerCallConnectionDisconnectedEvent }
