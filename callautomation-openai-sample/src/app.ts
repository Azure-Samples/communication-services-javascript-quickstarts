import { config } from 'dotenv';
import express, { Application } from 'express';
import { PhoneNumberIdentifier, createIdentifierFromRawId } from "@azure/communication-common";
import { CallAutomationClient, CallConnection, AnswerCallOptions, CallMedia, TextSource, AnswerCallResult, CallMediaRecognizeSpeechOptions, CallIntelligenceOptions, PlayOptions } from "@azure/communication-call-automation";
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
let maxTimeout = 2;

const answerPromptSystemTemplate = `You are an assisant designed to answer the customer query and analyze the sentiment score from the customer tone. 
    You also need to determine the intent of the customer query and classify it into categories such as sales, marketing, shopping, etc.
    Use a scale of 1-10 (10 being highest) to rate the sentiment score. 
    Use the below format, replacing the text in brackets with the result. Do not include the brackets in the output: 
    Content:[Answer the customer query briefly and clearly in two lines and ask if there is anything else you can help with] 
    Score:[Sentiment score of the customer tone] 
    Intent:[Determine the intent of the customer query] 
    Category:[Classify the intent into one of the categories]`;

const helloPrompt = "Hello, thank you for calling! How can I help you today?";
const timeoutSilencePrompt = "I’m sorry, I didn’t hear anything. If you need assistance please let me know how I can help you.";
const goodbyePrompt = "Thank you for calling! I hope I was able to assist you. Have a great day!";
const connectAgentPrompt = "I'm sorry, I was not able to assist you with your request. Let me transfer you to an agent who can help you further. Please hold the line and I'll connect you shortly.";
const callTransferFailurePrompt = "It looks like all I can’t connect you to an agent right now, but we will get the next available agent to call you back as soon as possible.";
const agentPhoneNumberEmptyPrompt = "I’m sorry, we're currently experiencing high call volumes and all of our agents are currently busy. Our next available agent will call you back as soon as possible.";
const EndCallPhraseToConnectAgent = "Sure, please stay on the line. I’m going to transfer you to an agent.";

const transferFailedContext = "TransferFailed";
const connectAgentContext = "ConnectAgent";
const goodbyeContext = "Goodbye";

const agentPhonenumber = process.env.AGENT_PHONE_NUMBER;
const chatResponseExtractPattern = /(?<=: ).*/g;

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

function getSentimentScore(sentimentScore: string){
	const pattern = /(\d)+/g;
	const match = sentimentScore.match(pattern);
	return match ? parseInt(match[0]): -1;
}

async function handlePlay(callConnectionMedia:CallMedia, textToPlay: string, context: string){
	const play : TextSource = { text: textToPlay, voiceName: "en-US-NancyNeural", kind: "textSource"}
	const playOptions : PlayOptions = { operationContext: context };
	await callConnectionMedia.playToAll([play], playOptions);
}

async function detectEscalateToAgentIntent(speechInput:string) {
	return hasIntent(speechInput, "talk to agent");
}

async function hasIntent(userQuery: string, intentDescription: string){
	const systemPrompt = "You are a helpful assistant";
	const userPrompt = `In 1 word: does ${userQuery} have similar meaning as ${intentDescription}?`;
	const result = await getChatCompletions(systemPrompt, userPrompt);
	var isMatch = result.toLowerCase().startsWith("yes");
	console.log("OpenAI results: isMatch=%s, customerQuery=%s, intentDescription=%s", isMatch, userQuery, intentDescription);
	return isMatch;
}

async function getChatCompletions(systemPrompt: string, userPrompt: string){
	const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_MODEL_NAME;
	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	const response = await openAiClient.getChatCompletions(deploymentName, messages);
	const responseContent = response.choices[0].message.content;
	console.log(responseContent);
	return responseContent;
}

async function getChatGptResponse(speechInput: string){
	return await getChatCompletions(answerPromptSystemTemplate, speechInput);
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

			return;
		}

		callerId = eventData.from.rawId;
		const uuid = uuidv4();
		const callbackUri = `${process.env.CALLBACK_URI}/api/callbacks/${uuid}?callerId=${callerId}`;
		const incomingCallContext = eventData.incomingCallContext;
		console.log(`Cognitive service endpoint:  ${process.env.COGNITIVE_SERVICE_ENDPOINT.trim()}`);
		const callIntelligenceOptions: CallIntelligenceOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT };
		const answerCallOptions: AnswerCallOptions = { callIntelligenceOptions: callIntelligenceOptions }; 
		answerCallResult = await acsClient.answerCall(incomingCallContext, callbackUri, answerCallOptions);
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
	console.log(`Received callback event - data --> ${JSON.stringify(req.body)} `);
	console.log(`event type match ${event.type === "Microsoft.Communication.CallConnected"}`);
	if(event.type === "Microsoft.Communication.CallConnected"){
		console.log("Received CallConnected event");
		startRecognizing(callMedia, callerId, helloPrompt, 'GetFreeFormText');
	}
	else if(event.type === "Microsoft.Communication.PlayCompleted"){
		console.log("Received PlayCompleted event");
		
		if(eventData.operationContext && ( eventData.operationContext === transferFailedContext 
			 || eventData.operationContext === goodbyeContext )) {
				console.log("Disconnecting the call");
				hangUpCall();
		}
		else if(eventData.operationContext === connectAgentContext) {
			if(!agentPhonenumber){
				console.log("Agent phone number is empty.");
				handlePlay(callMedia, agentPhoneNumberEmptyPrompt, transferFailedContext);
			}
			else{
				console.log("Initiating the call transfer.");
				const phoneNumberIdentifier: PhoneNumberIdentifier = { phoneNumber: agentPhonenumber };
				const result = await callConnection.transferCallToParticipant(phoneNumberIdentifier);
				console.log("Transfer call initiated");
			}
		}
	}
	else if(event.type === "Microsoft.Communication.playFailed"){
		console.log("Received PlayFailed event");
		hangUpCall();
	}
	else if(event.type === "Microsoft.Communication.callTransferAccepted"){
		console.log("Call transfer accepted event received");
	}
	else if(event.type === "Microsoft.Communication.callTransferFailed"){
		console.log("Call transfer failed event received");
		var resultInformation = eventData.resultInformation;
		console.log("Encountered error during call transfer, message=%s, code=%s, subCode=%s", resultInformation?.message, resultInformation?.code, resultInformation?.subCode);
		handlePlay(callMedia, callTransferFailurePrompt, transferFailedContext);
	}
	else if(event.type === "Microsoft.Communication.RecognizeCompleted"){
		if(eventData.recognitionType === "speech"){
			const speechText = eventData.speechResult.speech;
			if(speechText !== ''){
				console.log(`Recognized speech ${speechText}`);
				if(await detectEscalateToAgentIntent(speechText)){
					handlePlay(callMedia, EndCallPhraseToConnectAgent, connectAgentContext);
				}
				else{
					const chatGptResponse = await getChatGptResponse(speechText);
					const match = chatGptResponse.match(chatResponseExtractPattern);
					console.log(match);
					if(match){
						console.log("Chat GPT Answer=%s, Sentiment Rating=%s, Intent=%s, Category=%s",
						match[0], match[1], match[2], match[3]);
						const score = getSentimentScore(match[1].trim());
						console.log("score=%s", score)
						if(score > -1 && score < 5){
							handlePlay(callMedia, connectAgentPrompt, connectAgentContext);
						}
						else{
							startRecognizing(callMedia, callerId, match[0], 'OpenAISample')
						}
					}
					else{
						console.log("No match found");
						startRecognizing(callMedia, callerId, chatGptResponse, 'OpenAISample')
					}
				}
			}
		}
	}
	else if(event.type === "Microsoft.Communication.RecognizeFailed"){
		const resultInformation = eventData.resultInformation
		var code = resultInformation.subCode;
		if(code === 8510 && maxTimeout > 0){
			maxTimeout--;
			startRecognizing(callMedia, callerId, timeoutSilencePrompt, 'GetFreeFormText');
		}
		else{
			handlePlay(callMedia, goodbyePrompt, goodbyeContext);
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
