import WebSocket from 'ws';
import { config } from 'dotenv';
import { LowLevelRTClient, SessionUpdateMessage } from "rt-client";
import { OutStreamingData } from '@azure/communication-call-automation';
config();

let ws: WebSocket;

const openAiServiceEndpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT || "";
const openAiKey = process.env.AZURE_OPENAI_SERVICE_KEY || "";
const openAiDeploymentModel = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME || "";

const answerPromptSystemTemplate = `You're an AI assistant for an elevator company called Contoso Elevators. Customers will contact you as the first point of contact when having issues with their elevators. 
Your priority is to ensure the person contacting you or anyone else in or around the elevator is safe, if not then they should contact their local authorities.
If everyone is safe then ask the user for information about the elevators location, such as city, building and elevator number.
Also get the users name and number so that a technician who goes onsite can contact this person. Confirm with the user all the information 
they've shared that it's all correct and then let them know that you've created a ticket and that a technician should be onsite within the next 24 to 48 hours.`

let realtimeStreaming: LowLevelRTClient;

export async function sendAudioToExternalAi(data: string) {
    try {
        const audio = data
        if (audio) {
            realtimeStreaming.send({
                type: "input_audio_buffer.append",
                audio: audio,
            });
        }
    }
    catch (e) {
        console.log(e)
    }
}

export async function startConversation() {
    await startRealtime(openAiServiceEndpoint, openAiKey, openAiDeploymentModel);
}

async function startRealtime(endpoint: string, apiKey: string, deploymentOrModel: string) {
    try {
        realtimeStreaming = new LowLevelRTClient(new URL(endpoint), { key: apiKey }, { deployment: deploymentOrModel });
        console.log("sending session config");
        await realtimeStreaming.send(createConfigMessage());
        console.log("sent");

    } catch (error) {
        console.error("Error during startRealtime:", error);
    }

    setImmediate(async () => {
        try {
            await handleRealtimeMessages();
        } catch (error) {
            console.error('Error handling real-time messages:', error);
        }
    });
}

function createConfigMessage(): SessionUpdateMessage {

    let configMessage: SessionUpdateMessage = {
        type: "session.update",
        session: {
            instructions: answerPromptSystemTemplate,
            voice: "shimmer",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            turn_detection: {
                type: "server_vad",
            },
            input_audio_transcription: {
                model: "whisper-1"
            }
        }
    };

    return configMessage;
}

export async function handleRealtimeMessages() {
    for await (const message of realtimeStreaming.messages()) {
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
    }
}

export async function initWebsocket(socket: WebSocket) {
    ws = socket;
}

async function stopAudio() {
    try {

        const jsonData = OutStreamingData.getStopAudioForOutbound()
        sendMessage(jsonData);
    }
    catch (e) {
        console.log(e)
    }
}
async function receiveAudioForOutbound(data: string) {
    try {

        const jsonData = OutStreamingData.getStreamingDataForOutbound(data)
        sendMessage(jsonData);
    }
    catch (e) {
        console.log(e)
    }
}

async function sendMessage(data:string) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
    } else {
        console.log("socket connection is not open.")
    }
}
