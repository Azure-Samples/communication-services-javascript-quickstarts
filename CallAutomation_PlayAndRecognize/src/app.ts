import { config } from 'dotenv';
import express, { Application } from 'express';
import { CommunicationIdentifier, PhoneNumberIdentifier, CommunicationUserIdentifier  } from "@azure/communication-common";
import { CallAutomationClient, AnswerCallOptions, CreateCallOptions, CallInvite, FileSource, TextSource, VoiceKind, SsmlSource,
	DtmfTone, PlayOptions, CallMediaRecognizeDtmfOptions, CallMediaRecognizeChoiceOptions,
    CallMediaRecognizeSpeechOptions, CallMediaRecognizeSpeechOrDtmfOptions } from "@azure/communication-call-automation";

config();

const PORT = process.env.PORT;
const app: Application = express();
app.use(express.static('webpage'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let callAutomationClient: CallAutomationClient;
let callInvite: CallInvite;
let targetParticipant: CommunicationIdentifier;
const usePhone: boolean = false;

if (usePhone) {
    const targetPhoneNumberIdentifier: PhoneNumberIdentifier = { phoneNumber: process.env.TARGET_PHONE_NUMBER };
    targetParticipant = targetPhoneNumberIdentifier;
    const callerPhoneNumberIdentifier: PhoneNumberIdentifier = { phoneNumber: process.env.ACS_RESOURCE_PHONE_NUMBER };
    callInvite = { targetParticipant: targetPhoneNumberIdentifier, sourceCallIdNumber: callerPhoneNumberIdentifier };
} else {
    const targetCommunicationUserIdentifier: CommunicationUserIdentifier = { communicationUserId: process.env.TARGET_USER_ID };
    targetParticipant = targetCommunicationUserIdentifier;
    callInvite = { targetParticipant: targetCommunicationUserIdentifier };
}

const audioUri = process.env.CALLBACK_URI + "/prompt.wav";

const operation: string = "PlayTextWithKind";

async function createAcsClient() {
	const connectionString = process.env.CONNECTION_STRING || "";
	callAutomationClient = new CallAutomationClient(connectionString);
	console.log("Initialized ACS Client.");
}

app.get('/index.html', (req, res) => {
	res.sendFile('index.html', { root: 'src/webpage' });
});

app.get('/outboundCall', async (req, res) => {
  
	const createCallOptions: CreateCallOptions = { cognitiveServicesEndpoint: process.env.COGNITIVE_SERVICE_ENDPOINT };
	const result = await callAutomationClient.createCall(callInvite, process.env.CALLBACK_URI + "/api/callbacks", createCallOptions);
	console.log("createCall, result=%s", result);

	res.redirect('/index.html');
});

app.post("/api/callbacks", async (req: any, res: any) => {
	const event = req.body[0];
	const eventData = event.data;
	const callConnectionId = eventData.callConnectionId;
	console.log("Received event %s for call connection id %s", event.type, eventData.callConnectionId);

    if (event.type === "Microsoft.Communication.CallConnected") {
        if (operation === "PlayFile") {
            const playSource: FileSource = { url: audioUri, kind: "fileSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .play([playSource], [targetParticipant]);
            console.log("Play");
        } else if (operation == "PlayTextWithKind") {
            const textToPlay = "Welcome to Contoso";
            // Provide SourceLocale and VoiceKind to select an appropriate voice. SourceLocale or VoiceName needs to be provided.
            const playSource: TextSource = { text: textToPlay, sourceLocale: "en-US", voiceKind: VoiceKind.Female, kind: "textSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .play([playSource], [targetParticipant]);
            console.log("Play");
        }
        else if (operation == "PlayTextWithVoice") {
            const textToPlay = "Welcome to Contoso";
            // Provide VoiceName to select a specific voice. SourceLocale or VoiceName needs to be provided.
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .play([playSource], [targetParticipant]);
            console.log("Play");
        }
        else if (operation == "PlaySSML") {
            const ssmlToPlay = "<speak version=\"1.0\" xmlns=\"http://www.w3.org/2001/10/synthesis\" xml:lang=\"en-US\"><voice name=\"en-US-JennyNeural\">Hello World!</voice></speak>";
            const playSource: SsmlSource = { ssmlText: ssmlToPlay, kind: "ssmlSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .play([playSource], [targetParticipant]);
            console.log("Play");
        }
        else if (operation == "PlayToAll") {
            const textToPlay = "Welcome to Contoso";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .playToAll([playSource]);
            console.log("Play");
        }
        else if (operation == "PlayLoop") {
            const textToPlay = "Welcome to Contoso";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            const playOptions: PlayOptions = { loop: true };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .playToAll([playSource], playOptions);
            console.log("Play");
        }
        else if (operation == "PlayWithCache") {
            const playSource: FileSource = { url: audioUri, playsourcacheid: "<playSourceId>", kind: "fileSource" };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .play([playSource], [targetParticipant]);
            console.log("Play");
        }
        else if (operation == "CancelMedia") {
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .cancelAllOperations();
            console.log("Cancel");
        }
        else if (operation == "RecognizeDTMF") {
            const maxTonesToCollect = 3;
            const textToPlay = "Welcome to Contoso, please enter 3 DTMF.";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            const recognizeOptions: CallMediaRecognizeDtmfOptions = {
                maxTonesToCollect: maxTonesToCollect,
                initialSilenceTimeoutInSeconds: 30,
                playPrompt: playSource,
                interToneTimeoutInSeconds: 5,
                interruptPrompt: true,
                stopDtmfTones: [DtmfTone.Pound],
                kind: "callMediaRecognizeDtmfOptions"
            };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .startRecognizing(targetParticipant, recognizeOptions);
            console.log("Start recognizing");
        }
        else if (operation == "RecognizeChoice") {
            const choices = [
                {
                    label: "Confirm",
                    phrases: ["Confirm", "First", "One"],
                    tone: DtmfTone.One
                },
                {
                    label: "Cancel",
                    phrases: ["Cancel", "Second", "Two"],
                    tone: DtmfTone.Two
                }
            ];
            const textToPlay = "Hello, This is a reminder for your appointment at 2 PM, Say Confirm to confirm your appointment or Cancel to cancel the appointment. Thank you!";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            const recognizeOptions: CallMediaRecognizeChoiceOptions = {
                choices: choices,
                interruptPrompt: true,
                initialSilenceTimeoutInSeconds: 30,
                playPrompt: playSource,
                operationContext: "AppointmentReminderMenu",
                kind: "callMediaRecognizeChoiceOptions"
            };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .startRecognizing(targetParticipant, recognizeOptions);
            console.log("Start recognizing");
        }
        else if (operation == "RecognizeSpeech") {
            const textToPlay = "Hi, how can I help you today?";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            const recognizeOptions: CallMediaRecognizeSpeechOptions = {
                endSilenceTimeoutInSeconds: 1,
                playPrompt: playSource,
                operationContext: "OpenQuestionSpeech",
                kind: "callMediaRecognizeSpeechOptions"
            };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .startRecognizing(targetParticipant, recognizeOptions);
            console.log("Start recognizing");
        }
        else if (operation == "RecognizeSpeechOrDtmf") {
            const maxTonesToCollect = 1;
            const textToPlay = "Hi, how can I help you today, you can press 0 to speak to an agent?";
            const playSource: TextSource = { text: textToPlay, voiceName: "en-US-ElizabethNeural", kind: "textSource" };
            const recognizeOptions: CallMediaRecognizeSpeechOrDtmfOptions = {
                maxTonesToCollect: maxTonesToCollect,
                endSilenceTimeoutInSeconds: 1,
                playPrompt: playSource,
                initialSilenceTimeoutInSeconds: 30,
                interruptPrompt: true,
                operationContext: "OpenQuestionSpeechOrDtmf",
                kind: "callMediaRecognizeSpeechOrDtmfOptions"
            };
            await callAutomationClient.getCallConnection(callConnectionId)
                .getCallMedia()
                .startRecognizing(targetParticipant, recognizeOptions);
            console.log("Start recognizing");
        }

    }
    if (event.type === "Microsoft.Communication.PlayCompleted") {
        console.log("Play completed, context=%s", eventData.operationContext);
    }
    if (event.type === "Microsoft.Communication.PlayFailed") {
        console.log("Play failed: data=%s", JSON.stringify(eventData, null, 2));
    }
    if (event.type === "Microsoft.Communication.PlayCanceled") {
        console.log("Play canceled, context=%s", eventData.operationContext);
    }
    if (event.type === "Microsoft.Communication.RecognizeCompleted") {
        if (eventData.recognitionType === "dtmf") {
            const tones = eventData.dtmfResult.tones;
            console.log("Recognition completed, tones=%s, context=%s", tones, eventData.operationContext);
        } else if (eventData.recognitionType === "choices") {
            const labelDetected = eventData.choiceResult.label;
            const phraseDetected = eventData.choiceResult.recognizedPhrase;
            console.log("Recognition completed, labelDetected=%s, phraseDetected=%s, context=%s", labelDetected, phraseDetected, eventData.operationContext);
        } else if (eventData.recognitionType === "speech") {
            const text = eventData.speechResult.speech;
            console.log("Recognition completed, text=%s, context=%s", text, eventData.operationContext);
        } else {
            console.log("Recognition completed: data=%s", JSON.stringify(eventData, null, 2));
        }
    }
    if (event.type === "Microsoft.Communication.RecognizeFailed") {
        console.log("Recognize failed: data=%s", JSON.stringify(eventData, null, 2));
    }
    if (event.type === "Microsoft.Communication.RecognizeCanceled") {
        console.log("Recognize canceled, context=%s", eventData.operationContext);
    }    

	res.sendStatus(200);
});

// Start the server
app.listen(PORT, async () => {
	console.log(`Server is listening on port ${PORT}`);
	await createAcsClient();
});
