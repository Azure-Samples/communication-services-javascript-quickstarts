/* eslint-disable require-jsdoc */
import {CallClient} from '@azure/communication-calling';
import {AzureCommunicationTokenCredential} from '@azure/communication-common';
import {CommunicationIdentityClient} from '@azure/communication-identity';
import {ChatClient} from '@azure/communication-chat';

let call;
let callAgent;
let chatClient;
let chatThreadClient;

const meetingLinkInput = document.getElementById('teams-link-input');
const displayNameInput = document.getElementById('name-string-input');
const connectionInput = document.getElementById('connection-string-input');
const callButton = document.getElementById('join-meeting-button');
const hangUpButton = document.getElementById('hang-up-button');
const callStateElement = document.getElementById('call-state');

const messagesContainer = document.getElementById('messages-container');
const chatBox = document.getElementById('chat-box');
const sendMessageButton = document.getElementById('send-message');
const messagebox = document.getElementById('message-box');
const overlayImg = document.getElementById('overlay-img');
const messageBlock = document.getElementById('message');
const setupBlock = document.getElementById('setup');
const callingStatusLabel = document.getElementById('status-bar');
const loadingOverlay = document.getElementById('full-scale-image-loading');
const loadingImageOverlay = document.getElementById('full-scale-image');

let userId;
let tokenString;
let connectionString;

/**
 * Initialize Calling and Chat with given connection string and endpoint URL.
 *
 */
async function init() {
  overlayImg.style.display = 'block';
  connectionString = connectionInput.value;
  // 1. get identify
  const endpointUrl = _getEndpointURL(connectionString);
  const identityClient = new CommunicationIdentityClient(connectionString);
  const identityResponse = await identityClient.createUser();
  userId = identityResponse.communicationUserId;
  const tokenResponse = await identityClient.getToken(identityResponse, [
    'voip',
    'chat',
  ]);
  const {token, expiresOn} = tokenResponse;
  console.log(`\nIssued an access token that expires at: ${expiresOn}`);
  console.log(token);
  tokenString = token;

  // 2. setup Call
  const callClient = new CallClient();
  const tokenCredential = new AzureCommunicationTokenCredential(tokenString);
  callAgent = await callClient.createCallAgent(tokenCredential);
  callButton.disabled = false;

  // 3. setup Chat
  chatClient = new ChatClient(
      endpointUrl,
      new AzureCommunicationTokenCredential(tokenString),
  );
  console.log('Azure Communication Chat client created!');
  overlayImg.style.display = 'none';
}

callButton.addEventListener('click', async () => {
  await init();
  // join with meeting link
  call = callAgent.join({meetingLink: meetingLinkInput.value}, {});
  call.on('stateChanged', () => {
    callStateElement.innerText = call.state;
    _setCallingView(call.state);
  });
  _initChatView();
  // open notifications channel
  await chatClient.startRealtimeNotifications();

  // subscribe to new message notifications
  chatClient.on('chatMessageReceived', (e) => {
    handleRecievedMessages(e);
  });

  chatClient.on('participantsAdded', (e) => {
    handleParticipantAddedMessages(e);
  });

  chatClient.on('participantsRemoved', (e) => {
    handleParticipantRemovedMessages(e);
  });
  // setup chat thread
  const threadId = _getThreadID(meetingLinkInput.value);
  chatThreadClient = await chatClient.getChatThreadClient(threadId);
});

/**
 * Handle Incoming Messages Event
 *
 * @param {ChatMessageReceivedEvent} e - the event object that contains data
 */
function handleRecievedMessages(e) {
  console.log('Notification chatMessageReceived!');
  // check whether the notification is intended for the current thread
  if (e.sender.communicationUserId != userId) {
    renderReceivedMessage(e);
  } else {
    renderSentMessage(e);
  }
  fetchImages(e.attachments);
}

/**
 * Handle Participant Added Event
 *
 * @param {ParticipantsAddedEvent} e - the event object for added participants
 */
function handleParticipantAddedMessages(e) {
  console.log(e.communicationUserId, userId);
  const arr = e.participantsAdded;
  arr.forEach((e) => {
    if (e.id.communicationUserId === userId) {
      e.displayName = 'You';
      overlayImg.style.display = 'none';
    }
  });
  const list = arr.map((e) => e.displayName).join(', ');
  renderSysMessage(list + ' joined the chat.');
}

/**
 * Handle Participant Removed Event
 *
 * @param {ParticipantsRemovedEvent} e - the event object for added participants
 */
function handleParticipantRemovedMessages(e) {
  console.log(e.communicationUserId, userId);
  const arr = e.participantsAdded;
  arr.forEach((e) => {
    if (e.id.communicationUserId === userId) {
      e.displayName = 'You';
    }
  });
  const list = arr.map((e) => e.displayName).join(', ');
  renderSysMessage(list + ' left the chat.');
}


/**
 * Render system messages
 *
 * @param {string} str - The string representation of the system messages
 */
function renderSysMessage(str) {
  const msg = document.createTextNode(str);
  messagesContainer.appendChild(msg);
}

/**
 * Render the message bubble for event chat message received
 *
 * @param {ChatMessageReceivedEvent} e - the event object that contains data
 */
function renderReceivedMessage(e) {
  const messageContent = e.message;
  const displayName = e.senderDisplayName;
  const time = new Date(e.createdOn).toLocaleTimeString();

  const card = document.createElement('div');
  card.className = 'received';
  const title = document.createElement('p');
  title.innerHTML = '<b>' + displayName + '</b> | ' + time + ' ';
  const content = document.createElement('div');
  content.innerHTML = messageContent;
  card.appendChild(title);
  card.appendChild(content);
  messagesContainer.appendChild(card);
  const imageAttachments = e.attachments.filter((e) =>
    e.attachmentType.toLowerCase() === 'teamsinlineimage');
  setImgListeners(card, imageAttachments);
}

/**
 * Render the message bubble for event chat message sent
 *
 * @param {ChatMessageReceivedEvent} e - the event object that contains data
 */
function renderSentMessage(e) {
  const card = document.createElement('div');
  card.className = 'sent';
  const title = document.createElement('p');
  const timeString = new Date(e.createdOn).toLocaleTimeString();
  title.innerHTML = '<b> You </b> | ' + timeString + ' ';
  const content = document.createElement('div');
  content.innerHTML = e.message;
  card.appendChild(title);
  card.appendChild(content);
  messagesContainer.appendChild(card);
}


async function fetchImages(attachments) {
  if (!attachments || Object.keys(attachments).length === 0) {
    return;
  }
  const result = await Promise.all(
      attachments.map(async (attachment) => {
        const response = await fetch(await walkaround(attachment.previewUrl), {
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
  );
  result.forEach((imageRef) => {
    const urlCreator = window.URL || window.webkitURL;
    const url = urlCreator.createObjectURL(imageRef.content);
    document.getElementById(imageRef.id).src = url;
  });
}

function walkaround(url) {
  const string1 = url.replace('threads//', 'threads/' + _getThreadID(meetingLinkInput.value) + '/');
  return string1.replace('https://global.chat.prod.communication.microsoft.com', _getEndpointURL(connectionString));
}

async function setImgListeners(element, imageAttachments) {
  if (!imageAttachments.length > 0) {
    return;
  }
  const imgs = element.getElementsByTagName('img');
  for (const img of imgs) {
    img.addEventListener('click', (e) => {
      fetchFullScaleImage(e, imageAttachments);
    });
  }
}

/**
 * An UI helper function
 *
 * @param {Event} e an object from click event
 * @param {ChatAttachment[]} imageAttachments an array of attachment
 */
function fetchFullScaleImage(e, imageAttachments) {
  const link = imageAttachments.filter((attachment) =>
    attachment.id === e.target.id)[0].url;
  loadingImageOverlay.src = '';
  fetch(walkaround(link), {
    method: 'GET',
    headers: {'Authorization': 'Bearer ' + tokenString},
  }).then(async (result) => {
    const content = await result.blob();
    const urlCreator = window.URL || window.webkitURL;
    const url = urlCreator.createObjectURL(content);
    loadingImageOverlay.src = url;
    loadingOverlay.style.display = 'none';
  });
  loadingOverlay.style.display = 'block';
  overlayImg.style.display = 'block';
}

/**
 * An UI helper function
 *
 * @param {string} val an string that nees to be parsed
 * @return {string} the thread ID
 */
function _getThreadID(val) {
  if (/(http(s?)):\/\//i.test(val)) {
    const base = val.split('/meetup-join/')[1];
    let thread = base.split('thread.v2/')[0];
    thread += 'thread.v2';
    return decodeURIComponent(thread);
  }
  return val;
}

/**
 * An UI helper function
 *
 * @param {string} val an string that nees to be parsed
 * @return {string} the endpoint URL
 */
function _getEndpointURL(val) {
  const str = val.replace('endpoint=', '');
  return str.split('/;accesskey=')[0];
}

/**
 * An UI helper function
 *
 * @param {string} callState an string to indicate call state
 */
function _setCallingView(callState) {
  if (callState === 'Connected') {
    callingStatusLabel.style.display = 'none';
    setupBlock.style.display = 'none';
    messageBlock.style.display = 'block';
    overlayImg.style.display = 'block';
  } else if (callState === 'Disconnected') {
    callingStatusLabel.style.display = 'none';
    setupBlock.style.display = 'block';
  }
}

/**
 * An UI helper function
 *
 */
function _initChatView() {
  callingStatusLabel.style.display = 'block';
  // toggle button and chat box states
  chatBox.style.display = 'block';
  hangUpButton.disabled = false;
  callButton.disabled = true;
  messagesContainer.innerHTML = '';
}

hangUpButton.addEventListener('click', async () => {
  // end the current call
  await call.hangUp();
  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = false;
  callStateElement.innerText = '-';

  // toggle chat states
  messageBlock.style.display = 'none';
  setupBlock.style.display = 'block';
  callingStatusLabel.style.display = 'block';
});

sendMessageButton.addEventListener('click', async () => {
  const message = messagebox.value;

  const sendMessageRequest = {content: message};
  const sendMessageOptions = {senderDisplayName: displayNameInput.value};
  const sendChatMessageResult = await chatThreadClient.sendMessage(
      sendMessageRequest,
      sendMessageOptions);
  const messageId = sendChatMessageResult.id;

  messagebox.value = '';
  console.log(`Message sent!, message id:${messageId}`);
});

overlayImg.addEventListener('click', async () => {
  overlayImg.style.display = 'none';
});
