import { config } from 'dotenv';
import express, { Application } from 'express';
import { createIdentifierFromRawId } from "@azure/communication-common";
import { CallAutomationClient, CallConnection, AnswerCallOptions, CallMedia, TextSource, AnswerCallResult, CallMediaRecognizeSpeechOptions } from "@azure/communication-call-automation";
import { v4 as uuidv4 } from 'uuid';
import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.json());

let callConnectionId: string;
let callConnection: CallConnection;
let acsClient: CallAutomationClient;
let openAiClient : OpenAIClient;
let answerCallResult: AnswerCallResult;
let callerId: string;
let callMedia: CallMedia;

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	acsClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

async function createOpenAiClient() {
	const openAiServiceEndpoint = process.env.AZURE_OPENAI_SERVICE_ENDPOINT || "";
	const openAiKey = process.env.AZURE_OPENAI_SERVICE_KEY || "";
	openAiClient = new OpenAIClient(
		openAiServiceEndpoint, 
		new AzureKeyCredential(openAiKey)
	  );
	console.log("Initialized Open Ai Client.");
}

async function hangUpCall() {
	callConnection.hangUp(true);
}

async function startRecognizing(callMedia: CallMedia, callerId: string, message: string, context: string){
	const play : TextSource = { text: message, voiceName: "en-US-NancyNeural", kind: "textSource"}
	const recognizeOptions: CallMediaRecognizeSpeechOptions = { 
		endSilenceTimeoutInSeconds: 1, 
		playPrompt: play, 
		initialSilenceTimeoutInSeconds: 15, 
		interruptPrompt: false, 
		operationContext: context, 
		kind: "callMediaRecognizeSpeechOptions",
	}; 

	const targetParticipant = createIdentifierFromRawId(callerId);
	await callMedia.startRecognizing(targetParticipant, recognizeOptions)
}

async function handlePlay(callConnectionMedia:CallMedia){
	const textContent = 'Goodbye';
	const play : TextSource = { text: textContent, voiceName: "en-US-NancyNeural", kind: "textSource"}
	await callConnectionMedia.playToAll([play]);
}

async function getChatGptResponse(speechInput: string){
	const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME;
	const messages = [
		{ role: "system", content: "You are a helpful assistant." },
		{ role: "user", content: `In less than 200 characters: respond to this question: ${speechInput}` },
	];

	const response = await openAiClient.getChatCompletions(deploymentName, messages);
	const responseContent = response.choices[0].message.content;
	return responseContent;
}

app.post("/api/incomingCall", async (req: any, res:any)=>{
	console.log(`Received incoming call event - data --> ${JSON.stringify(req.body)} `);
	const event = req.body[0];
	try{
		const eventData = event.data;
		if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
			console.log("Received SubscriptionValidation event");
			res.status(200).json({
				validationResponse: eventData.validationCode,
			});
		}

		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		const callbackUri = `${process.env.CALLBACK_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICE_ENDPOINT.trim()}`)
		let cognitiveServiceEndpoint = process.env.COGNITIVE_SERVICE_ENDPOINT;
		const answerCallOptions: AnswerCallOptions = { cognitiveServicesEndpoint: cognitiveServiceEndpoint }; 
		answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
		console.log(`Incoming call answered. Cognitive Service Url :${cognitiveServiceEndpoint}, 
		Callback Uri: ${callbackUri},  CallConnection Id: ${answerCallResult.callConnectionProperties.callConnectionId} `);
		callConnection = answerCallResult.callConnection;
		callMedia = callConnection.getCallMedia();
	}
	catch(error){
		console.error("Error during the incoming call event.", error);
	}
});

app.post('/api/callbacks/:contextId', async (req:any, res:any) => {
	const contextId = req.params.contextId;
  	const event = req.body[0];
	const eventData = event.data;
	console.log(`Received event type ${event.type}`);
	console.log(`event type match ${event.type === "Microsoft.Communication.CallConnected"}`);
	if(event.type === "Microsoft.Communication.CallConnected"){
		console.log("Received CallConnected event");
		const text = 'Hello. How can I help?';
		startRecognizing(callMedia, callerId, text, 'GetFreeFormText');
	}
	else if(event.type === "Microsoft.Communication.PlayCompleted" || event.type === "Microsoft.Communication.playFailed"){
		console.log("Received PlayCompleted event");
		hangUpCall();
	}
	else if(event.type === "Microsoft.Communication.RecognizeCompleted"){
		if(eventData.recognitionType === "speech"){
			const speechText = eventData.speechResult.speech;
			if(speechText !== ''){
				console.log(`Recognized speech ${speechText}`);
				const chatGptResponse = await getChatGptResponse(speechText);
				startRecognizing(callMedia, callerId, chatGptResponse, 'OpenAISample')
			}
		}
	}
	else if(event.type === "Microsoft.Communication.RecognizeFailed"){
		const resultInformation = eventData.resultInformation
		var code = resultInformation.subCode;
		if(code === 8510){
			const text = 'I ve noticed that you have been silent. Are you still there?';
			startRecognizing(callMedia, callerId, text, 'GetFreeFormText');
		}
		else{
			handlePlay(callMedia);
		}
	}
	else if(event.type === "Microsoft.Communication.CallDisconnected"){
		console.log("Received CallDisconnected event");
	}
  });

app.get('/', (req, res) => {
	res.send('Hello ACS CallAutomation!');
  });

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
	await createOpenAiClient();
});
