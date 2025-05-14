import { StreamingData, StreamingDataKind, AudioData } from '@azure/communication-call-automation';
import { sendAudioToExternalAi } from './azureOpenAiService.js'

 /* Parsing the received buffer data to streaming data */
 export async function processWebsocketMessageAsync(receivedBuffer: ArrayBuffer) {
    const result = StreamingData.parse(receivedBuffer)
    const kind = StreamingData.getStreamingKind()

    // Get the streaming data kind 
    if (kind === StreamingDataKind.AudioData) {
        const audioData = (result as AudioData).data
        // console.log("Received audio data:", audioData);
        await sendAudioToExternalAi(audioData)
    }
}
