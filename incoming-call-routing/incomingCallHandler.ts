import config from "./appsettings.json";
import { AnswerCallOptions, PlayAudioOptions } from "@azure/communication-calling-server";
import { getCallingServerClient } from "./clients/callingServerClient";
import { getCallbackUrl } from "./utils/callbackUrl";

async function report(incomingCallContext: string) {
    try {
        const callingServerClient = getCallingServerClient();
        const answerCallOptions: AnswerCallOptions = {
            callbackUrl: getCallbackUrl(),
            requestedMediaTypes: ["audio"],
            requestedCallEvents: ["participantsUpdated", "toneReceived"]
        };

        const response = await callingServerClient.answerCall(incomingCallContext, answerCallOptions);

        if (response.callConnectionId === undefined) {
            throw new Error("Call was not established");
        }

        registerEventHandlers(response.callConnectionId as string);

        await playAudio(response.callConnectionId);


    } catch (e) {

    }
}

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

        const response = await callConnection.playAudio(audioUri, playAudioOptions);

        await callConnection.cancelAllMediaOperations();

        console.log(response);
    } catch (e) {
        console.log(e);
    }

}

function registerEventHandlers(callConnectionId: string) {

}

export { report };
