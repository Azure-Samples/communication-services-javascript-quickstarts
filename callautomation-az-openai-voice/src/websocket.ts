import WebSocket from 'ws';
import { sendAudioToExternalAi, startConversation, handleRealtimeMessages } from './azureOpenAiService'

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', async (ws: WebSocket) => {
    console.log('Client connected');
    //await startConversation();
    ws.on('message', async (packetData: ArrayBuffer) => {
        const decoder = new TextDecoder();
        const stringJson = decoder.decode(packetData);
        const jsonObject = JSON.parse(stringJson);
        const kind: string = jsonObject.kind;
        await startConversation();
        if (kind === "AudioData") {
            const audioData = jsonObject.audioData.data;
            await sendAudioToExternalAi(audioData)
        }
    });

    const data = "";
    ws.send(data);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on port 5001`);
