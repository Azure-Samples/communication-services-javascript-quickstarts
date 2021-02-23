import { CallClient, CallAgent, Renderer, LocalVideoStream} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

let call;
let callAgent;
const calleeInput = document.getElementById("callee-id-input");
const callButton = document.getElementById("call-button");
const hangUpButton = document.getElementById("hang-up-button");
const stopVideoButton = document.getElementById("stopVideo");
const startVideoButton = document.getElementById("startVideo");

let placeCallOptions;
let deviceManager;
let localVideoStream;
let remoteVideoStream;
let rendererLocal;
let rendererRemote;

function handleVideoStreams(v) {
  remoteVideoStream = v;
  remoteVideoView();
  remoteVideoStream.on('availabilityChanged', async () => {
    if (remoteVideoStream.isAvailable) {
        remoteVideoView();
    } else {
        rendererRemote.dispose();
    }
  });
  if (remoteVideoStream.isAvailable) {
    remoteVideoView();
  }
}

function subscribeToRemoteParticipant(p) {
  p.videoStreams.forEach(v => {
    handleVideoStreams(v);
  });
  p.on('videoStreamsUpdated', e => {
    e.added.forEach(v => {
      handleVideoStreams(v);
    })
  });
}


async function init() {
  const callClient = new CallClient();
  const tokenCredential = new AzureCommunicationTokenCredential("<USER ACCESS TOKEN>");
  callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'optional ACS user name' });
      
  deviceManager = await callClient.getDeviceManager();
  callButton.disabled = false;

  callAgent.on('incomingCall', async e => {
    const videoDevices = await deviceManager.getCameras();
    const videoDeviceInfo = videoDevices[0];
    localVideoStream = new LocalVideoStream(videoDeviceInfo);
    localVideoView();

    stopVideoButton.disabled = false;
    callButton.disabled = true;
    hangUpButton.disabled = false;

    const addedCall = await e.incomingCall.accept({videoOptions: {localVideoStreams:[localVideoStream]}});
    call = addedCall;

    addedCall.remoteParticipants.forEach( p => {
      subscribeToRemoteParticipant(p);
    })

    addedCall.on('remoteParticipantsUpdated', e => {
      e.added.forEach( p => {
        subscribeToRemoteParticipant(p);
      })
    });        
  });

  callAgent.on('callsUpdated', e => {
    e.removed.forEach(removedCall => {
      // dispose of video renderers
      rendererLocal.dispose();
      rendererRemote.dispose();
      // toggle button states
      hangUpButton.disabled = true;
      callButton.disabled = false;
      stopVideoButton.disabled = true;
    })
  })
}
init();

async function localVideoView() {
  rendererLocal = new Renderer(localVideoStream);
  const view = await rendererLocal.createView();
  document.getElementById("myVideo").appendChild(view.target);
}

async function remoteVideoView() {
  rendererRemote = new Renderer(remoteVideoStream);
  const view = await rendererRemote.createView();
  document.getElementById("remoteVideo").appendChild(view.target);
}

callButton.addEventListener("click", async () => {
  const videoDevices = await deviceManager.getCameras();
  const videoDeviceInfo = videoDevices[0];
  localVideoStream = new LocalVideoStream(videoDeviceInfo);
  placeCallOptions = {videoOptions: {localVideoStreams:[localVideoStream]}};

  localVideoView();
  stopVideoButton.disabled = false;
  startVideoButton.disabled = true;

  const userToCall = calleeInput.value;
  call = callAgent.startCall(
    [{ communicationUserId: userToCall }],
    placeCallOptions
  );

  call.remoteParticipants.forEach( p => {
    subscribeToRemoteParticipant(p);
  })

  call.on('remoteParticipantsUpdated', e => {
    e.added.forEach( p=>{
      subscribeToRemoteParticipant(p);
    })
  });

  hangUpButton.disabled = false;
  callButton.disabled = true;
});

stopVideoButton.addEventListener("click", async () =>{
  await call.stopVideo(localVideoStream);
  rendererLocal.dispose();
  startVideoButton.disabled = false;
  stopVideoButton.disabled = true;

});

startVideoButton.addEventListener("click", async () => {
  await call.startVideo(localVideoStream);
  localVideoView();
  stopVideoButton.disabled = false;
  startVideoButton.disabled = true;
})

hangUpButton.addEventListener("click", async () => {
  // dispose of video renderers
  rendererLocal.dispose();
  rendererRemote.dispose();
  // end the current call
  await call.hangUp();
  // toggle button states
  hangUpButton.disabled = true;
  callButton.disabled = false;
  stopVideoButton.disabled = true;
});
