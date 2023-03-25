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

let userId;
let _token;
// eslint-disable-next-line max-len
const placeholderImg = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mM88B8AAoUBwfkGMTcAAAAASUVORK5CYII=';


/**
 * Initialize Calling and Chat with given connection string and endpoint URL.
 *
 */
async function init() {
  // replace your conenction string here
  const connectionString = '';

  overlayImg.style.display = 'block';
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
  _token = token;

  // 2. setup Call
  const callClient = new CallClient();
  const tokenCredential = new AzureCommunicationTokenCredential(token);
  callAgent = await callClient.createCallAgent(tokenCredential);
  callButton.disabled = false;

  // 3. setup Chat
  chatClient = new ChatClient(
      endpointUrl,
      new AzureCommunicationTokenCredential(token),
  );
  console.log('Azure Communication Chat client created!');
  overlayImg.style.display = 'none';
}

init();

callButton.addEventListener('click', async () => {
  // join with meeting link
  call = callAgent.join({meetingLink: meetingLinkInput.value}, {});

  call.on('stateChanged', () => {
    callStateElement.innerText = call.state;
    if (call.state === 'Connected') {
      callingStatusLabel.style.display = 'none';
      setupBlock.style.display = 'none';
      messageBlock.style.display = 'block';
    } else if (call.state === 'Disconnected') {
      callingStatusLabel.style.display = 'none';
      setupBlock.style.display = 'block';
    }
  });
  callingStatusLabel.style.display = 'block';
  // toggle button and chat box states
  chatBox.style.display = 'block';
  hangUpButton.disabled = false;
  callButton.disabled = true;

  messagesContainer.innerHTML = '';

  // open notifications channel
  await chatClient.startRealtimeNotifications();

  const threadId = await _getThreadID(meetingLinkInput.value);

  // subscribe to new message notifications
  chatClient.on('chatMessageReceived', (e) => {
    console.log('Notification chatMessageReceived!');

    // check whether the notification is intended for the current thread
    if (e.sender.communicationUserId != userId) {
      renderReceivedMessage(e);
    } else {
      renderSentMessage(e);
    }
    fetchImages(e.attachments);
  });

  chatClient.on('participantsAdded', (e) => {
    console.log(e.communicationUserId, userId);
    const arr = e.participantsAdded;
    arr.forEach((e) => {
      if (e.id.communicationUserId === userId) {
        e.displayName = 'You';
      }
    });
    const list = arr.map((e) => e.displayName).join(', ');
    renderSysMessage(list + ' joined the chat.');
  });

  chatClient.on('participantsRemoved', (e) => {
    console.log(e.communicationUserId, userId);
    const arr = e.participantsAdded;
    arr.forEach((e) => {
      if (e.id.communicationUserId === userId) {
        e.displayName = 'You';
      }
    });
    const list = arr.map((e) => e.displayName).join(', ');
    renderSysMessage(list + ' left the chat.');
  });
  chatThreadClient = await chatClient.getChatThreadClient(threadId);
});


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
    e.attachmentType === 'TeamsInlineImage');
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

function _getThreadID(val) {
  if (/(http(s?)):\/\//i.test(val)) {
    const base = val.split('/meetup-join/')[1];
    let thread = base.split('thread.v2/')[0];
    thread += 'thread.v2';
    return decodeURIComponent(thread);
  }
  return val;
}

function _getEndpointURL(val) {
  const str = val.replace('endpoint=', '');
  return str.split('/;accesskey=')[0];
}

async function fetchImages(attachments) {
  if (!attachments || Object.keys(attachments).length === 0) {
    return;
  }
  const headers = new Headers();
  headers.append('Authorization', 'Bearer ' + _token);
  const opts = {
    method: 'GET',
    headers: headers,
  };
  const result = await Promise.all(
      attachments.map(async (attachment) => {
        const response = await fetch(await walkaround(attachment.previewUrl), {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + _token,
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

async function walkaround(url) {
  return url.replace('threads//', 'threads/' + await _getThreadID(meetingLinkInput.value) + '/');
}

async function setImgListeners(element, imageAttachments) {
  if (!imageAttachments.length > 0) {
    return;
  }

  const imgs = element.getElementsByTagName('img');
  for (const img of imgs) {
    // placeholder img
    img.src = 'data:image/png;base64,' + placeholderImg;
    img.addEventListener('click', async (e) => {
      const link = imageAttachments.filter((attachment) =>
        attachment.id === e.srcElement.id)[0].url;
      document.getElementById('full-scale-image').src = '';
      fetch(await walkaround(link), {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + _token},
      }).then(async (result) => {
        const content = await result.blob();
        const urlCreator = window.URL || window.webkitURL;
        const url = urlCreator.createObjectURL(content);
        document.getElementById('full-scale-image').src = url;
        document.getElementById('full-scale-image-loading').style.display = 'none';
      });
      document.getElementById('full-scale-image-loading').style.display = 'block';
      overlayImg.style.display = 'block';
    });
  }
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
