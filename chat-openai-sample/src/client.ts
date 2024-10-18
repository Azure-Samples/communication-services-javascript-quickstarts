import { config } from 'dotenv';
import axios from 'axios';
import { CommunicationIdentityClient } from '@azure/communication-identity'; 
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { ChatClient, CreateChatThreadOptions } from '@azure/communication-chat';
config();

const PORT = process.env.PORT;
const ACS_CONNECTION_STRING = process.env.CONNECTION_STRING;
const ACS_URL_ENDPOINT = process.env.ACS_URL_ENDPOINT;

const messages = [
    // Alice says:
    'How can I help you today?',
    // Bob says:
    'I am very upset I have not receive my package yet.',
    // Alice says:
    'I have looked it up for you, it has been dispatched already please follow this tracking number 123456789 on when it will arrive'
];

async function fetchAIAnalysis(url: string, token: string) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(url);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

export async function main() {
    console.log("=== Analyze Sentiment Chat Sample ===");

    // Create identity and token for Alice and Bob
    const identityClient = new CommunicationIdentityClient(ACS_CONNECTION_STRING);
    const { token: token1 , user: user1 } = await identityClient.createUserAndToken(["chat"]);
    const { token: token2 , user: user2 } = await identityClient.createUserAndToken(["chat"]);
    let chatClient1 = new ChatClient(ACS_URL_ENDPOINT, new AzureCommunicationTokenCredential(token1));
    let chatClient2 = new ChatClient(ACS_URL_ENDPOINT, new AzureCommunicationTokenCredential(token2));

    // Create a chat thread with both users
    const createChatThreadResult = await chatClient1.createChatThread(
        { topic: 'Customer Service' },
        { participants: [
            { id: { communicationUserId: user1.communicationUserId }, displayName: 'Alice' },
            { id: { communicationUserId: user2.communicationUserId }, displayName: 'Bob' },
        ]}
    );
    const threadId = createChatThreadResult.chatThread.id;
    let chatThreadClient1 = chatClient1.getChatThreadClient(threadId);
    let chatThreadClient2 = chatClient2.getChatThreadClient(threadId);

    // send a message from user1 and user2
    const sendChatMessageResult1 = await chatThreadClient1.sendMessage(
        { content: messages[0] }, { senderDisplayName : 'Alice', type: 'text' }
    );
    console.log(`Alice (${sendChatMessageResult1.id}) ${messages[0]}`);
    const sendChatMessageResult2 = await chatThreadClient2.sendMessage(
        { content: messages[1] }, { senderDisplayName : 'Bob', type: 'text' }
    );
    console.log(`Bob (${sendChatMessageResult1.id}) ${messages[1]}`);
    const sendChatMessageResult3 = await chatThreadClient1.sendMessage(
        { content: messages[2] }, { senderDisplayName : 'Alice', type: 'text' }
    );
    console.log(`Alice (${sendChatMessageResult1.id}) ${messages[2]}`);

    // Sentiment analysis
    console.log('\n=== Fetching Sentiment Analysis ===');
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult1.id}/sentiment`, token1);
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult2.id}/sentiment`, token1);
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult3.id}/sentiment`, token1);
    

    // Translation
    console.log('\n=== Fetching Translation ===');
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult1.id}/translation/chinese`, token1);
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult2.id}/translation/spanish`, token1);
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/message/${sendChatMessageResult3.id}/translation/german`, token1);

    // Summary
    console.log('\n=== Fetching Summary ===');
    await fetchAIAnalysis(
        `http://localhost:${PORT}/api/chat/${threadId}/summary`, token2);
}

main().catch((err) => {
    console.error("The sample encountered an error:", err);
});