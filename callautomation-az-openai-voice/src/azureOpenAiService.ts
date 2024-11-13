import { config } from 'dotenv';
import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
let openAiClient: OpenAIClient;
let realtimeConversationSession: {};
config();
const answerPromptSystemTemplate = `You're an AI assistant for an elevator company called Contoso Elevators. Customers will contact you as the first point of contact when having issues with their elevators. 
Your priority is to ensure the person contacting you or anyone else in or around the elevator is safe, if not then they should contact their local authorities.
If everyone is safe then ask the user for information about the elevators location, such as city, building and elevator number.
Also get the users name and number so that a technician who goes onsite can contact this person. Confirm with the user all the information 
they've shared that it's all correct and then let them know that you've created a ticket and that a technician should be onsite within the next 24 to 48 hours.`

async function createOpenAiClient() {
    const openAiServiceEndpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT || "";
    const openAiKey = process.env.AZURE_OPENAI_SERVICE_KEY || "";
    openAiClient = new OpenAIClient(
        openAiServiceEndpoint,
        new AzureKeyCredential(openAiKey)
    );
    console.log("Initialized Open Ai Client.");
}

export async function createAiSessionAsync(): Promise<{ realtimeConversation: string }> {
    await createOpenAiClient();
    //TBA
    // openAiClient.getRealTimeConversation()
    const session = { realtimeConversation: "" };
    return session
}

export async function sendAudioToExternalAi(data: string) {
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(data);
    console.log(binaryData);
}

export async function startConversation() {
    await GetOpenAiStreamResponseAsync()
}

async function GetOpenAiStreamResponseAsync() {

}

async function receiveAudioForOutbound(): Promise<string> {
    const message = ''
    return message;
}

