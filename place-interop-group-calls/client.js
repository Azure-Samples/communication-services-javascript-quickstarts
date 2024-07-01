const { CallClient, Features } = require('@azure/communication-calling');
const { AzureCommunicationTokenCredential } = require('@azure/communication-common');
const { AzureLogger, setLogLevel } = require("@azure/logger");

let call;
let callAgent;
const teamsIdsInput = document.getElementById('teams-ids-input');
const hangUpButton = document.getElementById('hang-up-button');
const placeInteropGroupCallButton = document.getElementById('place-group-call-button');
const callStateElement = document.getElementById('call-state');
const recordingStateElement = document.getElementById('recording-state');

async function init() {
    const callClient = new CallClient();
    const tokenCredential = new AzureCommunicationTokenCredential("<USER ACCESS TOKEN>");
    callAgent = await callClient.createCallAgent(tokenCredential, { displayName: 'ACS user' });
    placeInteropGroupCallButton.disabled = false;
}
init();

hangUpButton.addEventListener("click", async () => {
    await call.hangUp();
    hangUpButton.disabled = true;
    placeInteropGroupCallButton.disabled = false;
    callStateElement.innerText = '-';
});

placeInteropGroupCallButton.addEventListener("click", () => {
    if (!teamsIdsInput.value) {
        return;
    }


    const participants = teamsIdsInput.value.split(',').map(id => {
        const participantId = id.replace(' ', '');
        return {
            microsoftTeamsUserId: `${participantId}`
        };
    })

    call = callAgent.startCall(participants);

    call.on('stateChanged', () => {
        callStateElement.innerText = call.state;
    })

    call.feature(Features.Recording).on('isRecordingActiveChanged', () => {
        if (call.feature(Features.Recording).isRecordingActive) {
            recordingStateElement.innerText = "This call is being recorded";
        }
        else {
            recordingStateElement.innerText = "";
        }
    });
    hangUpButton.disabled = false;
    placeInteropGroupCallButton.disabled = true;
});
