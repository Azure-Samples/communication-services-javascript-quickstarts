// Invoke azure_development-get_best_practices
// filepath: src/azureOpenAiService.ts

import { WebSocket} from 'ws';
import { config } from 'dotenv';
import { RTClient, SessionUpdateParams, RTResponse } from '../lib/rt-client/index.js';
import { OutStreamingData } from '@azure/communication-call-automation';
import { Buffer } from 'buffer';

config();

let ws: WebSocket;
let realtimeClient: RTClient;

const AZ_ENDPOINT = process.env.AZURE_AI_SERVICE_ENDPOINT ?? '';
const AZ_KEY      = process.env.AZURE_AI_SERVICE_KEY        ?? '';
const AZ_MODEL    = process.env.AZURE_AI_DEPLOYMENT_MODEL_NAME ?? '';

const SYSTEM_PROMPT = 'You are an AI assistant that helps people find information.';

export function initWebsocket(socket: WebSocket) {
  ws = socket;
  console.info('WebSocket initialized for outbound audio');
}

export async function startConversation() {
  await startRealtime(AZ_ENDPOINT, AZ_KEY, AZ_MODEL);
}

export async function sendAudioToExternalAi(audio: Uint8Array) {
  if (!audio || !realtimeClient) return;
  try {
    await realtimeClient.sendAudio(audio);
  } catch (err) {
    console.error('sendAudioToExternalAi error:', err);
  }
  // Do NOT dequeue here!
}

async function startRealtime(endpoint: string, apiKey: string, model: string) {
  try {
    realtimeClient = new RTClient(
      new URL(endpoint),
      { key: apiKey },
      { modelOrAgent: model, apiVersion: '2025-05-01-preview' }
    );
    console.info('Configuring realtime session');
    var session = await realtimeClient.configure(createSessionConfig());
    console.info('Session configured:', session);
    // fire-and-forget message loop
    handleRealtimeMessages().catch(err => console.error('Realtime loop error:', err));
    // Send greeting message
    await whenGreeting();
    console.info('Greeting message sent');
  } catch (err) {
    console.error('startRealtime failed:', err);
  }
}

const whenGreeting = async () => {
    if (realtimeClient) {
      try {
        await realtimeClient.sendItem({
          type: "message",
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Please say somthing to welcome the user.",
            },
          ],
        });
        await realtimeClient.generateResponse();
      } catch (error) {
        console.error("Error sending greeting message:", error);
      }
    }
  };

function createSessionConfig(): SessionUpdateParams {
  return {
    model: AZ_MODEL,
    instructions: SYSTEM_PROMPT,
    voice: { name: 'en-US-AvaNeural', type: 'azure-standard', temperature: 0.7 },
    turn_detection: { type: 'server_vad' },
    input_audio_transcription: { model: 'whisper-1', language: 'en-us' },
    modalities: ['text', 'audio'],
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    input_audio_noise_reduction: {
      type: "azure_deep_noise_suppression"
    },
    input_audio_echo_cancellation: {
      type: "server_echo_cancellation"
    }
  };
}

export async function handleRealtimeMessages() {
  for await (const evt of realtimeClient.events()) {
    try {
      if (evt.type === 'response') {
        await handleResponse(evt);
      } else if (evt.type === 'input_audio') {
        await evt.waitForCompletion();
      }
    } catch (err) {
      console.error('handleRealtimeMessages error:', err);
    }
  }
}

async function handleResponse(response: RTResponse) {
  let transcript = '';
  const audioChunks: Buffer[] = [];

  for await (const msg of response) {
    if (msg.type === 'message' && msg.role === 'assistant') {
      for await (const content of msg) {
        if (content.type === "text") {
          for await (const text of content.textChunks()) {
            transcript += text;
            console.info('1. Received text chunk:', text);
          }
        } else if (content.type === "audio") {
          const textTask = async () => {
            for await (const text of content.transcriptChunks()) {
              transcript += text;
            }
          };
          const audioTask = async () => {
            for await (const audio of content.audioChunks()) {
              // If audio is a Buffer or Uint8Array (raw PCM16), push as is
              if (Buffer.isBuffer(audio)) {
                audioChunks.push(audio);
              } else if (typeof audio === 'string') {
                // If audio is a base64 string, decode it
                audioChunks.push(Buffer.from(audio, 'base64'));
              } else if (audio instanceof Uint8Array) {
                audioChunks.push(Buffer.from(audio));
              } else {
                console.warn('Unknown audio chunk type:', typeof audio);
              }
            }
          };
          await Promise.all([textTask(), audioTask()]);
        }
      }
    }
  }

  console.info('AI:', transcript);

  if (audioChunks.length > 0) {
    const audioBuffer = Buffer.concat(audioChunks);
    await receiveAudioForOutbound(audioBuffer);
  }
}

export async function receiveAudioForOutbound(audioBuffer: Buffer) {
  if (!audioBuffer || audioBuffer.length === 0) return;
  // PCM16 buffer to base64 string
  const payload = OutStreamingData.getStreamingDataForOutbound(audioBuffer.toString("base64"));
  sendMessage(payload);
}

function sendMessage(data: string | ArrayBufferLike) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    console.warn('WebSocket not open—cannot send message');
  }
}