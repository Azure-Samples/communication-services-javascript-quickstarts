import { CallClient } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let call;
let incomingCall;
let callAgent;
let deviceManager;
let tokenCredential;
const userToken = document.getElementById("token-input"); 
const calleeInput = document.getElementById("callee-id-input");
const submitToken = document.getElementById("token-submit");
const callButton = document.getElementById("call-button");
const hangUpButton = document.getElementById("hang-up-button");
const acceptCallButton = document.getElementById('accept-call-button');
let callStarted = false;
let targetCallId = '';
let token = "<acsGeneratedUserIdentityToken>";

submitToken.addEventListener("click", async () => {
  const callClient = new CallClient();
  const userTokenCredential = userToken.value;
    try {
      tokenCredential = new AzureCommunicationTokenCredential(userTokenCredential);
      callAgent = await callClient.createCallAgent(tokenCredential);
      deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ audio: true });
      callButton.disabled = false;
      submitToken.disabled = true;
      // Listen for an incoming call to accept.
      callAgent.on('incomingCall', async (args) => {
        try {
          incomingCall = args.incomingCall;
          acceptCallButton.disabled = false;
          callButton.disabled = true; // tracked call state
        } catch (error) {
          console.error(error);
        }
      });
    } catch(error) {
      window.alert("Please submit a valid token!");
    }
})

callButton.addEventListener("click", () => {
  // start a call
  const userToCall = calleeInput.value;
  call = callAgent.startCall(
      [{ id: userToCall }],
      {}
  );
  callStarted = true; 
  // toggle button states
  hangUpButton.disabled = false;
  callButton.disabled = true;
});

hangUpButton.addEventListener("click", () => {
  // end the current call
  call.hangUp({ forEveryone: true });

  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = callStarted = false; // tracked call state
  submitToken.disabled = false;
  acceptCallButton.disabled = true;
  
  // Optionally close WebSocket when call ends
  // closeWebSocket();
});

acceptCallButton.onclick = async () => {
  try {
    call = await incomingCall.accept();
    acceptCallButton.disabled = true;
    hangUpButton.disabled = false;
  } catch (error) {
    console.error(error);
  }
}

// Web socket implementation for moving participants from the lobby to the call
let url = "<socket-url>"+ token;
let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 seconds

function connectWebSocket() {
  if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) {
    return;
  }
  
  isConnecting = true;
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    isConnecting = false;
    reconnectAttempts = 0;
  };

  socket.onmessage = (event) => {
    console.log("🟡 Server says:", event.data);
    let reply = "no";
    
    try {
      if (!callStarted) {
        console.log("Call is not active, so no confirm dialog");
      } else {
        // Show confirm dialog
        console.log("Call is active, showing confirm dialog");
        
        // Show confirm dialog
        const approved = confirm(event.data);
        reply = approved ? "yes" : "no";
      }
      
      // Send response back only if socket is still open
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(reply);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };

  socket.onerror = (err) => {
    console.error("WebSocket error", err);
    isConnecting = false;
  };

  socket.onclose = (event) => {
    console.log("❌ WebSocket closed", event.code, event.reason);
    isConnecting = false;
    
    // Only attempt reconnection if it wasn't a clean close (code 1000)
    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
      setTimeout(() => {
        connectWebSocket();
      }, reconnectDelay);
    }
  };
}

// Function to safely close WebSocket
function closeWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("🔄 Closing WebSocket connection...");
    socket.close(1000, "Client closing connection");
  }
}

// Initialize WebSocket connection
connectWebSocket();

// Handle page unload to properly close WebSocket
window.addEventListener('beforeunload', () => {
  closeWebSocket();
});