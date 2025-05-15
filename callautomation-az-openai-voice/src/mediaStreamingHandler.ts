import {
  StreamingData,
  StreamingDataKind,
  AudioData,
  AudioMetadata
} from '@azure/communication-call-automation';
import { sendAudioToExternalAi } from './azureOpenAiService.js';
import { Buffer } from 'buffer';

const SILENCE_THRESHOLD = 1000; // Try 1000 or 2000 for PCM16
const SILENCE_SAMPLE_RATIO = 0.5; // 50% silence required to skip

function convertPCM24toPCM16(pcm24: Uint8Array): Int16Array {
  const pcm16 = new Int16Array(pcm24.length / 3);
  for (let i = 0, j = 0; i < pcm24.length; i += 3, j++) {
    // Properly handle signed 24-bit PCM to signed 16-bit PCM
    let sample = (pcm24[i + 2] << 16) | (pcm24[i + 1] << 8) | pcm24[i];
    // Sign extension for 24-bit to 32-bit
    if (sample & 0x800000) sample |= 0xFF000000;
    pcm16[j] = sample >> 8;
  }
  return pcm16;
}

export async function processWebsocketMessageAsync(receivedBuffer: ArrayBuffer) {
  const result = StreamingData.parse(receivedBuffer);
  const kind = StreamingData.getStreamingKind();

  if (kind === StreamingDataKind.AudioData) {
    const audioData = result as AudioData;
    const pcm24Audio = Buffer.from(audioData.data, 'base64');
    const pcm16Audio = convertPCM24toPCM16(new Uint8Array(pcm24Audio));

    // Silence detection on PCM16 audio
    const silentSamples = pcm16Audio.filter(s => Math.abs(s) < SILENCE_THRESHOLD).length;
    if (silentSamples / pcm16Audio.length >= SILENCE_SAMPLE_RATIO) {
      return;
    }
    // Send PCM16 audio to external AI
    await sendAudioToExternalAi(new Uint8Array(pcm16Audio.buffer)); 
  } else if (kind === StreamingDataKind.AudioMetadata) {
    const meta = result as AudioMetadata;
    console.debug('AudioMetadata:', meta);
  }
}

export async function processWebsocketMessageAsyncs(receivedBuffer: ArrayBuffer) {
	const result = StreamingData.parse(receivedBuffer);
	const kind = StreamingData.getStreamingKind();

	// Get the streaming data kind  
	if (kind === StreamingDataKind.AudioData) {
    const audioData = (result as AudioData);
    const pcm24Audio = Buffer.from(audioData.data, 'base64');
    await sendAudioToExternalAi(new Uint8Array(pcm24Audio.buffer)); 
	}
}