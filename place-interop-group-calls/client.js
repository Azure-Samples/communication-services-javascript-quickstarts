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
    const tokenCredential = new AzureCommunicationTokenCredential("eyJhbGciOiJSUzI1NiIsImtpZCI6IjYwNUVCMzFEMzBBMjBEQkRBNTMxODU2MkM4QTM2RDFCMzIyMkE2MTkiLCJ4NXQiOiJZRjZ6SFRDaURiMmxNWVZpeUtOdEd6SWlwaGsiLCJ0eXAiOiJKV1QifQ.eyJza3lwZWlkIjoiYWNzOmVmZDNjMjI5LWIyMTItNDM3YS05NDVkLTkyMzI2ZjEzYTFiZV8wMDAwMDAyMS0xMDM3LTE5OTUtOThjZi0zZTNhMGQwMDM2YzEiLCJzY3AiOjE3OTIsImNzaSI6IjE3MTk4NzE1NjciLCJleHAiOjE3MTk5NTc5NjcsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6InZvaXAiLCJyZXNvdXJjZUlkIjoiZWZkM2MyMjktYjIxMi00MzdhLTk0NWQtOTIzMjZmMTNhMWJlIiwicmVzb3VyY2VMb2NhdGlvbiI6InVuaXRlZHN0YXRlcyIsImlhdCI6MTcxOTg3MTU2N30.ld1Lugf2DJgK5ERKirnKqKUhgziBG7d0z1KEGX8yGBTq9XDmoQJiB9hFHfwxp_SPQrWmjmpafW7XEBkYC4deZzJL_Kp-cRrxAoY9ELHqWG8vHGhydunVJAOK4MIho7OImjEAbDeLkXF_7c5Q12JyCb2HGdGkoGMmrwIu7AOIiM6iKo4d4QjE1cvkF94Bc14EferZM7xg-i9STSc9JvppsvARGsl-jYZm2ftEcaIgc_K1HWhSBgUxaJFK-PxvQ1c4wY4oaG70CudjVNHhx3L2EW-4fu4l3Ezq2-FmUF0hwXT_zHrLTT5xtSDr51a4OX6AD_4qGTvgYINf5lb7pcTvyA");
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
