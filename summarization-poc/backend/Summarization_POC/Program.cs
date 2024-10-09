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
using NAudio.Wave;
using Newtonsoft.Json.Linq;
using Summarization_POC;
using Summarization_POC.Model;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "CorsPolicy",
                      policy =>
                      {
                          policy.AllowAnyOrigin()
                                .AllowAnyMethod()
                                .AllowAnyHeader();
                      });
});

/* Read config values from appsettings.json*/
var acsConnectionString = builder.Configuration.GetValue<string>("AcsConnectionString");
ArgumentNullException.ThrowIfNullOrEmpty(acsConnectionString);

var cognitiveServiceEndpoint = builder.Configuration.GetValue<string>("CognitiveServiceEndpoint");
ArgumentNullException.ThrowIfNullOrEmpty(cognitiveServiceEndpoint);

var transportUrl = builder.Configuration.GetValue<string>("TransportUrl");
ArgumentNullException.ThrowIfNullOrEmpty(transportUrl);

var acsPhoneNumber = builder.Configuration.GetValue<string>("AcsPhoneNumber");
ArgumentNullException.ThrowIfNullOrEmpty(acsPhoneNumber);


var callbackUriHost = builder.Configuration.GetValue<string>("CallbackUriHost");
ArgumentNullException.ThrowIfNullOrEmpty(callbackUriHost);

var targetPhoneNumber = builder.Configuration.GetValue<string>("TargetPhoneNumber");
ArgumentNullException.ThrowIfNullOrEmpty(targetPhoneNumber);

var participantPhoneNumber = builder.Configuration.GetValue<string>("ParticipantPhoneNumber");
ArgumentNullException.ThrowIfNullOrEmpty(participantPhoneNumber);

var bringYourOwnStorageUrl = builder.Configuration.GetValue<string>("BringYourOwnStorageUrl");
ArgumentNullException.ThrowIfNullOrEmpty(bringYourOwnStorageUrl);

var cognitiveServicesKey = builder.Configuration.GetValue<string>("CognitiveServicesKey");
ArgumentNullException.ThrowIfNullOrEmpty(cognitiveServicesKey);

var openAIEndPoint = builder.Configuration.GetValue<string>("OpenAIEndPoint");
ArgumentNullException.ThrowIfNullOrEmpty(openAIEndPoint);

var openAIKey = builder.Configuration.GetValue<string>("OpenAIKey");
ArgumentNullException.ThrowIfNullOrEmpty(openAIKey);

var openAiModelName = builder.Configuration.GetValue<string>("OpenAiModelName");
ArgumentNullException.ThrowIfNullOrEmpty(openAiModelName);

//Call back URL
var callbackUri = new Uri(new Uri(callbackUriHost), "/api/callbacks");

string callConnectionId = string.Empty;
string recordingId = string.Empty;
string metadataLocation = string.Empty;
string contentLocation = string.Empty;
string filePath = string.Empty;
string transcription = string.Empty;
string recordingPrompt = "Recording is Started.";
string getBriefSummarySystemPrompt = "You are an AI assist, listening to the conversation between the users.";
string getBriefSummaryUserPrompt = "From the conversation generate a brief summary of the discussion. Please provide a concise summary highlighting the main points and any important details. If possible, include any key quotes or statements made during the recording.";
bool isBYOS = false;

CallAutomationClient callAutomationClient = new CallAutomationClient(acsConnectionString);
var helper = new Helper();
var openAIClient = new OpenAIClient(new Uri(openAIEndPoint), new AzureKeyCredential(openAIKey));
builder.Services.AddSingleton(openAIClient);
var app = builder.Build();
app.UseHttpsRedirection();
app.UseRouting();

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

    TranscriptionOptions transcriptionOptions = new TranscriptionOptions(new Uri(transportUrl),
        "en-us", true, TranscriptionTransport.Websocket);

    var createCallOptions = new CreateCallOptions(callInvite, callbackUri)
    {
        CallIntelligenceOptions = new CallIntelligenceOptions() { CognitiveServicesEndpoint = new Uri(cognitiveServiceEndpoint) },
        TranscriptionOptions = transcriptionOptions
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

            TranscriptionOptions transcriptionOptions = new TranscriptionOptions(new Uri(transportUrl),
                "en-us", true, TranscriptionTransport.Websocket);

            var options = new AnswerCallOptions(incomingCallContext, callbackUri)
            {
                CallIntelligenceOptions = new CallIntelligenceOptions
                {
                    CognitiveServicesEndpoint = new Uri(cognitiveServiceEndpoint),
                },
                TranscriptionOptions = transcriptionOptions
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
app.MapPost("/addParticipant", async (ILogger<Program> logger) =>
{
    var response = await AddParticipantAsync();
    return Results.Ok(response);
});

app.MapPost("/removeParticipant", async (ILogger<Program> logger) =>
{
    var response = await RemoveParticipantAsync();
    return Results.Ok(response);
});

app.MapPost("/playMedia", async (bool isPlayToAll, ILogger<Program> logger) =>
{
    Console.WriteLine(isPlayToAll);
    await PlayMediaAsync(isPlayToAll);
    return Results.Ok();
});

app.MapPost("/startRecording", async (RecordingRequest recordingRequest, ILogger<Program> logger) =>
{
    isBYOS = recordingRequest.IsByos;
    await StartRecordingAsync(recordingRequest, logger);
    return Results.Ok();
});

app.MapPost("/stopRecording", async (ILogger<Program> logger) =>
{
    await StopRecordingAsync(logger);
    return Results.Ok();
});

app.MapPost("/summarize", async (ILogger<Program> logger) =>
{
    var transcript = string.Empty;
    //var state = await GetRecordingState(recordingId, logger);
    if (string.IsNullOrEmpty(recordingId) || await GetRecordingState(recordingId, logger) == "active")
    {
        transcript = helper.LiveTranscription();
    }
    else
    {
        transcript = await ConvertSpeechToText(filePath);
        logger.LogInformation("Get a Brief summary of the conversation");
    }
    var chatCompletionsOptions = new ChatCompletionsOptions()
    {
        Messages =
                   {
                        new ChatMessage(ChatRole.System, getBriefSummarySystemPrompt),
                        new ChatMessage(ChatRole.User, transcript),
                        new ChatMessage(ChatRole.User, getBriefSummaryUserPrompt)
                    },
        Temperature = (float)1,
        MaxTokens = 800
    };

    Response<StreamingChatCompletions> chatResponse = await openAIClient.GetChatCompletionsStreamingAsync(
     deploymentOrModelName: openAiModelName, chatCompletionsOptions);
    using StreamingChatCompletions streamingChatCompletions = chatResponse.Value;
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
    return Results.Ok(responseMessage);
});

app.MapPost("/disConnectCall", async (ILogger<Program> logger) =>
{
    var callConnection = callAutomationClient.GetCallConnection(callConnectionId);
    await callConnection.HangUpAsync(true);
    return Results.Ok();
});
async Task<AddParticipantResult> AddParticipantAsync()
{
    CallInvite callInvite;

    CallConnection callConnection = callAutomationClient.GetCallConnection(callConnectionId);

    string operationContext = "addPSTNUserContext";
    callInvite = new CallInvite(new PhoneNumberIdentifier(participantPhoneNumber),
              new PhoneNumberIdentifier(acsPhoneNumber));

    var addParticipantOptions = new AddParticipantOptions(callInvite)
    {
        OperationContext = operationContext,
        InvitationTimeoutInSeconds = 30,
        OperationCallbackUri = callbackUri
    };

    return await callConnection.AddParticipantAsync(addParticipantOptions);
}

async Task<RemoveParticipantResult> RemoveParticipantAsync()
{
    CallConnection callConnection = callAutomationClient.GetCallConnection(callConnectionId);

    string operationContext = "removePSTNUserContext";
    var removeParticipantOptions = new RemoveParticipantOptions(new PhoneNumberIdentifier(targetPhoneNumber))
    {
        OperationContext = operationContext,
        OperationCallbackUri = callbackUri
    };

    return await callConnection.RemoveParticipantAsync(removeParticipantOptions);
}

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

async Task StartRecordingAsync(RecordingRequest recordingRequest, ILogger<Program> logger)
{
    CallMedia callMedia = GetCallMedia();
    CallConnectionProperties callConnectionProperties = GetCallConnectionProperties();
    StartRecordingOptions recordingOptions = new StartRecordingOptions(new ServerCallLocator(callConnectionProperties.ServerCallId))
    {
        RecordingContent = recordingRequest.RecordingContent,
        RecordingChannel = recordingRequest.RecordingChannel,
        RecordingFormat = recordingRequest.RecordingFormat,
        RecordingStorage = recordingRequest.IsByos && !string.IsNullOrEmpty(bringYourOwnStorageUrl) ? RecordingStorage.CreateAzureBlobContainerRecordingStorage(new Uri(bringYourOwnStorageUrl)) : null
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
    var speechConfig = SpeechConfig.FromSubscription(cognitiveServicesKey, "eastus");
    speechConfig.OutputFormat = OutputFormat.Detailed;
    var stopRecognition = new TaskCompletionSource<int>();
    var recognizedText = string.Empty;
    AudioConfig audioConfig = null;
    var fileExtension = Path.GetExtension(audioFilePath).ToLower();

    if (fileExtension == ".wav")
    {
        audioConfig = AudioConfig.FromWavFileInput(audioFilePath);
    }
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
async Task<string> GetRecordingState(string recordingId, ILogger<Program> logger)
{
    try
    {
        var result = await callAutomationClient.GetCallRecording().GetStateAsync(recordingId);
        string state = result.Value.RecordingState.ToString();
        logger.LogInformation($"Recording Status:->  {state}");
        logger.LogInformation($"Recording Type:-> {result.Value.RecordingKind.ToString()}");
        return state;
    }
    catch (Exception ex)
    {
        return "inactive";
    }
}
app.UseCors("CorsPolicy");
app.UseWebSockets();
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/ws")
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
            await helper.ProcessRequest(webSocket);
        }
        else
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
    else
    {
        await next(context);
    }
});

app.Run();