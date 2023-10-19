import { CallClient, CallAgent } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { ChatClient } from "@azure/communication-chat";

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

async function init() {
	const connectionString = "endpoint=https://acs-ui-dev.unitedstates.communication.azure.com/;accesskey=+dWgzZXwBO3nhjgU9FC3wueXbeZm+G/1PsHWb6XprAhojreBm/jA78dVbETvk+FXRjZ3rbFiyNVzTmjUvogoAg==";
	const endpointUrl = "https://acs-ui-dev.unitedstates.communication.azure.com/";

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
		   renderReceivedMessage(e.message);
		}
		else {
		   renderSentMessage(e.message);
		}
	});

	chatThreadClient = await chatClient.getChatThreadClient(threadIdInput.value);
});

async function renderReceivedMessage(message) {
	messages += '<div class="container lighter">' + message + '</div>';
	messagesContainer.innerHTML = messages;
}

async function renderSentMessage(message) {
	messages += '<div class="container darker">' + message + '</div>';
	messagesContainer.innerHTML = messages;
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
		chatBox.style.display = "none";
		messages = "";
	});

sendMessageButton.addEventListener("click", async () =>
	{
		let message = messagebox.value;

		let sendMessageRequest = { content: message };
		let sendMessageOptions = { senderDisplayName : 'Jack' };
		console.log('Leah', sendMessageRequest);
		let sendChatMessageResult = await chatThreadClient.sendMessage(sendMessageRequest, sendMessageOptions);

		let messageId = sendChatMessageResult.id;

		messagebox.value = '';
		console.log(`Message sent!, message id:${messageId}`);
	});