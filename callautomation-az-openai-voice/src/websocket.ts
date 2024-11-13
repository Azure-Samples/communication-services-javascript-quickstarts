import WebSocket from 'ws';
import { sendAudioToExternalAi } from './azureOpenAiService'

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    ws.on('message', (packetData: ArrayBuffer) => {
        const decoder = new TextDecoder();
        const stringJson = decoder.decode(packetData);
        //console.log("STRING JSON=>--" + stringJson)
        const jsonObject = JSON.parse(stringJson);
        const kind: string = jsonObject.kind;

        if (kind === "AudioData") {
            const audioData = jsonObject.audioData.data;
            console.log(audioData);
            sendAudioToExternalAi(audioData).then();
        }
    });

    const data = "";
    ws.send(data);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on port 5001`);
