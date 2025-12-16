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
// Set this to false if you don't have a WebSocket server running
const enableWebSocket = true;
let socket_url = process.env.WEBSOCKET_URL;
let socket = null;
let isConnecting = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3 seconds

function connectWebSocket() {
  if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) {
    return;
  }
  
  console.log(`🔄 Attempting to connect to WebSocket: ${socket_url}`);
  isConnecting = true;
  
  try {
    socket = new WebSocket(socket_url);
  } catch (error) {
    console.error("❌ Failed to create WebSocket connection:", error);
    isConnecting = false;
    return;
  }

  socket.onopen = () => {
    console.log("✅ WebSocket connected successfully");
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
    console.error("❌ WebSocket connection error:", err);
    console.log("💡 Make sure the WebSocket server is running at:", socket_url);
    isConnecting = false;
  };

  socket.onclose = (event) => {
    console.log(`❌ WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
    isConnecting = false;
    
    // Provide more detailed information about the close reason
    if (event.code === 1006) {
      console.log("💡 Connection was closed abnormally - server might be unavailable");
    } else if (event.code !== 1000) {
      console.log("💡 Connection closed unexpectedly");
    }
    
    // Only attempt reconnection if it wasn't a clean close (code 1000)
    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectDelay/1000} seconds`);
      setTimeout(() => {
        connectWebSocket();
      }, reconnectDelay);
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      console.log("❌ Max reconnection attempts reached. WebSocket functionality will be disabled.");
      console.log("💡 To enable WebSocket features, ensure your server is running and refresh the page.");
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

// Initialize WebSocket connection only if enabled
if (enableWebSocket) {
  connectWebSocket();
} else {
  console.log("💡 WebSocket is disabled. To enable lobby features, set enableWebSocket = true and ensure your server is running.");
}

// Handle page unload to properly close WebSocket
window.addEventListener('beforeunload', () => {
  closeWebSocket();
});

// Handle visibility change to manage connection
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, optionally close connection
  } else {
    // Page is visible, ensure connection is active
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      // connectWebSocket();
    }
  }
});