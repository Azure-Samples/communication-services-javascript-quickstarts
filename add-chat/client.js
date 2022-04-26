// <Create a chat client>
import { ChatClient, ChatThreadClient } from '@azure/communication-chat';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let endpointUrl = 'https://<RESOURCE_NAME>.communication.azure.com';
let userAccessToken = '<USER_ACCESS_TOKEN>';

let chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(userAccessToken));
console.log('Azure Communication Chat client created!');

// <Start a chat thread>
async function createChatThread() {
    const createChatThreadRequest = {
        topic: "Calling Application"
    };
    const createChatThreadOptions = {
        participants: [
            {
                id: { communicationUserId: '8:acs:e8b99949-6ab8-4e24-b8cb-c1ad4e170961_00000011-0695-fee6-2c8a-0848220064bc' },
                displayName: 'Corey'
            }
        ]
    };
    const createChatThreadResult = await chatClient.createChatThread(
        createChatThreadRequest,
        createChatThreadOptions
    );
    const threadId = createChatThreadResult.chatThread.id;
    return threadId;
}

createChatThread().then(async threadId => {
    console.log(`Thread created:${threadId}`);

    // <Get a chat thread client>
    let chatThreadClient = chatClient.getChatThreadClient(threadId);
    console.log(`Chat Thread client for threadId:${threadId}`);

    // <List all chat threads>
    const threads = chatClient.listChatThreads();
    for await (const thread of threads) {
        console.log(`Chat Thread item:${thread.id}`);
    }

    // <Receive chat messages from a chat thread>
    chatClient.startRealtimeNotifications();
    chatClient.on("chatMessageReceived", async (e) => {
        console.log("Notification chatMessageReceived!");
    });

    // <Send a message to a chat thread>
    const sendMessageRequest =
    {
        content: 'Hello Geeta! Can you share the deck for the conference?'
    };
    let sendMessageOptions =
    {
        senderDisplayName: 'Jack',
        type: 'text'
    };

    const sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    const messageId = sendChatMessageResult.id;

    // <LIST MESSAGES IN A CHAT THREAD>
    const messages = chatThreadClient.listMessages();
    for await (const message of messages) {
        console.log(`Chat Thread message id:${message.id}`);
    }

    // <Add a user as a participant to the chat thread>
    const addParticipantsRequest =
    {
        participants: [
            {
                id: { communicationUserId: '8:acs:e8b99949-6ab8-4e24-b8cb-c1ad4e170961_00000011-06a2-3ddd-740a-113a0d00bd70' },
                displayName: 'Jane'
            }
        ]
    };
    await chatThreadClient.addParticipants(addParticipantsRequest);

    // <List users in a chat thread>
    const participants = chatThreadClient.listParticipants();
    for await (const participant of participants) {
        console.log(`participants in thread:${participant.id.communicationUserId}`);
    }

    // <Remove user from a chat thread>
    await chatThreadClient.removeParticipant({ communicationUserId: '8:acs:e8b99949-6ab8-4e24-b8cb-c1ad4e170961_00000011-06a2-3ddd-740a-113a0d00bd70' });
    const users = chatThreadClient.listParticipants();
    for await (const user of users) {
        console.log(`participants in thread available:${user.id.communicationUserId}`);
    }
});

