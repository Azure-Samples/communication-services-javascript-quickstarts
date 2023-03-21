import { CallClient, CallAgent } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { ChatClient } from "@azure/communication-chat";

let call;
let callAgent;
let chatClient;
let chatThreadClient;

const meetingLinkInput = document.getElementById('teams-link-input');
const displayNameInput = document.getElementById('name-string-input');
const callButton = document.getElementById("join-meeting-button");
const hangUpButton = document.getElementById("hang-up-button");
const callStateElement = document.getElementById('call-state');

const messagesContainer = document.getElementById("messages-container");
const chatBox = document.getElementById("chat-box");
const sendMessageButton = document.getElementById("send-message");
const messagebox = document.getElementById("message-box");

var userId = '';
var messages = '';
var _token = ''

async function init() {
	const connectionString = "";
	const endpointUrl = "";

	const identityClient = new CommunicationIdentityClient(connectionString);

	let identityResponse = await identityClient.createUser();
	userId = identityResponse.communicationUserId;
	console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

	let tokenResponse = await identityClient.getToken(identityResponse, [
		"voip",
		"chat",
	]);

	const { token, expiresOn } = tokenResponse;
	console.log(`\nIssued an access token that expires at: ${expiresOn}`);
	console.log(token);
	_token = token

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
	call = callAgent.join({meetingLink: meetingLinkInput.value}, {});

	call.on('stateChanged', () => {
	    callStateElement.innerText = call.state;
		if (call.state === 'Connected') {
			document.getElementById("status-bar").style.display = "none"
			document.getElementById("setup").style.display = "none"
			document.getElementById("message").style.display = 'block'
		} else if (call.state === 'Disconnected') {
			document.getElementById("status-bar").style.display = "none"
			document.getElementById("setup").style.display = "block"
		}
	})
	document.getElementById("status-bar").style.display = "block"
	// toggle button and chat box states
	chatBox.style.display = "block";
	hangUpButton.disabled = false;
	callButton.disabled = true;

	messagesContainer.innerHTML = messages;

	console.log(call);

	// open notifications channel
	await chatClient.startRealtimeNotifications();

	const threadId = await _getThreadID(meetingLinkInput.value)

	// subscribe to new message notifications
	chatClient.on("chatMessageReceived", (e) => {
		console.log("Notification chatMessageReceived!");

      // check whether the notification is intended for the current thread
		if (e.sender.communicationUserId != userId) {
		   renderReceivedMessage(e);
		} else {
		   renderSentMessage(e.message, e.createdOn);
		}
		
		fetchImages(e.attachments)
	});

	chatClient.on("participantsAdded", (e) => {
		console.log(e.communicationUserId, userId);
		const arr = e.participantsAdded
		arr.forEach(e => {
			if (e.id.communicationUserId === userId) {
				e.displayName = 'You'
			}
		})
		const list = arr.map(e => e.displayName).join(', ')
		renderSysMessage(list + " joined the chat.")
	});

	chatClient.on("participantsRemoved", (e) => {
		console.log(e.communicationUserId, userId);
		const arr = e.participantsAdded
		arr.forEach(e => {
			if (e.id.communicationUserId === userId) {
				e.displayName = 'You'
			}
		})
		const list = arr.map(e => e.displayName).join(', ')
		renderSysMessage(list + " left the chat.")
	});
	chatThreadClient = await chatClient.getChatThreadClient(threadId);
});

function renderSysMessage(str) {
	console.log(str);
	const msg = document.createTextNode(str);
	messagesContainer.appendChild(msg);
}

async function renderReceivedMessage(e) {
	const messageContent = e.message
	const displayName = e.senderDisplayName
	const time = new Date(e.createdOn).toLocaleTimeString()
	
	const card = document.createElement("div");
	card.className = "received"
	const title = document.createElement("p");
	title.innerHTML = "<b>" + displayName + "</b> | " + time + " ";
	const content = document.createElement("div");
	content.innerHTML = messageContent
	card.appendChild(title);
	card.appendChild(content);
	messagesContainer.appendChild(card);
}

async function renderSentMessage(message, time) {
	const card = document.createElement("div");
	card.className = "sent"
	const title = document.createElement("p");
	title.innerHTML = "<b> You </b> | " + new Date(time).toLocaleTimeString() + " "
	const content = document.createElement("div");
	content.innerHTML = message
	card.appendChild(title);
	card.appendChild(content);
	messagesContainer.appendChild(card);
}

async function _getThreadID(val) {
    if(/(http(s?)):\/\//i.test(val)) {
      var base = val.split("/meetup-join/")[1]
      var thread = base.split("thread.v2/")[0]
      thread += "thread.v2"
      return decodeURIComponent(thread)
    }
    return val
  }

async function fetchImages(attachments) {
	if (!attachments || Object.keys(attachments).length === 0) {
		return
	}
	let headers = new Headers();
	headers.append('Authorization', 'Bearer ' + _token);
	const opts = {
		method: 'GET',
		headers: headers
	}
	const result = await Promise.all(
		attachments.map(async attachment => {
			const response = await fetch(attachment.previewUrl, {
				method: 'GET',       
				withCredentials: true,
				credentials: 'include',
				headers: {
					'Access-Control-Allow-Headers': 'Authorization',
					'Authorization': 'Bearer ' + _token
				}
			})
			return {
				id: attachment.id,
				content: await response.blob()
			}
		})
	)
	result.forEach(imageRef => {
		var urlCreator = window.URL || window.webkitURL;
		let url = urlCreator.createObjectURL(imageRef.content);
		document.getElementById(imageRef.id).src = url
	})
}

async function setImgListeners(element) {
	element.addEventListener("click", async () => {
		document.getElementById("overlay-img").style.display = "block"
	})
}

hangUpButton.addEventListener("click", async () => 
	{
		// end the current call
		await call.hangUp();
		// toggle button states
		hangUpButton.disabled = true;
		callButton.disabled = false;
		callStateElement.innerText = '-';

		// toggle chat states
		document.getElementById("message").style.display = "none";
		messages = "";
		document.getElementById("setup").style.display = "block"
		document.getElementById("status-bar").style.display = "block"
	});

sendMessageButton.addEventListener("click", async () =>
	{
		let message = messagebox.value;

		let sendMessageRequest = { content: message };
		let sendMessageOptions = { senderDisplayName : displayNameInput.value };
		let sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);
		let messageId = sendChatMessageResult.id;

		messagebox.value = '';
		console.log(`Message sent!, message id:${messageId}`);
	});



document.getElementById("overlay-img").addEventListener("click", async () =>
	{
		document.getElementById("overlay-img").style.display = "none"
	});