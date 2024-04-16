import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { ChatClient } from "@azure/communication-chat";

let call;
let callAgent;
let chatClient;
let chatThreadClient;

const meetingLinkInput = document.getElementById("teams-link-input");
const callButton = document.getElementById("join-meeting-button");
const hangUpButton = document.getElementById("hang-up-button");
const callStateElement = document.getElementById("call-state");

const messagesContainer = document.getElementById("messages-container");
const chatBox = document.getElementById("chat-box");
const sendMessageButton = document.getElementById("send-message");
const messagebox = document.getElementById("message-box");

var userId = "";
var messages = "";
var tokenString = "";
var chatThreadId = "";

async function init() {
  const connectionString = "<YOU_CONNECTION_STRING>";
  const endpointUrl = "<YOU_ENDPOINT_URL>";

  const identityClient = new CommunicationIdentityClient(connectionString);

  let identityResponse = await identityClient.createUser();
  userId = identityResponse.communicationUserId;
  console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

  let tokenResponse = await identityClient.getToken(identityResponse, ["voip", "chat"]);

  const { token, expiresOn } = tokenResponse;
  tokenString = token;
  console.log(`\nIssued an access token that expires at: ${expiresOn}`);
  console.log(token);

  const callClient = new CallClient();
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callAgent = await callClient.createCallAgent(tokenCredential);
  callButton.disabled = false;

  chatClient = new ChatClient(endpointUrl, new AzureCommunicationTokenCredential(token));

  console.log("Azure Communication Chat client created!");
}

init();

callButton.addEventListener("click", async () => {
  // join with meeting link
  try {
    call = callAgent.join({ meetingLink: meetingLinkInput.value }, {});
  } catch {
    throw new Error("Could not join meeting - have you set your connection string?");
  }

  // Chat thread ID is provided from the call info, after connection.
  call.on("stateChanged", async () => {
    callStateElement.innerText = call.state;

    if (call.state === "Connected" && !chatThreadClient) {
      chatThreadId = call.info?.threadId;
      chatThreadClient = chatClient.getChatThreadClient(chatThreadId);

      chatBox.style.display = "block";
      messagesContainer.innerHTML = messages;

      // open notifications channel
      await chatClient.startRealtimeNotifications();

      // subscribe to new message notifications
      chatClient.on("chatMessageReceived", (e) => {
        console.log("Notification chatMessageReceived!");

        // check whether the notification is intended for the current thread
        if (chatThreadId != e.threadId) {
          return;
        }

        if (e.sender.communicationUserId != userId) {
          renderReceivedMessage(e);
        } else {
          renderSentMessage(e.message);
        }
      });
    }
  });

  // toggle button and chat box states
  hangUpButton.disabled = false;
  callButton.disabled = true;

  console.log(call);
});

/**
 * Render the message bubble for event chat message received
 *
 * @param {ChatMessageReceivedEvent} e - the event object that contains data
 */
function renderReceivedMessage(e) {
  const messageContent = e.message;
  const card = document.createElement("div");
  card.className = "container lighter";
  card.innerHTML = messageContent;

  messagesContainer.appendChild(card);

  // filter out inline images from attachments
  const imageAttachments = e.attachments.filter((e) => e.attachmentType.toLowerCase() === "image");

  // fetch and render preview images
  fetchPreviewImages(imageAttachments);

  // set up onclick event handler to fetch full scale image
  setImgHandler(card, imageAttachments);
}

function fetchPreviewImages(attachments) {
  if (!attachments.length > 0) {
    return;
  }
  Promise.all(
    attachments.map(async (attachment) => {
      const response = await fetch(attachment.previewUrl, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + tokenString,
        },
      });
      return {
        id: attachment.id,
        content: await response.blob(),
      };
    })
  )
    .then((result) => {
      result.forEach((imageRef) => {
        const urlCreator = window.URL || window.webkitURL;
        const url = urlCreator.createObjectURL(imageRef.content);
        document.getElementById(imageRef.id).src = url;
      });
    })
    .catch((e) => {
      console.log("error fetching preview images");
    });
}

async function setImgHandler(element, imageAttachments) {
  if (!imageAttachments.length > 0) {
    return;
  }
  const imgs = element.getElementsByTagName("img");
  for (const img of imgs) {
    img.addEventListener("click", (e) => {
      fetchFullScaleImage(e, imageAttachments);
    });
  }
}

async function renderSentMessage(message) {
  const card = document.createElement("div");
  card.className = "container darker";
  card.innerHTML = message;
  messagesContainer.appendChild(card);
}

hangUpButton.addEventListener("click", async () => {
  // end the current call
  await call.hangUp();
  // Stop notifications
  chatClient.stopRealtimeNotifications();

  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = false;
  callStateElement.innerText = "-";

  // toggle chat states
  chatBox.style.display = "none";
  messages = "";
  // Remove local ref
  chatThreadClient = undefined;
});

sendMessageButton.addEventListener("click", async () => {
  let message = messagebox.value;

  let sendMessageRequest = {
    content: message,
  };
  let sendMessageOptions = {
    senderDisplayName: "Jack",
  };
  let sendChatMessageResult = await chatThreadClient.sendMessage(
    sendMessageRequest,
    sendMessageOptions
  );
  let messageId = sendChatMessageResult.id;

  messagebox.value = "";
  console.log(`Message sent!, message id:${messageId}`);
});

const overlayContainer = document.getElementById("overlay-container");
const loadingImageOverlay = document.getElementById("full-scale-image");

function fetchFullScaleImage(e, imageAttachments) {
  // get the image ID from the clicked image element
  const link = imageAttachments.filter((attachment) => attachment.id === e.target.id)[0].url;
  loadingImageOverlay.src = "";

  // fetch the image
  fetch(link, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + tokenString,
    },
  }).then(async (result) => {
    // now we set image blob to our overlay element
    const content = await result.blob();
    const urlCreator = window.URL || window.webkitURL;
    const url = urlCreator.createObjectURL(content);
    loadingImageOverlay.src = url;
  });
  // show overlay
  overlayContainer.style.display = "block";
}

loadingImageOverlay.addEventListener("click", () => {
  overlayContainer.style.display = "none";
});
