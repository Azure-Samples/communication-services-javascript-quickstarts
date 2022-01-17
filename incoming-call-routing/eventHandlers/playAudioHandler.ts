import config from "../appsettings.json";
import { PlayAudioOptions } from "@azure/communication-calling-server";
import { CloudEvent } from "@azure/eventgrid";
import { getCallingServerClient } from "../clients/callingServerClient";
import { getCallbackUrl } from "../utils/callbackUrl";
import { processNotification, subscribe } from "./notificationHandler";
import { IncomingCallEvent, InternalEventTypeValue } from "../incomingCallEvent";

async function playAudio(callConnectionId: string) {
    try {
        const callConnection = getCallingServerClient().getCallConnection(callConnectionId);
        const audioUri = config.audioFileUri;
        const playAudioOptions: PlayAudioOptions = {
            loop: true,
            operationContext: "Guid",
            callbackUrl: getCallbackUrl(),
            audioFileId: ""
        };

        return callConnection.playAudio(audioUri, playAudioOptions);
    } catch (e) {
        console.log(e);
    }
}

function registerPlayAudioCompletionEvent(callConnectionId: string) {
    subscribe(callConnectionId, InternalEventTypeValue.InternalPlayAudioCompletedEvent, async () => {
        const callConnection = getCallingServerClient().getCallConnection(callConnectionId);

        await callConnection.cancelAllMediaOperations();
    });
}

function registerPlayAudioRunningEvent(callConnectionId: string) {
    subscribe(callConnectionId, InternalEventTypeValue.InternalPlayAudioRunningEvent, async () => {
        setTimeout(
            async () => {
                if (await completePlayAudioEvent(callConnectionId)) {
                    const callConnection = getCallingServerClient().getCallConnection(callConnectionId);

                    await callConnection.hangUp();
                }
            },
            30000);
    });
}

function completePlayAudioEvent(callConnectionId: string) {
    const playAudioCompleteEvent = {
        type: InternalEventTypeValue.InternalPlayAudioCompletedEvent,
        data: { callConnectionId }
    };

    return processNotification(playAudioCompleteEvent as CloudEvent<IncomingCallEvent>);
}

function startPlayAudioEvent(callConnectionId: string) {
    const playAudioRunningEvent = {
        type: InternalEventTypeValue.InternalPlayAudioRunningEvent,
        data: { callConnectionId }
    };

    return processNotification(playAudioRunningEvent as CloudEvent<IncomingCallEvent>);
}

export {
    playAudio,
    registerPlayAudioCompletionEvent,
    registerPlayAudioRunningEvent,
    startPlayAudioEvent,
    completePlayAudioEvent,
};
