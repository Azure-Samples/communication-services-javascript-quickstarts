import WebSocket from 'ws';
import { streamingData } from '@azure/communication-call-automation';

const wss = new WebSocket.Server({ port: 5001 });

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    ws.on('message', (packetData: ArrayBuffer) => {
        const decoder = new TextDecoder();
        const stringJson = decoder.decode(packetData);
        console.log("STRING JSON=>--" + stringJson)
        var response = streamingData(packetData);
        if ('locale' in response) {
            console.log("--------------------------------------------")
            console.log("Transcription Metadata")
            console.log("CALL CONNECTION ID:-->" + response.callConnectionId);
            console.log("CORRELATION ID:-->" + response.correlationId);
            console.log("LOCALE:-->" + response.locale);
            console.log("SUBSCRIPTION ID:-->" + response.subscriptionId);
            console.log("--------------------------------------------")
        }
        if ('text' in response) {
            console.log("--------------------------------------------")
            console.log("Transcription Data")
            console.log("TEXT:-->" + response.text);
            console.log("FORMAT:-->" + response.format);
            console.log("CONFIDENCE:-->" + response.confidence);
            console.log("OFFSET IN TICKS:-->" + response.offsetInTicks);
            console.log("DURATION IN TICKS:-->" + response.durationInTicks);
            console.log("RESULT STATE:-->" + response.resultState);
            if ('phoneNumber' in response.participant) {
                console.log("PARTICIPANT:-->" + response.participant.phoneNumber);
            }
            if ('communicationUserId' in response.participant) {
                console.log("PARTICIPANT:-->" + response.participant.communicationUserId);
            }
            response.words.forEach(element => {
                console.log("TEXT:-->" + element.text)
                console.log("DURATION IN TICKS:-->" + element.durationInTicks)
                console.log("OFFSET IN TICKS:-->" + element.offsetInTicks)
            });
            console.log("--------------------------------------------")
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server running on port 5001`);
