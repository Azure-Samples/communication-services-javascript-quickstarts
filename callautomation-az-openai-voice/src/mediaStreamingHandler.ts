import { StreamingData, StreamingDataKind } from '@azure/communication-call-automation';
import { sendAudioToExternalAi } from './azureOpenAiService'

export async function processWebsocketMessageAsync(streamData: ArrayBuffer) {
    const result = StreamingData.parse(streamData)
    const kind = StreamingData.getStreamingKind()
    if (kind === StreamingDataKind.AudioData) {
        if ('isSilent' in result) {
            const audioData = result.data
            await sendAudioToExternalAi(audioData)
        }
    }
}
