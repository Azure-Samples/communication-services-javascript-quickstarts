// Invoke azure_development-get_best_practices

import WebSocketServer from 'ws';
import { config } from 'dotenv';
import { RTClient, SessionUpdateParams, RTResponse } from 'rt-client';
import { OutStreamingData } from '@azure/communication-call-automation';
import { playToAll } from './app.js';

config();

let ws: WebSocketServer;
let realtimeStreaming: RTClient;

const endpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT ?? '';
const apiKey   = process.env.AZURE_OPENAI_SERVICE_KEY       ?? '';
const model    = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME ?? '';

const SYSTEM_PROMPT = 'You are an AI assistant that helps people find information.';

export async function initWebsocket(socket: WebSocketServer) {
  ws = socket;
}

export async function startConversation() {
  await startRealtime(endpoint, apiKey, model);
}

export async function sendAudioToExternalAi(text: string) {
  if (!text) return;
  try {
    console.log('Sending text to external AI');
    await realtimeStreaming.sendItem({
      type: 'message',
      role: 'system',
      content: [{ type: 'input_text', text }],
    });
    await realtimeStreaming.generateResponse();
  } catch (err) {
    console.error('sendAudioToExternalAi failed:', err);
  }
}

async function startRealtime(url: string, key: string, deployment: string) {
  try {
    realtimeStreaming = new RTClient(
      new URL(url),
      { key },
      { modelOrAgent: deployment, apiVersion: '2025-05-01-preview' }
    );
    console.log('Configuring realtime session');
    await realtimeStreaming.configure(createConfig());
    // start message loop
    handleRealtimeMessages().catch(e => console.error('Realtime loop error:', e));
    // send initial greeting
    await realtimeStreaming.sendItem({
      type: 'message',
      role: 'system',
      content: [{ type: 'input_text', text: 'Please say something to welcome the user.' }],
    });
    await realtimeStreaming.generateResponse();
    console.log('Greeting sent');
  } catch (err) {
    console.error('startRealtime failed:', err);
  }
}

function createConfig(): SessionUpdateParams {
  return {
    instructions: SYSTEM_PROMPT,
    voice: { name: 'en-US-AvaNeural', type: 'azure-standard', temperature: 0.9 },
    turn_detection: { type: 'server_vad' },
    input_audio_transcription: { model: 'whisper-1', language: 'en-us' },
    modalities: ['text', 'audio'],
    input_audio_noise_reduction: { type: 'azure_deep_noise_suppression' },
    input_audio_echo_cancellation: { type: 'server_echo_cancellation' },
  };
}

export async function handleRealtimeMessages() {
  for await (const evt of realtimeStreaming.events()) {
    try {
      if (evt.type === 'response') {
        console.log('Received response event');
        await handleResponse(evt);
      } else if (evt.type === 'input_audio') {
        console.log('Received input audio event');
      }
    } catch (err) {
      console.error('Error handling event:', err);
    }
  }
}

const handleResponse = async (resp: RTResponse) => {
  let finalText = '';
  for await (const msg of resp) {
    if (msg.type === 'message' && msg.role === 'assistant') {
      for await (const content of msg) {
        if (content.type === 'text') {
          for await (const chunk of content.textChunks()) {
            console.log('Text chunk:', chunk);
          }
        } else if (content.type === 'audio') {
          for await (const t of content.transcriptChunks()) {
            finalText += t;
          }
        }
      }
    }
  }
  console.log('Final assembled text:', finalText);
  await playToAll(finalText);
};

async function sendMessage(json: string) {
  if (ws?.readyState === WebSocketServer.OPEN) {
    ws.send(json);
  } else {
    console.warn('WebSocket not open, cannot send message');
  }
}

export async function receiveAudioForOutbound(data: string) {
  try {
    sendMessage(OutStreamingData.getStreamingDataForOutbound(data));
  } catch (err) {
    console.error('receiveAudioForOutbound failed:', err);
  }
}

export async function stopAudio() {
  try {
    sendMessage(OutStreamingData.getStopAudioForOutbound());
  } catch (err) {
    console.error('stopAudio failed:', err);
  }
}