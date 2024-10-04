using Azure;
using Azure.AI.OpenAI;
using Azure.Communication;
using Azure.Communication.CallAutomation;
using Azure.Messaging;
using Azure.Messaging.EventGrid;
using Azure.Messaging.EventGrid.SystemEvents;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using Microsoft.VisualBasic;
using NAudio.Wave;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Text.Json;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

/// Your ACS resource connection string
var acsConnectionString = "";

// Your ACS resource phone number will act as source number to start outbound call
var acsPhoneNumber = "";

// Target phone number you want to receive the call.
var targetPhoneNumber = "";

// Base url of the app
var callbackUriHost = "";

//Call back URL
var callbackUri = new Uri(new Uri(callbackUriHost), "/api/callbacks");

// Your cognitive service endpoint
var cognitiveServiceEndpoint = "";

var CognitiveServicesKey = "";

//Transport URL
var transportUrl = "";

//Bring Your Own Storage URL
var bringYourOwnStorageUrl = "";

string callConnectionId = string.Empty;
string recordingId = string.Empty;
string metadataLocation = string.Empty;
string contentLocation = string.Empty;
string filePath = string.Empty;
string recordingPrompt = "Recording is Started.";
bool isBYOS = false;


CallAutomationClient callAutomationClient = new CallAutomationClient(acsConnectionString);
var app = builder.Build();

app.MapPost("/createIncomingCall", async (string targetId, ILogger<Program> logger) =>
{
    CommunicationUserIdentifier callee = new CommunicationUserIdentifier(targetId);
    var callInvite = new CallInvite(callee);
    var createCallOptions = new CreateCallOptions(callInvite, callbackUri)
    {
        CallIntelligenceOptions = new CallIntelligenceOptions() { CognitiveServicesEndpoint = new Uri(cognitiveServiceEndpoint) }
    };
    await callAutomationClient.CreateCallAsync(createCallOptions);
});

app.MapPost("/outboundCall", async (ILogger<Program> logger) =>
{
    PhoneNumberIdentifier target = new PhoneNumberIdentifier(targetPhoneNumber);
    PhoneNumberIdentifier caller = new PhoneNumberIdentifier(acsPhoneNumber);

    CallInvite callInvite = new CallInvite(target, caller);

    //TranscriptionOptions transcriptionOptions = new TranscriptionOptions(new Uri(transportUrl),
    //    "en-us", true, TranscriptionTransport.Websocket);

    var createCallOptions = new CreateCallOptions(callInvite, callbackUri)
    {
        CallIntelligenceOptions = new CallIntelligenceOptions() { CognitiveServicesEndpoint = new Uri(cognitiveServiceEndpoint) },
        //TranscriptionOptions = transcriptionOptions
    };

    CreateCallResult createCallResult = await callAutomationClient.CreateCallAsync(createCallOptions);

    logger.LogInformation($"Created call with connection id: {createCallResult.CallConnectionProperties.CallConnectionId}");
});

app.MapPost("/api/callbacks", (CloudEvent[] cloudEvents, ILogger<Program> logger) =>
{
    foreach (var cloudEvent in cloudEvents)
    {
        CallAutomationEventBase parsedEvent = CallAutomationEventParser.Parse(cloudEvent);
        logger.LogInformation(
                    "Received call event: {type}, callConnectionID: {connId}, serverCallId: {serverId}",
                    parsedEvent.GetType(),
                    parsedEvent.CallConnectionId,
                    parsedEvent.ServerCallId);

        if (parsedEvent is CallConnected callConnected)
        {
            logger.LogInformation($"Received call event: {callConnected.GetType()}");
            callConnectionId = callConnected.CallConnectionId;
            CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();
            logger.LogInformation($"CORRELATION ID: {callConnectionProperties.CorrelationId}");
            logger.LogInformation($"Media Streaming state: {callConnectionProperties.MediaStreamingSubscription.State}");
            logger.LogInformation($"Transcription state: {callConnectionProperties.TranscriptionSubscription.State}");

        }
        else if (parsedEvent is PlayStarted playStarted)
        {
            logger.LogInformation($"Received call event: {playStarted.GetType()}");
            callConnectionId = playStarted.CallConnectionId;
        }
        else if (parsedEvent is PlayCompleted playCompleted)
        {
            logger.LogInformation($"Received call event: {playCompleted.GetType()}");
            callConnectionId = playCompleted.CallConnectionId;
        }
        else if (parsedEvent is PlayFailed playFailed)
        {
            callConnectionId = playFailed.CallConnectionId;
            logger.LogInformation($"Received call event: {playFailed.GetType()}, CorrelationId: {playFailed.CorrelationId}, " +
                      $"subCode: {playFailed.ResultInformation?.SubCode}, message: {playFailed.ResultInformation?.Message}, context: {playFailed.OperationContext}");
        }
        else if (parsedEvent is PlayCanceled playCanceled)
        {
            logger.LogInformation($"Received call event: {playCanceled.GetType()}");
            callConnectionId = playCanceled.CallConnectionId;
        }
        else if (parsedEvent is TranscriptionStarted transcriptionStarted)
        {
            logger.LogInformation($"Received call event: {transcriptionStarted.GetType()}");
            callConnectionId = transcriptionStarted.CallConnectionId;
        }
        else if (parsedEvent is TranscriptionStopped transcriptionStopped)
        {
            logger.LogInformation($"Received call event: {transcriptionStopped.GetType()}");
            callConnectionId = transcriptionStopped.CallConnectionId;
        }
        else if (parsedEvent is TranscriptionUpdated transcriptionUpdated)
        {
            logger.LogInformation($"Received call event: {transcriptionUpdated.GetType()}");
            callConnectionId = transcriptionUpdated.CallConnectionId;
        }
        else if (parsedEvent is TranscriptionFailed transcriptionFailed)
        {
            callConnectionId = transcriptionFailed.CallConnectionId;
            logger.LogInformation($"Received call event: {transcriptionFailed.GetType()}, CorrelationId: {transcriptionFailed.CorrelationId}, " +
                      $"subCode: {transcriptionFailed.ResultInformation?.SubCode}, message: {transcriptionFailed.ResultInformation?.Message}, context: {transcriptionFailed.OperationContext}");
        }
        else if (parsedEvent is CallDisconnected callDisconnected)
        {
            logger.LogInformation($"Received call event: {callDisconnected.GetType()}");
        }
    }
    return Results.Ok();
}).Produces(StatusCodes.Status200OK);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/* Route for Azure Communication Service eventgrid webhooks*/
app.MapPost("/api/events", async ([FromBody] EventGridEvent[] eventGridEvents, ILogger<Program> logger) =>
{
    foreach (var eventGridEvent in eventGridEvents)
    {
        logger.LogInformation($"Incoming Call event received : {System.Text.Json.JsonSerializer.Serialize(eventGridEvent)}");

        // Handle system events
        if (eventGridEvent.TryGetSystemEventData(out object eventData))
        {
            // Handle the subscription validation event.
            if (eventData is SubscriptionValidationEventData subscriptionValidationEventData)
            {
                var responseData = new SubscriptionValidationResponse
                {
                    ValidationResponse = subscriptionValidationEventData.ValidationCode
                };
                return Results.Ok(responseData);
            }
        }
        if (eventData is AcsIncomingCallEventData incomingCallEventData)
        {
            var incomingCallContext = incomingCallEventData?.IncomingCallContext;

            //TranscriptionOptions transcriptionOptions = new TranscriptionOptions(new Uri(transportUrl),
            //    "en-us", true, TranscriptionTransport.Websocket);

            var options = new AnswerCallOptions(incomingCallContext, callbackUri)
            {
                CallIntelligenceOptions = new CallIntelligenceOptions
                {
                    CognitiveServicesEndpoint = new Uri(cognitiveServiceEndpoint),
                },
                //TranscriptionOptions = transcriptionOptions
            };

            AnswerCallResult answerCallResult = await callAutomationClient.AnswerCallAsync(options);
            var callConnectionId = answerCallResult.CallConnection.CallConnectionId;
            logger.LogInformation($"Answer call result: {callConnectionId}");

            var callConnectionMedia = answerCallResult.CallConnection.GetCallMedia();
            //Use EventProcessor to process CallConnected event
            var answer_result = await answerCallResult.WaitForEventProcessorAsync();

            if (answer_result.IsSuccess)
            {
                logger.LogInformation($"Call connected event received for connection id: {answer_result.SuccessResult.CallConnectionId}");
                logger.LogInformation($"CORRELATION ID: {answer_result.SuccessResult.CorrelationId}");
            }
        }

        if (eventData is AcsRecordingFileStatusUpdatedEventData statusUpdated)
        {
            metadataLocation = statusUpdated.RecordingStorageInfo.RecordingChunks[0].MetadataLocation;
            contentLocation = statusUpdated.RecordingStorageInfo.RecordingChunks[0].ContentLocation;
            var deletecLocation = statusUpdated.RecordingStorageInfo.RecordingChunks[0].DeleteLocation;
            logger.LogInformation($"Metadata Location:--> {metadataLocation}");
            logger.LogInformation($"Content Location:--> {contentLocation}");
            logger.LogInformation($"Delete Location:--> {deletecLocation}");

            if (!isBYOS)
            {
                filePath = await downloadRecording();
                await DownloadRecordingMetadata(logger);
            }
        }
    }
    return Results.Ok();
});

app.MapPost("/playMedia", async (bool isPlayToAll, ILogger<Program> logger) =>
{
    Console.WriteLine(isPlayToAll);
    await PlayMediaAsync(isPlayToAll);
    return Results.Ok();
});

app.MapPost("/startRecording", async (bool isByos, ILogger<Program> logger) =>
{
    isBYOS = isByos;
    await StartRecordingAsync(isByos, logger);
    return Results.Ok();
});

app.MapPost("/stopRecording", async (ILogger<Program> logger) =>
{
    await StopRecordingAsync(logger);
    return Results.Ok();
});

app.MapPost("/summarize", async (ILogger<Program> logger) =>
{
    string transcript = await ConvertSpeechToText(filePath);
    //logger.LogInformation($"text: {transcript}");
    //return transcript;
    logger.LogInformation("Get a Brief summary of the conversation");
    //string transcript = req.Query["transcript"];

    //string requestBody = await new StreamReader(filePath).ReadToEndAsync();
    //dynamic data = JsonConvert.DeserializeObject(requestBody);
    //string transcript = data?.transcript;


    //Stream Chat Message with open AI
    var openAIClient = getClient();

    var chatCompletionsOptions = new ChatCompletionsOptions()
    {
        Messages =
                   {
                        new ChatMessage(ChatRole.System, recordingPrompt),
                        new ChatMessage(ChatRole.User, transcript),
                        new ChatMessage(ChatRole.User, recordingPrompt)
                    },
        Temperature = (float)1,
        MaxTokens = 800
    };


    Response<StreamingChatCompletions> chatresponse = await openAIClient.GetChatCompletionsStreamingAsync(
     deploymentOrModelName: "gpt-4", chatCompletionsOptions);
    using StreamingChatCompletions streamingChatCompletions = chatresponse.Value;

    string responseMessage = "";

    await foreach (StreamingChatChoice choice in streamingChatCompletions.GetChoicesStreaming())
    {
        await foreach (ChatMessage message in choice.GetMessageStreaming())
        {
            responseMessage = responseMessage + message.Content;
            Console.Write(message.Content);
        }
        Console.WriteLine();
    }
    return new OkObjectResult(responseMessage);
});

app.MapPost("/disConnectCall", async (ILogger<Program> logger) =>
{
    var callConnection = callAutomationClient.GetCallConnection(callConnectionId);
    await callConnection.HangUpAsync(true);
    return Results.Ok();
});

async Task PlayMediaAsync(bool isPlayToAll)
{
    CallMedia callMedia = GetCallMedia();

    TextSource playSource = new TextSource("Hi, this is test source played through play source thanks. Goodbye!.")
    {
        VoiceName = "en-US-NancyNeural"
    };
    if (isPlayToAll)
    {
        PlayToAllOptions playToAllOptions = new PlayToAllOptions(playSource)
        {
            OperationContext = "playToAllContext",
            OperationCallbackUri = callbackUri
        };
        await callMedia.PlayToAllAsync(playToAllOptions);
    }
    else
    {
        CommunicationIdentifier target = GetCommunicationTargetIdentifier();

        var playTo = new List<CommunicationIdentifier> { target };

        await callMedia.PlayAsync(playSource, playTo);
    }
}

async Task StartTranscriptionAsync()
{
    CallMedia callMedia = GetCallMedia();

    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();

    if (callConnectionProperties.TranscriptionSubscription.State.Equals("inactive"))
    {
        await callMedia.StartTranscriptionAsync();
    }
    else
    {
        Console.WriteLine("Transcription is already active");
    }
}

async Task StopTranscriptionAsync()
{
    CallMedia callMedia = GetCallMedia();

    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();

    if (callConnectionProperties.TranscriptionSubscription.State.Equals("active"))
    {
        await callMedia.StopTranscriptionAsync();
    }
    else
    {
        Console.WriteLine("Transcription is not active");
    }
}

async Task UpdateTranscriptionAsync()
{
    CallMedia callMedia = GetCallMedia();

    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();

    if (callConnectionProperties.TranscriptionSubscription.State.Equals("active"))
    {
        await callMedia.UpdateTranscriptionAsync("en-au");
    }
    else
    {
        Console.WriteLine("Transcription is not active");
    }
}

async Task StartRecordingAsync(bool isByos, ILogger<Program> logger)
{
    CallMedia callMedia = GetCallMedia();
    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();
    StartRecordingOptions recordingOptions = new StartRecordingOptions(new ServerCallLocator(callConnectionProperties.ServerCallId))
    {
        RecordingContent = RecordingContent.Audio,
        RecordingChannel = RecordingChannel.Unmixed,
        RecordingFormat = RecordingFormat.Wav,
        RecordingStorage = isByos && !string.IsNullOrEmpty(bringYourOwnStorageUrl) ? RecordingStorage.CreateAzureBlobContainerRecordingStorage(new Uri(bringYourOwnStorageUrl)) : null
    };
    var playTask = HandlePlayAsync(callMedia, recordingPrompt, "handleRecordingPromptContext");

    var recordingTask = callAutomationClient.GetCallRecording().StartAsync(recordingOptions);
    await Task.WhenAll(playTask, recordingTask);
    recordingId = recordingTask.Result.Value.RecordingId;
    logger.LogInformation($"Call recording id--> {recordingId}");
}


async Task StopRecordingAsync(ILogger<Program> logger)
{
    CallMedia callMedia = GetCallMedia();
    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();
    var playTask = HandlePlayAsync(callMedia, "Recording is Stopped.", "handlePromptContext");

    await callAutomationClient.GetCallRecording().StopAsync(recordingId);
    logger.LogInformation($"Recording is Stopped.");
}

CallMedia GetCallMedia()
{
    CallMedia callMedia = !string.IsNullOrEmpty(callConnectionId) ?
        callAutomationClient.GetCallConnection(callConnectionId).GetCallMedia()
        : throw new ArgumentNullException("Call connection id is empty");

    return callMedia;
}

CallConnectionProperties GetCallConnectionProperties()
{
    CallConnectionProperties callConnectionProperties = !string.IsNullOrEmpty(callConnectionId) ?
       callAutomationClient.GetCallConnection(callConnectionId).GetCallConnectionProperties()
       : throw new ArgumentNullException("Call connection id is empty");
    return callConnectionProperties;
}

CommunicationIdentifier GetCommunicationTargetIdentifier()
{
    CommunicationIdentifier target = new PhoneNumberIdentifier(targetPhoneNumber);

    return target;
}

async Task HandlePlayAsync(CallMedia callConnectionMedia, string textToPlay, string context)
{
    var playSource = new TextSource(textToPlay)
    {
        VoiceName = "en-US-NancyNeural"
    };
    var playOptions = new PlayToAllOptions(playSource) { OperationContext = context };
    await callConnectionMedia.PlayToAllAsync(playOptions);
}

async Task<string> downloadRecording()
{
    string downloadsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
    var recordingDownloadUri = new Uri(contentLocation);
    string format = await GetFormat();
    string fileName = $"test.{format}";
    string path = Path.Combine(downloadsPath, fileName);

    var response = await callAutomationClient.GetCallRecording().DownloadToAsync(recordingDownloadUri, $"{downloadsPath}\\{fileName}");
    return path;
}

async Task<string> GetFormat()
{
    string format = string.Empty;
    var metaDataDownloadUri = new Uri(metadataLocation);
    var metaDataResponse = await callAutomationClient.GetCallRecording().DownloadStreamingAsync(metaDataDownloadUri);
    using (StreamReader streamReader = new StreamReader(metaDataResponse))
    {
        // Read the JSON content from the stream and parse it into an object
        string jsonContent = await streamReader.ReadToEndAsync();

        // Parse the JSON string
        JObject jsonObject = JObject.Parse(jsonContent);

        // Access the "format" value from the "recordingInfo" object
        format = (string)jsonObject["recordingInfo"]["format"];
    }
    return format;
}

async Task DownloadRecordingMetadata(ILogger<Program> logger)
{
    if (!string.IsNullOrEmpty(metadataLocation))
    {
        string downloadsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
        var recordingDownloadUri = new Uri(metadataLocation);
        var response = await callAutomationClient.GetCallRecording().DownloadToAsync(recordingDownloadUri, $"{downloadsPath}\\recordingMetadata.json");
    }
    else
    {
        logger.LogError("Metadata location is empty.");
    }
}

//This function will convert the speech to text from the recorded file
//Input parameter: the path of the recorded file
async Task<string> ConvertSpeechToText(string audioFilePath)
{
    var speechConfig = SpeechConfig.FromSubscription(CognitiveServicesKey, "eastus");
    speechConfig.OutputFormat = OutputFormat.Detailed;

    var stopRecognition = new TaskCompletionSource<int>();
    var recognizedText = string.Empty;
    AudioConfig audioConfig = null;
    var fileExtension = Path.GetExtension(audioFilePath).ToLower();

    if (fileExtension == ".wav")
    {
        audioConfig = AudioConfig.FromWavFileInput(audioFilePath);
    }
    //else if (fileExtension == ".mp3" || fileExtension == ".mp4")
    //{
    //    ConvertToWav(audioFilePath, "output.wav");
    //    audioConfig = AudioConfig.FromWavFileInput("output.wav");
    //}
    else if (fileExtension == ".mp3")
    {
        await ConvertMp3ToWav(audioFilePath, "output.wav");
        audioConfig = AudioConfig.FromWavFileInput("output.wav");
    }

    using var recognizer = new SpeechRecognizer(speechConfig, audioConfig);

    recognizer.Recognized += (s, e) =>
    {
        if (e.Result.Reason == ResultReason.RecognizedSpeech)
        {
            recognizedText += e.Result.Text + " ";
        }
        else if (e.Result.Reason == ResultReason.NoMatch)
        {
            recognizedText += "[No match recognized] ";
        }
    };

    recognizer.SessionStopped += (s, e) =>
    {
        stopRecognition.TrySetResult(0);
    };

    recognizer.Canceled += (s, e) =>
    {
        stopRecognition.TrySetResult(0);
    };

    await recognizer.StartContinuousRecognitionAsync();
    await stopRecognition.Task;
    await recognizer.StopContinuousRecognitionAsync();

    return recognizedText.Trim().Replace(".", "").Replace(",", "");
}

//This function will convert mp3 to wav which is supported by NAudio
async Task ConvertMp3ToWav(string inputFile, string outputFile)
{
    using (var reader = new Mp3FileReader(inputFile))
    using (var writer = new WaveFileWriter(outputFile, reader.WaveFormat))
    {
        reader.CopyTo(writer);
    }
}
static OpenAIClient getClient()
{
    return new OpenAIClient("OpenAIApiKey");
}

app.Run();