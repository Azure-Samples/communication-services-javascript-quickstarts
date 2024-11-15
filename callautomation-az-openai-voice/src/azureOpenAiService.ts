import { config } from 'dotenv';
import { LowLevelRTClient, SessionUpdateMessage } from "rt-client";

config();
const answerPromptSystemTemplate = `You're an AI assistant for an elevator company called Contoso Elevators. Customers will contact you as the first point of contact when having issues with their elevators. 
Your priority is to ensure the person contacting you or anyone else in or around the elevator is safe, if not then they should contact their local authorities.
If everyone is safe then ask the user for information about the elevators location, such as city, building and elevator number.
Also get the users name and number so that a technician who goes onsite can contact this person. Confirm with the user all the information 
they've shared that it's all correct and then let them know that you've created a ticket and that a technician should be onsite within the next 24 to 48 hours.`

let realtimeStreaming: LowLevelRTClient;

export async function sendAudioToExternalAi(data: string) {
    try {
        const audio = data
        realtimeStreaming.send({
            type: "input_audio_buffer.append",
            audio: audio,
        });
    }
    catch (e) {
        console.log(e)
    }
}

export async function startConversation() {
    const openAiServiceEndpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT || "";
    const openAiKey = process.env.AZURE_OPENAI_SERVICE_KEY || "";
    const openAiDeploymentModel = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME || "";

    await startRealtime(openAiServiceEndpoint, openAiKey, openAiDeploymentModel);
}
async function startRealtime(endpoint: string, apiKey: string, deploymentOrModel: string) {
    try {
        realtimeStreaming = new LowLevelRTClient(new URL(endpoint), { key: apiKey }, { deployment: deploymentOrModel });
        console.log("sending session config");
        await realtimeStreaming.send(createConfigMessage());
        console.log("sent");
        await handleRealtimeMessages();
    } catch (error) {
        console.error("Error during startRealtime:", error);
    }
}

function createConfigMessage(): SessionUpdateMessage {

    let configMessage: SessionUpdateMessage = {
        type: "session.update",
        session: {
            instructions: answerPromptSystemTemplate,
            voice: "alloy",
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
        let consoleLog = "" + message.type;

        switch (message.type) {
            case "session.created":
                console.log("session started with id:-->" + message.session.id)
                break;
            case "response.audio_transcript.delta":
                break;
            case "response.audio.delta":
                break;
            case "input_audio_buffer.speech_started":
                break;
            case "conversation.item.input_audio_transcription.completed":
                break;
            case "response.done":
                break;
            default:
                consoleLog = JSON.stringify(message, null, 2);
                break
        }
        if (consoleLog) {
            console.log(consoleLog);
        }
    }
}


