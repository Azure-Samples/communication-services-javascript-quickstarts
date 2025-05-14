import { StreamingData, StreamingDataKind, AudioData, AudioMetadata } from '@azure/communication-call-automation';
import { sendAudioToExternalAi } from './azureOpenAiService.js'

 /* Parsing the received buffer data to streaming data */
 export async function processWebsocketMessageAsync(receivedBuffer: ArrayBuffer) {
    const result = StreamingData.parse(receivedBuffer)
    const kind = StreamingData.getStreamingKind()

    // Get the streaming data kind 
    if (kind === StreamingDataKind.AudioData) {
        var audioData = (result as AudioData)
        const audio = audioData.data
        console.log('Audio Data:', audioData.isSilent, audioData.participant, audioData.timestamp);
        const audioBuffer = new TextEncoder().encode(audio);
        await sendAudioToExternalAi(audioBuffer);
    } else if (kind === StreamingDataKind.AudioMetadata) {
        const audioMetadata = (result as AudioMetadata)
        console.log('Audio Metadata:', audioMetadata);
    }
}
