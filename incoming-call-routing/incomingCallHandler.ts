import { AnswerCallOptions, } from "@azure/communication-calling-server";
import { getCallingServerClient } from "./clients/callingServerClient";
import { getCallbackUrl } from "./utils/callbackUrl";
import { registerDtmfToneEvent } from "./eventHandlers/dtmfEventHandler";
import { playAudio, registerPlayAudioCompletionEvent, registerPlayAudioRunningEvent, startPlayAudioEvent } from "./eventHandlers/playAudioHandler";
import { KnownCallingOperationStatus } from "@azure/communication-calling-server/src/generated/src/models";
import { establishConnection, registerCallConnectionDisconnectedEvent } from "./eventHandlers/callConnectionHandler";

async function report(incomingCallContext: string) {
    try {
        const callingServerClient = getCallingServerClient();
        const answerCallOptions: AnswerCallOptions = {
            callbackUrl: getCallbackUrl(),
            requestedMediaTypes: ["audio"],
            requestedCallEvents: ["participantsUpdated", "toneReceived"]
        };

        const { callConnectionId } = await callingServerClient.answerCall(incomingCallContext, answerCallOptions);

        if (callConnectionId === undefined) {
            throw new Error("Call was not established");
        }

        const callEstablished = await establishConnection(callConnectionId);

        if (!callEstablished) {
            throw new Error("Call was not established");
        }

        const res = await playAudio(callConnectionId);

        if (res?.status === KnownCallingOperationStatus.Running) {
            registerEventHandlers(callConnectionId);
            startPlayAudioEvent(callConnectionId);
        } else {
            console.log(`Unable to play audio: ${res?.resultDetails?.message}`);

            await callingServerClient.getCallConnection(callConnectionId).hangUp();
        }
    } catch (e) {
        console.log(e);
    }
}

function registerEventHandlers(callConnectionId: string) {
    registerPlayAudioRunningEvent(callConnectionId);
    registerPlayAudioCompletionEvent(callConnectionId);
    registerDtmfToneEvent(callConnectionId);
    registerCallConnectionDisconnectedEvent(callConnectionId);
}

export { report };
