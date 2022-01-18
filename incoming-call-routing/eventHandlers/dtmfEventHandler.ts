import { CallingServerEventTypeValue } from "@azure/communication-calling-server";
import { KnownToneValue, ToneReceivedEvent } from "@azure/communication-calling-server/src/generated/src/models";
import { IncomingCallEvent, InternalEventTypeValue } from "../incomingCallEvent";
import { buildEventKey, subscribe, unsubscribe } from "./notificationHandler";
import { completePlayAudioEvent } from "./playAudioHandler";
import { transferCall } from "./transferParticipantHandler";

function registerDtmfToneEvent(callConnectionId: string) {
    subscribe(callConnectionId, CallingServerEventTypeValue.ToneReceivedEvent, async (eventData: IncomingCallEvent) => {
        const toneReceivedEvent = eventData as ToneReceivedEvent;

        if (toneReceivedEvent?.toneInfo?.tone === KnownToneValue.Tone1) {
            await completePlayAudioEvent(callConnectionId);

            unsubscribe(buildEventKey(callConnectionId, InternalEventTypeValue.InternalPlayAudioRunningEvent));
            
            await transferCall(callConnectionId);
        }
    });
}

export { registerDtmfToneEvent }
