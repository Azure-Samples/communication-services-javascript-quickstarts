import { sendAudioToExternalAi, startConversation, handleRealtimeMessages } from './azureOpenAiService'

let websocket: WebSocket

export async function processWebsocketMessageAsync(ws: WebSocket, streamData: ArrayBuffer) {
    const decoder = new TextDecoder();
    const stringJson = decoder.decode(streamData);
    const jsonObject = JSON.parse(stringJson);
    const kind: string = jsonObject.kind;
    if (kind === "AudioData") {
        const audioData = jsonObject.audioData.data;
        await sendAudioToExternalAi(audioData)
    }
}