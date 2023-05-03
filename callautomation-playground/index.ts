import { CallAutomationClient, CallInvite, CallAutomationEvent, parseCallAutomationEvent, CallConnection, CallMediaRecognizeDtmfOptions, RecognizeCompletedEventData } from "@azure/communication-call-automation";
import {CommunicationIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
const express = require('express');
const bodyParser = require ("body-parser")

const app = express();
app.use(bodyParser.json());

const port = 3000; // default port to listen

const conenctionString = process.env.CONNECTION_STRING || "";
console.log(conenctionString +"is the cstring")
const client = new CallAutomationClient(conenctionString)

const eventStore = new Map<String, CallAutomationEvent>();

async function topLevelMenu(callConnection:CallConnection, targetParticipant:CommunicationIdentifier) {
    //TODO move to seperate file
    //TODO inetraction with dtmf tones

    const recognizeOptions:CallMediaRecognizeDtmfOptions = {playPrompt: {url:process.env.PLAY_PROMPT||"", kind:"fileSource"},kind:"callMediaRecognizeDtmfOptions"}

    const callProperties = await  callConnection.getCallConnectionProperties();

    callConnection.getCallMedia().startRecognizing(targetParticipant, 1, recognizeOptions)

    //TODO accept both compelted and failed
    // should take a type as input
    //eventAwaiter(RecognizeCompletedEventData.,callProperties.callConnectionId||"" )

}

function eventAwaiter(eventType:CallAutomationEvent, corelationId:string){
    //TODO refactor to take an array of event types, for example fail and succeeded, first event returns. 
    const eventKey = eventType.kind+":"+corelationId;

    for(var time =0; time<60;time++) {


        if(eventStore.has(eventKey)){
            const event = eventStore.get(eventKey)
            eventStore.delete(eventKey)
            return event
        }

        setTimeout(() => {
        }, 1000);

    }

    throw console.error("event awaiter tiemout for key"+eventKey);
    

} 

// post route
app.post( "/incomingcall", ( req:any, res:any ) => {
    res.send( "Hello world!" );
} );

// post route
app.post( "/createcall", async ( req:any, res:any ) => {
    console.log("Creating a call")
    console.log(  req.body)

    const calleeNumber = req.body.phoneNumber

    const callerNumber = process.env.CALLER_NUMBER || "";

    const caller:PhoneNumberIdentifier = {phoneNumber:callerNumber}
    const callee:PhoneNumberIdentifier = {phoneNumber:calleeNumber}

    const callInvite:CallInvite = {targetParticipant:callee, sourceCallIdNumber:caller}

    const callbackURL = ""+"/events";

    const call = await client.createCall(callInvite, callbackURL)

    topLevelMenu(call.callConnection,callee);

    res.sendStatus( 200 );
} );

// post route
app.post( "/events", ( req:any, res:any ) => {

    const event = parseCallAutomationEvent(req.body)
    eventStore.set(event.kind+":"+event.correlationId, event)
    res.sendStatus( 200 );

} );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );