import { CallAutomationClient, CallInvite, CallLocator, CallMediaRecognizeDtmfOptions, DtmfTone, FileSource, PlayOptions, StartRecordingOptions } from "@azure/communication-call-automation";
import { CommunicationUserIdentifier, PhoneNumberIdentifier } from "@azure/communication-common";
import express from "express";

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});

const app = express();
const port = 5000; // default port to listen
app.use(express.json());
const hostingEndpoint = "<HOSTING_ENDPOINT>";
const acsConnectionString = "<ACS_CONNECTION_STRING>";
const client = new CallAutomationClient(acsConnectionString);
let callConnectionId = "";
let recordingId = "";
let contentLocation = "";
let deleteLocation = "";

app.get( "/test", ( req, res ) => {
    console.log( "test endpoint" );
    res.sendStatus(200);
} );

//This will be used for callbacks, for example, here we are listening for a RecognizeCompleted event. we can add additional events here
app.post( "/test", ( req, res ) => {
    console.log( "test post endpoint" );
    const event = req.body[0];
    const eventData = event.data;

    if(event.type=="Microsoft.Communication.RecognizeCompleted")
    {
        let toneList:DtmfTone[] = eventData.dtmfResult.tones
        console.log(toneList)
    }
    res.sendStatus(200);

} );

app.get( "/startcall", async ( req, res ) => {
    console.log( "startcall endpoint" );
    const { acstarget } = req.query;
    let targetUser:CommunicationUserIdentifier = {communicationUserId:acstarget?.toString()||""};
    let callInvite:CallInvite = {targetParticipant:targetUser};
    let call = await client.createCall(callInvite, hostingEndpoint+"/test")
    callConnectionId=call.callConnectionProperties.callConnectionId||""
    res.sendStatus(200);
} );

app.get( "/playmedia", ( req, res ) => {
    console.log( "playmedia endpoint" );
    const { acstarget } = req.query;
    let targetUser:CommunicationUserIdentifier = {communicationUserId:acstarget?.toString()||""};
    const callConnection = client.getCallConnection(callConnectionId);
    const callMedia = callConnection.getCallMedia();
    const filesource:FileSource = {url:"https://acstestapp1.azurewebsites.net/audio/bot-hold-music-1.wav", kind:"fileSource"}
    let playOptions:PlayOptions = {loop:true};
    callMedia.play([filesource],[targetUser],playOptions);
    res.sendStatus(200);
} );

app.get( "/stopmedia", ( req, res ) => {
    console.log( "stopmedia endpoint" );
    const callConnection = client.getCallConnection(callConnectionId);
    const callMedia = callConnection.getCallMedia();
    callMedia.cancelAllOperations();
    res.sendStatus(200);
} );

app.get( "/startgroupcall", async ( req, res ) => {
    console.log( "startgroupcall endpoint" );
    const { acstargets } = req.query;
    const targets = acstargets?.toString().split(',');
    
    let targetUser:CommunicationUserIdentifier = {communicationUserId:(targets?.at(0)||"")};
    let targetUser2:CommunicationUserIdentifier = {communicationUserId:(targets?.at(1)||"")};

    let call = await client.createGroupCall([targetUser,targetUser2], hostingEndpoint+"/test")
    callConnectionId=call.callConnectionProperties.callConnectionId||""
    res.sendStatus(200);
} );

app.get( "/playmediatoall", ( req, res ) => {
    console.log( "playmediatoall endpoint" );
    const callConnection = client.getCallConnection(callConnectionId);
    const callMedia = callConnection.getCallMedia();
    const filesource:FileSource = {url:"https://acstestapp1.azurewebsites.net/audio/bot-hold-music-1.wav", kind:"fileSource"}
    let playOptions:PlayOptions = {loop:true};
    callMedia.playToAll([filesource],playOptions);
    res.sendStatus(200);
} );

app.get( "/startrecording", async ( req, res ) => {
    console.log( "startrecording endpoint" );
    const callRecording = client.getCallRecording();
    const callConnection = client.getCallConnection(callConnectionId);

    const callConnectionProperties = await callConnection.getCallConnectionProperties()
    const serverCallId = callConnectionProperties.serverCallId||""

    const callLocator:CallLocator = {id:serverCallId,kind:"serverCallLocator"}
    let recordingOptions:StartRecordingOptions = {callLocator};
    let recording = callRecording.start(recordingOptions);
    recordingId = (await recording).recordingId;
    res.sendStatus(200);
} );

app.post( "/filestatus", async ( req, res ) => {
    console.log( "filestatus endpoint" );
    const event = req.body[0];
    const eventData = event.data;
  
    if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
      console.log("Received SubscriptionValidation event");
      res.status(200).send({ "ValidationResponse": eventData.validationCode });
    }
    
    if(eventData && event.eventType == "Microsoft.Communication.RecordingFileStatusUpdated") {
        deleteLocation = eventData.recordingStorageInfo.recordingChunks[0].deleteLocation
        contentLocation = eventData.recordingStorageInfo.recordingChunks[0].contentLocation
        console.log("Delete Location: " + deleteLocation);
        console.log("Content Location: " + contentLocation);
        res.sendStatus(200);
    }
});

app.get( "/download", async ( req, res ) => {
    console.log( "download endpoint" );
    const callRecording = client.getCallRecording();
    callRecording.downloadToPath(contentLocation,"testfile.wav")
    res.sendStatus(200);
} );

app.get( "/delete", async ( req, res ) => {
    console.log( "delete endpoint" );
    const callRecording = client.getCallRecording();
    callRecording.delete(deleteLocation)
    res.sendStatus(200);
} );

//****only for those wih a pstn number
app.post( "/incomingcall", async ( req, res ) => {
    console.log( "incomingcall endpoint" );
    const event = req.body[0];
    const eventData = event.data;
  
    if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
      console.log("Received SubscriptionValidation event");
      res.status(200).send({ "ValidationResponse": eventData.validationCode });
    }
    
    if(eventData && event.eventType == "Microsoft.Communication.IncomingCall") {
        var incomingCallContext = eventData.incomingCallContext;
        var callbackUri = hostingEndpoint + "/test";
        let call = await client.answerCall(incomingCallContext,callbackUri);
        callConnectionId = call.callConnectionProperties.callConnectionId||""
        res.sendStatus(200);
    }
});

//****only for those wih a pstn number
app.get( "/recognize", async ( req, res ) => {
    console.log( "recognize endpoint" );
    const callConnection = client.getCallConnection(callConnectionId);
    const callMedia = callConnection.getCallMedia();
    const filesource:FileSource = {url:"https://acstestapp1.azurewebsites.net/audio/bot-hold-music-1.wav", kind:"fileSource"}

    let num:PhoneNumberIdentifier = {phoneNumber:"<enter your pstn caller number startign with +1>"} 

    let recognizeOptions:CallMediaRecognizeDtmfOptions =  {kind:"callMediaRecognizeDtmfOptions",
    interruptCallMediaOperation: true,
    interToneTimeoutInSeconds:10,
    stopDtmfTones: [DtmfTone.Pound],
    initialSilenceTimeoutInSeconds:5,
    interruptPrompt:true,
    playPrompt:filesource
};

    callMedia.startRecognizing(num, 3, recognizeOptions);

    res.sendStatus(200);
} );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );