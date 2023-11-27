import {
    CallClient,
    CallAgent
} from "@azure/communication-calling";
import {
    AzureCommunicationTokenCredential
} from "@azure/communication-common";
import {
    CommunicationIdentityClient
} from "@azure/communication-identity";
import {
    ChatClient
} from "@azure/communication-chat";

let call;
let callAgent;
let chatClient;
let chatThreadClient;

const meetingLinkInput = document.getElementById('teams-link-input');
const threadIdInput = document.getElementById('thread-id-input');
const callButton = document.getElementById("join-meeting-button");
const hangUpButton = document.getElementById("hang-up-button");
const callStateElement = document.getElementById('call-state');

const messagesContainer = document.getElementById("messages-container");
const chatBox = document.getElementById("chat-box");
const sendMessageButton = document.getElementById("send-message");
const messagebox = document.getElementById("message-box");

var userId = '';
var messages = '';
var tokenString = '';

async function init() {
    const connectionString = "<SECRET_CONNECTION_STRING>";
    const endpointUrl = "<ENDPOINT_URL>";

    const identityClient = new CommunicationIdentityClient(connectionString);

    let identityResponse = await identityClient.createUser();
    userId = identityResponse.communicationUserId;
    console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

    let tokenResponse = await identityClient.getToken(identityResponse, [
        "voip",
        "chat",
    ]);

    const {
        token,
        expiresOn
    } = tokenResponse;
    tokenString = token;
    console.log(`\nIssued an access token that expires at: ${expiresOn}`);
    console.log(token);

    const callClient = new CallClient();
    const tokenCredential = new AzureCommunicationTokenCredential(token);
    callAgent = await callClient.createCallAgent(tokenCredential);
    callButton.disabled = false;

    chatClient = new ChatClient(
        endpointUrl,
        new AzureCommunicationTokenCredential(token)
    );

    console.log('Azure Communication Chat client created!');
}

init();

callButton.addEventListener("click", async () => {
    // join with meeting link
    call = callAgent.join({
        meetingLink: meetingLinkInput.value
    }, {});

    call.on('stateChanged', () => {
        callStateElement.innerText = call.state;
    })
    // toggle button and chat box states
    chatBox.style.display = "block";
    hangUpButton.disabled = false;
    callButton.disabled = true;

    messagesContainer.innerHTML = messages;

    console.log(call);

    // open notifications channel
    await chatClient.startRealtimeNotifications();

    // subscribe to new message notifications
    chatClient.on("chatMessageReceived", (e) => {
        console.log("Notification chatMessageReceived!");

        // check whether the notification is intended for the current thread
        if (threadIdInput.value != e.threadId) {
            return;
        }

        if (e.sender.communicationUserId != userId) {
            renderReceivedMessage(e);
        } else {
            renderSentMessage(e.message);
        }
    });

    chatThreadClient = await chatClient.getChatThreadClient(threadIdInput.value);
});

async function renderReceivedMessage(event) {
    
    messages += `<div class="container lighter"> ${event.message} </div>`;;
    messagesContainer.innerHTML = messages;

    // Inject image tag for all image attachments
    var imageAttachmentHtml = event.attachments
        .filter(attachment => attachment.attachmentType === "image" && !messages.contains(attachment.id))
        .map(attachment => renderImageAttachments(attachment))
        .join('');
    messagesContainer.innerHTML += imageAttachmentHtml;

    // get list of attachments and calls renderFileAttachments to construct a file attachment card
    var attachmentHtml = event.attachments
        .filter(attachment => attachment.attachmentType === "file")
        .map(attachment => renderFileAttachments(attachment))
        .join('');
    messagesContainer.innerHTML += attachmentHtml;

    // filter out inline images from attchments
    const imageAttachments = event.attachments.filter((attachment) =>
        attachment.attachmentType === "image" && messages.contains(attachment.id));

    // fetch and render preview images
    fetchPreviewImages(imageAttachments);
}

function renderImageAttachments(attachment) {
    return `<img alt="image" src="" itemscope="png" id="${attachment.id}" style="max-width: 100px">`
}

function renderSentMessage(message) {
    messages += '<div class="container darker">' + message + '</div>';
    messagesContainer.innerHTML = messages;
}

function renderFileAttachments(attachment) {
    var re = /(?:\.([^.]+))?$/;
    var fileExtension = re.exec(attachment.name)[1];  
    return '<div class="attachment-container">' +
        '<p class="attachment-type">' + fileExtension + '</p>' +
        '<img class="attachment-icon" alt="attachment file icon" />' +
        '<div>' +
        '<p>' + attachment.name + '</p>' +
        '<a href=' + attachment.previewUrl + ' target="_blank" rel="noreferrer">Open</a>' +
        '</div>' +
        '</div>';
}

function fetchPreviewImages(attachments) {
    if (!attachments.length > 0) {
        return;
    }
    Promise.all(
        attachments.map(async (attachment) => {
            const response = await fetch(attachment.previewUrl, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + tokenString,
                },
            });
            return {
                id: attachment.id,
                content: await response.blob(),
            };
        }),
    ).then((result) => {
        result.forEach((imageRef) => {
            const urlCreator = window.URL || window.webkitURL;
            const url = urlCreator.createObjectURL(imageRef.content);
            document.getElementById(imageRef.id).src = url;
        });
    }).catch((e) => {
        console.log('error fetching preview images');
    });
}

hangUpButton.addEventListener("click", async () => {
    // end the current call
    await call.hangUp();

    // toggle button states
    hangUpButton.disabled = true;
    callButton.disabled = false;
    callStateElement.innerText = '-';

    // toggle chat states
    chatBox.style.display = "none";
    messages = "";
});

sendMessageButton.addEventListener("click", async () => {
    let message = messagebox.value;

    let sendMessageRequest = {
        content: message
    };
    let sendMessageOptions = {
        senderDisplayName: 'Jack'
    };
    let sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
    let messageId = sendChatMessageResult.id;

    messagebox.value = '';
    console.log(`Message sent!, message id:${messageId}`);
});
