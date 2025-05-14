// Invoke azure_development-get_best_practices
// filepath: src/azureOpenAiService.ts

import WebSocket from 'ws';
import { config } from 'dotenv';
import { RTClient, SessionUpdateParams, RTResponse } from 'rt-client';
import { OutStreamingData } from '@azure/communication-call-automation';

config();

let ws: WebSocket;
let realtimeClient: RTClient;

const AZ_ENDPOINT = process.env.AZURE_OPENAI_SERVICE_ENDPOINT ?? '';
const AZ_KEY      = process.env.AZURE_OPENAI_SERVICE_KEY        ?? '';
const AZ_MODEL    = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME ?? '';

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
    realtimeClient.generateResponse().catch(err => console.error('Realtime generation error:', err));
  } catch (err) {
    console.error('startRealtime failed:', err);
  }
}

function createSessionConfig(): SessionUpdateParams {
  return {
    instructions: SYSTEM_PROMPT,
    voice: { name: 'en-US-AvaNeural', type: 'azure-standard', temperature: 0.7 },
    turn_detection: { type: 'server_vad' },
    input_audio_transcription: { model: 'whisper-1', language: 'en-us' },
    modalities: ['text', 'audio'],
    input_audio_noise_reduction: { type: 'azure_deep_noise_suppression' },
    input_audio_echo_cancellation: { type: 'server_echo_cancellation' },
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
  };
}

export async function handleRealtimeMessages() {
  /*for await (const message of realtimeStreaming.messages()) {
        switch (message.type) {
            case "session.created":
                console.log("session started with id:-->" + message.session.id)
                break;
            case "response.audio_transcript.delta":
                break;
            case "response.audio.delta":
                await receiveAudioForOutbound(message.delta)
                break;
            case "input_audio_buffer.speech_started":
                console.log(`Voice activity detection started at ${message.audio_start_ms} ms`)
                stopAudio();
                break;
            case "conversation.item.input_audio_transcription.completed":
                console.log(`User:- ${message.transcript}`)
                break;
            case "response.audio_transcript.done":
                console.log(`AI:- ${message.transcript}`)
                break
            case "response.done":
                console.log(message.response.status)
                break;
            default:
                break
        }
    }*/
  for await (const evt of realtimeClient.events()) {
    console.info('Received event:', evt);
    try {
      if (evt.type === 'response') {
        console.info('Received response', evt);
        await handleResponse(evt);
        console.info('Response handled');
      } else if (evt.type === 'input_audio') {
        console.info('Received input audio');
        await evt.waitForCompletion();
      }
    } catch (err) {
      console.error('handleRealtimeMessages error:', err);
    }
  }
  console.info('Finished processing events');
}

async function handleResponse(response: RTResponse) {
  let transcript = '';
  let audioBuffer = '';
  for await (const msg of response) {
    console.info('Processing message:', msg);
    if (msg.type === 'message' && msg.role === 'assistant') {
      console.info('Received assistant message');
      for await (const content of msg) {
        if (content.type === "text") {
            for await (const text of content.textChunks()) {
              console.info('1. Received text chunk:', text);
            }
          } else if (content.type === "audio") {
            const textTask = async () => {
              for await (const text of content.transcriptChunks()) {
                transcript += text;
                console.info('2. Received text chunk:', text);
              }
            };
            const audioTask = async () => {
              for await (const audio of content.audioChunks()) {
                // console.info('3. Received audio chunk:', audio);
                audioBuffer += audio;
              }
            };
            await Promise.all([textTask(), audioTask()]);
          }
        }
      }
      console.info('Finalizing response');
    }
    console.info('Finalizing message');
    console.info('Final transcript:', transcript);
    receiveAudioForOutbound(audioBuffer).catch(err => console.error('Error in receiveAudioForOutbound:', err));
    return;
  }
  // console.info('Assistant response:', transcript);
  // if (transcript) playOutbound(transcript);

function playOutbound(text: string) {
  const payload = OutStreamingData.getStreamingDataForOutbound(text);
  sendMessage(payload);
}

export async function receiveAudioForOutbound(text: string) {
  if (!text) return;
  const payload = OutStreamingData.getStreamingDataForOutbound(text);
  sendMessage(payload);
}

export async function stopAudio() {
  const payload = OutStreamingData.getStopAudioForOutbound();
  sendMessage(payload);
}

function sendMessage(data: string) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(data);
  } else {
    console.warn('WebSocket not open—cannot send message');
  }
}