import { CallAutomationClient, CallInvite, CallLocator, FileSource, PlayOptions, StartRecordingOptions } from "@azure/communication-call-automation";
import { CommunicationUserIdentifier } from "@azure/communication-common";
import express from "express";

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
});

const app = express();
const port = 5000; // default port to listen
app.use(express.json());
const ngrokEndpoint = "";
const cstring = "";
const client = new CallAutomationClient(cstring);
let callConnectionId = "";
let recordingId = "";
let contentLocation = "";
let deleteLocation = "";

// get route
app.get( "/test", ( req, res ) => {
    console.log( "test endpoint" );
    res.sendStatus(200);
} );

// get route
app.post( "/test", ( req, res ) => {
    console.log( "test post endpoint" );
    res.sendStatus(200);

} );

app.get( "/startcall", async ( req, res ) => {
    console.log( "startcall endpoint" );
    const { acstarget } = req.query;
    let targetUser:CommunicationUserIdentifier = {communicationUserId:acstarget?.toString()||""};
    let callInvite:CallInvite = {targetParticipant:targetUser};
    let call = await client.createCall(callInvite, ngrokEndpoint+"/test")
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

    let call = await client.createGroupCall([targetUser,targetUser2], ngrokEndpoint+"/test")
    callConnectionId=call.callConnectionProperties.callConnectionId||""
    res.sendStatus(200);
} );

app.get('/example', (req, res) => {
    const param1 = req.query.param1;
    const param2 = req.query.param2;
    console.log(param1)
    console.log(param2)

    // do something with the parameters
    res.send('Response to GET request with parameters');
  });

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

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );