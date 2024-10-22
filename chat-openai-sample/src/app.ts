import { config } from 'dotenv';
import express, { Application } from 'express';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { ChatClient } from '@azure/communication-chat';
import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
config();

const PORT = process.env.PORT;
const ACS_URL_ENDPOINT = process.env.ACS_URL_ENDPOINT;
const app: Application = express();
app.use(express.json());
const TRANSLATION_LANGUAGE = 'spanish'; // Change this to the target language you want to translate to

let openAiClient : OpenAIClient;

const numMessagesToSummarize = 10;
const summarizationSystemPrompt = 'Act like you are a agent specialized in generating summary of a chat conversation, you will be provided with a JSON list of messages of a conversation, generate a summary for the conversation based on the content message.';
const sentimentSystemPrompt = 'Act like you are a agent specialized in generating sentiment of a chat message, please provide the sentiment of the given message as POSITIVE, NEGATIVE or NEUTRAL.';
const translationSystemPrompt = 'Act like you are a agent specialized in generating translation of a chat message, please translate the given message to the TARGET_LANGUAGE. If you do not understand language or recognized words, just echo back the original message';

/* Azure Open AI Service */
async function createOpenAiClient() {
    const openAiServiceEndpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT || "";
    const openAiKey = process.env.AZURE_OPENAI_SERVICE_KEY || "";
    openAiClient = new OpenAIClient(
        openAiServiceEndpoint, 
        new AzureKeyCredential(openAiKey)
    );
    console.log("Initialized Open AI Client.");
}

async function getChatCompletions(systemPrompt: string, userPrompt: string){
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME;
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
    ];

    const response = await openAiClient.getChatCompletions(deploymentName, messages);
    const responseContent = response.choices[0].message.content;
    console.log(responseContent);
    return responseContent;
}

/* Azure Communication Service */
async function getRecentMessages(token: string, threadId: string) {
    const chatClient = new ChatClient(ACS_URL_ENDPOINT, new AzureCommunicationTokenCredential(token));
    const threadClient = chatClient.getChatThreadClient(threadId);
    const messagesIterator = threadClient.listMessages({ maxPageSize: numMessagesToSummarize });
    const messages = [];
    for await (const message of messagesIterator) {
        messages.push(message);
    }
    return messages;
}

async function getMessage(token: string, threadId: string, messageId: string) {
    const chatClient = new ChatClient(ACS_URL_ENDPOINT, new AzureCommunicationTokenCredential(token));
    const threadClient = chatClient.getChatThreadClient(threadId);
    const message = await threadClient.getMessage(messageId);
    return message;
}

/* API routes */
app.get('/api/chat/:threadId/summary', async (req: any, res: any)=>{
    // Authnorization header format: "Bearer <ACS_TOKEN>"
    const token = req.headers['authorization'].split(' ')[1];
    const { threadId } = req.params;
    try{
        const messages = await getRecentMessages(token, threadId);
        const result = await getChatCompletions(summarizationSystemPrompt, JSON.stringify(messages))
        res.json(result);
    }
    catch(error){
        console.error("Error during get summary.", error);
    }
});

app.get('/api/chat/:threadId/message/:messageId/sentiment', async (req: any, res: any)=>{
    // Authnorization header format: "Bearer <ACS_TOKEN>"
    const token = req.headers['authorization'].split(' ')[1];
    const { threadId, messageId } = req.params;
    try{
        const message = await getMessage(token, threadId, messageId);
        const result = await getChatCompletions(sentimentSystemPrompt, message.content.message);
        res.json(result);
    }
    catch(error){
        console.error("Error during get sentiment.", error);
    }
});

app.get('/api/chat/:threadId/message/:messageId/translation/:language', async (req: any, res: any)=>{
    // Authnorization header format: "Bearer <ACS_TOKEN>"
    const token = req.headers['authorization'].split(' ')[1];
    const { threadId, messageId, language } = req.params;
    try{
        const message = await getMessage(token, threadId, messageId);
        const systemPrompt = translationSystemPrompt.replace('TARGET_LANGUAGE', language);
        const result = await getChatCompletions(systemPrompt, message.content.message);
        res.json(result);
    }
    catch(error){
        console.error("Error during get translation.", error);
    }
});

// EventGrid
app.post("/api/chatMessageReceived", async (req: any, res:any)=>{
    console.log(`Received chatMessageReceived event - data --> ${JSON.stringify(req.body)} `);
    const event = req.body[0];

    try{
        const eventData = event.data;
        if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
            console.log("Received SubscriptionValidation event");
            res.status(200).json({
                validationResponse: eventData.validationCode
            });
            return;
        }

        const messageId = event.data.messageId;

        // Sentiment Analysis
        const sentimentResult = await getChatCompletions(sentimentSystemPrompt, event.data.messageBody);
        console.log(`Sentiment ${messageId}: ${sentimentResult}`);

        // Translation
        const translaitonPrompt = translationSystemPrompt.replace('TARGET_LANGUAGE', TRANSLATION_LANGUAGE);
        const translationResult = await getChatCompletions(translaitonPrompt, event.data.messageBody);
        console.log(`Translating ${messageId}: ${translationResult}`);
    }
    catch(error){
        console.error("Error during the message recieved event.", error);
    }
});

app.get('/', (req, res) => {
    res.send('Hello ACS Chat!');
});

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is listening on port ${PORT}`);
    await createOpenAiClient();
});
