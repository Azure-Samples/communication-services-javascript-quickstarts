import {
  StreamingData,
  StreamingDataKind,
  AudioData,
  AudioMetadata
} from '@azure/communication-call-automation';
import { sendAudioToExternalAi } from './azureOpenAiService.js';
import { Buffer } from 'buffer';

export async function processWebsocketMessageAsync(receivedBuffer: ArrayBuffer) {
  const result = StreamingData.parse(receivedBuffer);
  const kind = StreamingData.getStreamingKind();

  if (kind === StreamingDataKind.AudioData) {
    const audioData = result as AudioData;
    await sendAudioToExternalAi(new Uint8Array(Buffer.from(audioData.data, 'base64')));
  } else if (kind === StreamingDataKind.AudioMetadata) {
    const meta = result as AudioMetadata;
    console.debug('AudioMetadata:', meta);
  }
}