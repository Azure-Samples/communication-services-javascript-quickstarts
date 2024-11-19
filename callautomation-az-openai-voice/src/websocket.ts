import WebSocket from 'ws';
import { sendAudioToExternalAi, startConversation } from './azureOpenAiService'
import { processWebsocketMessageAsync } from './mediaStreamingHandler'
const wss = new WebSocket.Server({ port: 5001 });
wss.on('connection', async (ws: WebSocket) => {
    console.log('Client connected');
    await startConversation()
    ws.on('message', async (packetData: ArrayBuffer) => {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                await processWebsocketMessageAsync(ws, packetData);
            } else {
                console.warn(`ReadyState: ${ws.readyState}`);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on port 5001`);
