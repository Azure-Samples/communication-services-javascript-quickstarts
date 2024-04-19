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
const messageBox = document.getElementById("message-box");

var userId = "";
var messages = "";
var chatThreadId = "";

async function init() {
  const connectionString = "<SECRET_CONNECTION_STRING>";
  const endpointUrl = connectionString.split(";")[0];

  const identityClient = new CommunicationIdentityClient(connectionString);

  let identityResponse = await identityClient.createUser();
  userId = identityResponse.communicationUserId;
  console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

  let tokenResponse = await identityClient.getToken(identityResponse, ["voip", "chat"]);

  const { token, expiresOn } = tokenResponse;
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

const joinCall = (urlString, callAgent) => {
  const url = new URL(urlString);
  console.log(url);
  if (url.pathname.startsWith("/meet")) {
    // Short teams URL, so for now call meetingID and pass code API
    return callAgent.join({
      meetingId: url.pathname.split("/").pop(),
      passcode: url.searchParams.get("p"),
    });
  } else {
    return callAgent.join({ meetingLink: urlString }, {});
  }
};

callButton.addEventListener("click", async () => {
  // join with meeting link
  try {
    call = joinCall(meetingLinkInput.value, callAgent);
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
          renderReceivedMessage(e.message);
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

async function renderReceivedMessage(message) {
  messages += '<div class="container lighter">' + message + "</div>";
  messagesContainer.innerHTML = messages;
}

async function renderSentMessage(message) {
  messages += '<div class="container darker">' + message + "</div>";
  messagesContainer.innerHTML = messages;
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
  let message = messageBox.value;

  let sendMessageRequest = { content: message };
  let sendMessageOptions = { senderDisplayName: "Jack" };
  let sendChatMessageResult = await chatThreadClient.sendMessage(
    sendMessageRequest,
    sendMessageOptions
  );
  let messageId = sendChatMessageResult.id;

  messageBox.value = "";
  console.log(`Message sent!, message id:${messageId}`);
});
