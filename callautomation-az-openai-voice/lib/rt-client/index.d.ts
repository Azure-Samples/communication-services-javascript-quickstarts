type AzureStandardVoice = {
    type: "azure-standard";
    name: string;
    temperature?: number;
};
type AzureCustomVoice = {
    type: "azure-custom";
    name: string;
    endpoint_id: string;
    temperature?: number;
};
type Voice = "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | AzureStandardVoice | AzureCustomVoice;
type AudioFormat = "pcm16" | "g711-ulaw" | "g711-alaw";
type Modality = "text" | "audio";
interface NoTurnDetection {
    type: "none";
}
interface ServerVAD {
    type: "server_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
}
interface AzureSemanticVAD {
    type: "azure_semantic_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
    remove_filler_words?: boolean;
    end_of_utterance_detection?: EOUDetection;
}
type TurnDetection = ServerVAD | AzureSemanticVAD | null;
interface AzureEOU {
    model: "semantic_detection_v1";
    threshold?: number;
}
type EOUDetection = AzureEOU | null;
interface FunctionToolChoice {
    type: "function";
    function: string;
}
type ToolChoice = "auto" | "none" | "required" | FunctionToolChoice;
type MessageRole = "system" | "assistant" | "user";
interface InputAudioTranscription {
    model: "whisper-1" | "gpt-4o-transcribe" | "azure-fast-transcription";
    language?: string;
    prompt?: string;
}
interface AvatarConfigVideoParams {
    bitrate?: number;
    codec: "h264";
    crop?: {
        bottom_right: [number, number];
        top_left: [number, number];
    };
    resolution?: {
        width: number;
        height: number;
    };
}
interface AvatarConfig {
    ice_servers?: RTCIceServer[];
    character: string;
    style?: string;
    customized?: boolean;
    video?: AvatarConfigVideoParams;
}
interface ClientMessageBase {
    event_id?: string;
}
type ToolsDefinition = Record<string, any>[];
interface ServerEchoCancellation {
    type: "server_echo_cancellation";
}
interface AzureDeepNoiseSuppression {
    type: "azure_deep_noise_suppression";
}
type InputAudioEchoCancellation = ServerEchoCancellation | null;
type InputAudioNoiseReduction = AzureDeepNoiseSuppression | null;
interface SessionUpdateParams {
    model?: string;
    modalities?: Modality[];
    voice?: Voice;
    instructions?: string;
    input_audio_format?: AudioFormat;
    output_audio_format?: AudioFormat;
    input_audio_transcription?: InputAudioTranscription | null;
    turn_detection?: TurnDetection;
    tools?: ToolsDefinition;
    tool_choice?: ToolChoice;
    temperature?: number;
    max_response_output_tokens?: number;
    avatar?: AvatarConfig;
    input_audio_noise_reduction?: InputAudioNoiseReduction;
    input_audio_echo_cancellation?: InputAudioEchoCancellation;
}
interface SessionUpdateMessage extends ClientMessageBase {
    type: "session.update";
    session: SessionUpdateParams;
}
interface InputAudioBufferAppendMessage extends ClientMessageBase {
    type: "input_audio_buffer.append";
    audio: string;
}
interface InputAudioBufferCommitMessage extends ClientMessageBase {
    type: "input_audio_buffer.commit";
}
interface InputAudioBufferClearMessage extends ClientMessageBase {
    type: "input_audio_buffer.clear";
}
declare const MessageItemType: "message";
type MessageItemType = typeof MessageItemType;
interface InputTextContentPart {
    type: "input_text";
    text: string;
}
interface InputAudioContentPart {
    type: "input_audio";
    audio: string;
    transcript?: string;
}
interface OutputTextContentPart {
    type: "text";
    text: string;
}
type SystemContentPart = InputTextContentPart;
type UserContentPart = InputTextContentPart | InputAudioContentPart;
type AssistantContentPart = OutputTextContentPart;
type ItemParamStatus = "completed" | "incomplete";
interface SystemMessageItem {
    type: MessageItemType;
    role: "system";
    id?: string;
    content: SystemContentPart[];
    status?: ItemParamStatus;
}
interface UserMessageItem {
    type: MessageItemType;
    role: "user";
    id?: string;
    content: UserContentPart[];
    status?: ItemParamStatus;
}
interface AssistantMessageItem {
    type: MessageItemType;
    role: "assistant";
    id?: string;
    content: AssistantContentPart[];
    status?: ItemParamStatus;
}
type MessageItem = SystemMessageItem | UserMessageItem | AssistantMessageItem;
interface FunctionCallItem {
    type: "function_call";
    id?: string;
    name: string;
    call_id: string;
    arguments: string;
    status?: ItemParamStatus;
}
interface FunctionCallOutputItem {
    type: "function_call_output";
    id?: string;
    call_id: string;
    output: string;
    status?: ItemParamStatus;
}
type Item = MessageItem | FunctionCallItem | FunctionCallOutputItem;
interface ItemCreateMessage extends ClientMessageBase {
    type: "conversation.item.create";
    previous_item_id?: string;
    item: Item;
}
interface ItemTruncateMessage extends ClientMessageBase {
    type: "conversation.item.truncate";
    item_id: string;
    content_index: number;
    audio_end_ms: number;
}
interface ItemDeleteMessage extends ClientMessageBase {
    type: "conversation.item.delete";
    item_id: string;
}
interface ResponseCreateParams {
    commit?: boolean;
    cancel_previous?: boolean;
    append_input_items?: Item[];
    input_items?: Item[];
    instructions?: string;
    modalities?: Modality[];
    voice?: Voice;
    temperature?: number;
    max_output_tokens?: number;
    tools?: ToolsDefinition;
    tool_choice?: ToolChoice;
    output_audio_format?: AudioFormat;
}
interface ResponseCreateMessage extends ClientMessageBase {
    type: "response.create";
    response?: ResponseCreateParams;
}
interface ResponseCancelMessage extends ClientMessageBase {
    type: "response.cancel";
}
interface SessionAvatarConnectMessage extends ClientMessageBase {
    type: "session.avatar.connect";
    client_sdp: string;
}
interface RealtimeError {
    message: string;
    type?: string;
    code?: string;
    param?: string;
    event_id?: string;
}
interface ServerMessageBase {
    event_id: string;
}
interface ErrorMessage extends ServerMessageBase {
    type: "error";
    error: RealtimeError;
}
interface Session {
    id: string;
    model: string;
    modalities: Modality[];
    instructions: string;
    voice: Voice;
    input_audio_format: AudioFormat;
    output_audio_format: AudioFormat;
    input_audio_transcription?: InputAudioTranscription;
    turn_detection: TurnDetection;
    tools: ToolsDefinition;
    tool_choice: ToolChoice;
    temperature: number;
    max_response_output_tokens?: number;
    avatar?: AvatarConfig;
    input_audio_noise_reduction?: InputAudioNoiseReduction;
    input_audio_echo_cancellation?: InputAudioEchoCancellation;
}
interface SessionCreatedMessage extends ServerMessageBase {
    type: "session.created";
    session: Session;
}
interface SessionUpdatedMessage extends ServerMessageBase {
    type: "session.updated";
    session: Session;
}
interface InputAudioBufferCommittedMessage extends ServerMessageBase {
    type: "input_audio_buffer.committed";
    previous_item_id?: string;
    item_id: string;
}
interface InputAudioBufferClearedMessage extends ServerMessageBase {
    type: "input_audio_buffer.cleared";
}
interface InputAudioBufferSpeechStartedMessage extends ServerMessageBase {
    type: "input_audio_buffer.speech_started";
    audio_start_ms: number;
    item_id: string;
}
interface InputAudioBufferSpeechStoppedMessage extends ServerMessageBase {
    type: "input_audio_buffer.speech_stopped";
    audio_end_ms: number;
    item_id: string;
}
type ResponseItemStatus = "in_progress" | "completed" | "incomplete";
interface ResponseItemInputTextContentPart {
    type: "input_text";
    text: string;
}
interface ResponseItemInputAudioContentPart {
    type: "input_audio";
    transcript?: string;
}
interface ResponseItemTextContentPart {
    type: "text";
    text: string;
}
interface ResponseItemAudioContentPart {
    type: "audio";
    transcript?: string;
}
type ResponseItemContentPart = ResponseItemInputTextContentPart | ResponseItemInputAudioContentPart | ResponseItemTextContentPart | ResponseItemAudioContentPart;
interface ResponseItemBase {
    id?: string;
}
interface ResponseMessageItem extends ResponseItemBase {
    type: MessageItemType;
    status: ResponseItemStatus;
    role: MessageRole;
    content: ResponseItemContentPart[];
}
interface ResponseFunctionCallItem extends ResponseItemBase {
    type: "function_call";
    status: ResponseItemStatus;
    name: string;
    call_id: string;
    arguments: string;
}
interface ResponseFunctionCallOutputItem extends ResponseItemBase {
    type: "function_call_output";
    call_id: string;
    output: string;
}
type ResponseItem = ResponseMessageItem | ResponseFunctionCallItem | ResponseFunctionCallOutputItem;
interface ItemCreatedMessage extends ServerMessageBase {
    type: "conversation.item.created";
    previous_item_id?: string;
    item: ResponseItem;
}
interface ItemTruncatedMessage extends ServerMessageBase {
    type: "conversation.item.truncated";
    item_id: string;
    content_index: number;
    audio_end_ms: number;
}
interface ItemDeletedMessage extends ServerMessageBase {
    type: "conversation.item.deleted";
    item_id: string;
}
interface ItemInputAudioTranscriptionCompletedMessage extends ServerMessageBase {
    type: "conversation.item.input_audio_transcription.completed";
    item_id: string;
    content_index: number;
    transcript: string;
}
interface ItemInputAudioTranscriptionFailedMessage extends ServerMessageBase {
    type: "conversation.item.input_audio_transcription.failed";
    item_id: string;
    content_index: number;
    error: RealtimeError;
}
type ResponseStatus = "in_progress" | "completed" | "cancelled" | "incomplete" | "failed";
interface ResponseCancelledDetails {
    type: "cancelled";
    reason: "turn_detected" | "client_cancelled";
}
interface ResponseIncompleteDetails {
    type: "incomplete";
    reason: "max_output_tokens" | "content_filter";
}
interface ResponseFailedDetails {
    type: "failed";
    error: RealtimeError;
}
type ResponseStatusDetails = ResponseCancelledDetails | ResponseIncompleteDetails | ResponseFailedDetails;
interface InputTokenDetails {
    cached_tokens: number;
    text_tokens: number;
    audio_tokens: number;
}
interface OutputTokenDetails {
    text_tokens: number;
    audio_tokens: number;
}
interface Usage {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_token_details: InputTokenDetails;
    output_token_details: OutputTokenDetails;
}
interface Response {
    id: string;
    status: ResponseStatus;
    status_details?: ResponseStatusDetails;
    output: ResponseItem[];
    usage?: Usage;
}
interface ResponseCreatedMessage extends ServerMessageBase {
    type: "response.created";
    response: Response;
}
interface ResponseDoneMessage extends ServerMessageBase {
    type: "response.done";
    response: Response;
}
interface ResponseOutputItemAddedMessage extends ServerMessageBase {
    type: "response.output_item.added";
    response_id: string;
    output_index: number;
    item: ResponseItem;
}
interface ResponseOutputItemDoneMessage extends ServerMessageBase {
    type: "response.output_item.done";
    response_id: string;
    output_index: number;
    item: ResponseItem;
}
interface ResponseContentPartAddedMessage extends ServerMessageBase {
    type: "response.content_part.added";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    part: ResponseItemContentPart;
}
interface ResponseContentPartDoneMessage extends ServerMessageBase {
    type: "response.content_part.done";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    part: ResponseItemContentPart;
}
interface ResponseTextDeltaMessage extends ServerMessageBase {
    type: "response.text.delta";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    delta: string;
}
interface ResponseTextDoneMessage extends ServerMessageBase {
    type: "response.text.done";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    text: string;
}
interface ResponseAudioTranscriptDeltaMessage extends ServerMessageBase {
    type: "response.audio_transcript.delta";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    delta: string;
}
interface ResponseAudioTranscriptDoneMessage extends ServerMessageBase {
    type: "response.audio_transcript.done";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    transcript: string;
}
interface ResponseAudioDeltaMessage extends ServerMessageBase {
    type: "response.audio.delta";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    delta: string;
}
interface ResponseAudioDoneMessage extends ServerMessageBase {
    type: "response.audio.done";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
}
interface ResponseFunctionCallArgumentsDeltaMessage extends ServerMessageBase {
    type: "response.function_call_arguments.delta";
    response_id: string;
    item_id: string;
    output_index: number;
    call_id: string;
    delta: string;
}
interface ResponseFunctionCallArgumentsDoneMessage extends ServerMessageBase {
    type: "response.function_call_arguments.done";
    response_id: string;
    item_id: string;
    output_index: number;
    call_id: string;
    name: string;
    arguments: string;
}
interface RateLimits {
    name: string;
    limit: number;
    remaining: number;
    reset_seconds: number;
}
interface RateLimitsUpdatedMessage extends ServerMessageBase {
    type: "rate_limits.updated";
    rate_limits: RateLimits[];
}
interface SessionAvatarConnectingMessage extends ServerMessageBase {
    type: "session.avatar.connecting";
    server_sdp: string;
}
interface ResponseBlendShapeMessage extends ServerMessageBase {
    type: "response.animation.blendshapes";
    response_id: string;
    item_id: string;
    output_index: number;
    content_index: number;
    blendshapes: string;
}
type UserMessageType = SessionUpdateMessage | InputAudioBufferAppendMessage | InputAudioBufferCommitMessage | InputAudioBufferClearMessage | ItemCreateMessage | ItemTruncateMessage | ItemDeleteMessage | ResponseCreateMessage | ResponseCancelMessage | SessionAvatarConnectMessage;
type ServerMessageType = ErrorMessage | SessionCreatedMessage | SessionUpdatedMessage | InputAudioBufferCommittedMessage | InputAudioBufferClearedMessage | InputAudioBufferSpeechStartedMessage | InputAudioBufferSpeechStoppedMessage | ItemCreatedMessage | ItemTruncatedMessage | ItemDeletedMessage | ItemInputAudioTranscriptionCompletedMessage | ItemInputAudioTranscriptionFailedMessage | ResponseCreatedMessage | ResponseDoneMessage | ResponseOutputItemAddedMessage | ResponseOutputItemDoneMessage | ResponseContentPartAddedMessage | ResponseContentPartDoneMessage | ResponseTextDeltaMessage | ResponseTextDoneMessage | ResponseAudioTranscriptDeltaMessage | ResponseAudioTranscriptDoneMessage | ResponseAudioDeltaMessage | ResponseAudioDoneMessage | ResponseBlendShapeMessage | ResponseFunctionCallArgumentsDeltaMessage | ResponseFunctionCallArgumentsDoneMessage | RateLimitsUpdatedMessage | SessionAvatarConnectingMessage;

interface KeyCredential {
    key: string;
}
interface AccessToken {
    token: string;
    expiresOnTimestamp: number;
    refreshAfterTimestamp?: number;
}
interface TokenCredential {
    getToken(scopes: string | string[], options?: unknown): Promise<AccessToken>;
}

interface RTOpenAIOptions {
    model: string;
}
interface RTAzureOpenAIOptions {
    deployment: string;
    requestId?: string;
    apiVersion?: string;
    path?: string;
}
interface AzureAgentConfig {
    agentId: string;
    agentConnectionString: string;
    agentAuthenticationIdentityClientId?: string;
    agentAccessToken?: string;
    threadId?: string;
}
interface RTVoiceAgentOptions {
    modelOrAgent: string | AzureAgentConfig;
    profile?: string;
    requestId?: string;
    apiVersion?: string;
    path?: string;
}

type ReceiveFunction<T> = () => Promise<T | null>;
type ResolveFn<T> = (value: T | null) => void;
type RejectFn<E> = (reason: E) => void;
type Predicate<T> = (message: T) => boolean;
declare class MessageQueue<T> {
    private receiveDelegate;
    private messages;
    protected waitingReceivers: [
        Predicate<T>,
        [
            ResolveFn<T>,
            RejectFn<Error>
        ],
        AbortController
    ][];
    private isPolling;
    private pollPromise;
    constructor(receiveDelegate: ReceiveFunction<T>);
    protected pushBack(message: T): void;
    private findAndRemove;
    private pollReceive;
    private doPollReceive;
    private notifyError;
    private notifyEndOfStream;
    protected notifyReceiver(message: T): void;
    queuedMessageCount(): number;
    receive(predicate: Predicate<T>, abort?: AbortController): Promise<T | null>;
}
declare class MessageQueueWithError<T> extends MessageQueue<T> {
    private errorPredicate;
    private error?;
    constructor(receiveDelegate: ReceiveFunction<T>, errorPredicate: (message: T) => boolean);
    private notifyErrorMessage;
    protected notifyReceiver(message: T): void;
    receive(predicate: (message: T) => boolean): Promise<T | null>;
}

declare class LowLevelRTClient {
    requestId: string | undefined;
    private client;
    private getWebsocket;
    constructor(credential: KeyCredential, options: RTOpenAIOptions);
    constructor(uri: URL, credential: KeyCredential | TokenCredential, options: RTAzureOpenAIOptions | RTVoiceAgentOptions);
    messages(): AsyncIterable<ServerMessageType>;
    send(message: UserMessageType): Promise<void>;
    close(): Promise<void>;
}
declare class RTError extends Error {
    private errorDetails;
    constructor(errorDetails: RealtimeError);
    get code(): string | undefined;
    get param(): string | undefined;
    get eventId(): string | undefined;
}
type Optional<T> = T | undefined;
declare class RTInputAudioItem {
    readonly id: string;
    audioStartMillis: Optional<number>;
    private hasTranscription;
    private queue;
    type: "input_audio";
    audioEndMillis: Optional<number>;
    transcription: Optional<string>;
    private waitPromise;
    private constructor();
    static create(id: string, audioStartMillis: Optional<number>, hasTranscription: boolean, queue: MessageQueueWithError<ServerMessageType>): RTInputAudioItem;
    private wait;
    waitForCompletion(): Promise<void>;
}

declare class RTAudioContent {
    private queue;
    type: "audio";
    itemId: string;
    contentIndex: number;
    private part;
    private contentQueue;
    private constructor();
    static create(message: ResponseContentPartAddedMessage, queue: MessageQueueWithError<ServerMessageType>): RTAudioContent;
    get transcript(): Optional<string>;
    private receiveContent;
    audioChunks(): AsyncIterable<Uint8Array>;
    transcriptChunks(): AsyncIterable<string>;
}

declare class RTTextContent {
    private queue;
    type: "text";
    itemId: string;
    contentIndex: number;
    private part;
    private constructor();
    static create(message: ResponseContentPartAddedMessage, queue: MessageQueueWithError<ServerMessageType>): RTTextContent;
    get text(): string;
    textChunks(): AsyncIterable<string>;
}

type RTMessageContent = RTAudioContent | RTTextContent;
declare class RTMessageItem implements AsyncIterable<RTMessageContent> {
    responseId: string;
    private item;
    previousItemId: Optional<string>;
    private queue;
    type: "message";
    private constructor();
    static create(responseId: string, item: ResponseMessageItem, previousItemId: Optional<string>, queue: MessageQueueWithError<ServerMessageType>): RTMessageItem;
    get id(): string;
    get role(): MessageRole;
    get status(): ResponseItemStatus;
    [Symbol.asyncIterator](): AsyncGenerator<RTAudioContent | RTTextContent, void, unknown>;
}

declare class RTFunctionCallItem implements AsyncIterable<string> {
    responseId: string;
    private item;
    previousItemId: Optional<string>;
    private queue;
    type: "function_call";
    private awaited;
    private iterated;
    private constructor();
    static create(responseId: string, item: ResponseFunctionCallItem, previousItemId: Optional<string>, queue: MessageQueueWithError<ServerMessageType>): RTFunctionCallItem;
    get id(): string;
    get functionName(): string;
    get callId(): string;
    get arguments(): string;
    private inner;
    [Symbol.asyncIterator](): AsyncIterator<string>;
    waitForCompletion(): Promise<void>;
}

type RTOutputItem = RTMessageItem | RTFunctionCallItem;
declare function isMessageItem(item: RTOutputItem): item is RTMessageItem;
declare function isFunctionCallItem(item: RTOutputItem): item is RTFunctionCallItem;
declare class RTResponse implements AsyncIterable<RTOutputItem> {
    private response;
    private queue;
    private client;
    type: "response";
    private done;
    private constructor();
    static create(response: Response, queue: MessageQueueWithError<ServerMessageType>, client: LowLevelRTClient): RTResponse;
    get id(): string;
    get status(): ResponseStatus;
    get statusDetails(): Optional<ResponseStatusDetails>;
    get output(): ResponseItem[];
    get usage(): Optional<Usage>;
    cancel(): Promise<void>;
    [Symbol.asyncIterator](): AsyncIterator<RTOutputItem>;
}

declare class RTClient {
    private client;
    private messageQueue;
    private messagesIterable;
    session: Session | undefined;
    private initPromise;
    private iterating;
    constructor(credential: KeyCredential, options: RTOpenAIOptions);
    constructor(uri: URL, credential: KeyCredential | TokenCredential, options: RTAzureOpenAIOptions | RTVoiceAgentOptions);
    private receiveMessages;
    get requestId(): string | undefined;
    init(): Promise<void>;
    configure(params: SessionUpdateParams): Promise<Session>;
    sendAudio(audio: Uint8Array): Promise<void>;
    commitAudio(): Promise<RTInputAudioItem>;
    clearAudio(): Promise<void>;
    connectAvatar(client_sdp: RTCSessionDescription): Promise<RTCSessionDescription>;
    sendItem(item: Item, previousItemId?: string): Promise<ResponseItem>;
    removeItem(itemId: string): Promise<void>;
    generateResponse(): Promise<RTResponse | undefined>;
    events(): AsyncIterable<RTInputAudioItem | RTResponse>;
    close(): Promise<void>;
}

export { type AccessToken, type AssistantContentPart, type AssistantMessageItem, type AudioFormat, type AvatarConfig, type AvatarConfigVideoParams, type AzureCustomVoice, type AzureEOU, type AzureSemanticVAD, type AzureStandardVoice, type ClientMessageBase, type EOUDetection, type ErrorMessage, type FunctionCallItem, type FunctionCallOutputItem, type FunctionToolChoice, type InputAudioBufferAppendMessage, type InputAudioBufferClearMessage, type InputAudioBufferClearedMessage, type InputAudioBufferCommitMessage, type InputAudioBufferCommittedMessage, type InputAudioBufferSpeechStartedMessage, type InputAudioBufferSpeechStoppedMessage, type InputAudioContentPart, type InputAudioEchoCancellation, type InputAudioNoiseReduction, type InputAudioTranscription, type InputTextContentPart, type Item, type ItemCreateMessage, type ItemCreatedMessage, type ItemDeleteMessage, type ItemDeletedMessage, type ItemInputAudioTranscriptionCompletedMessage, type ItemInputAudioTranscriptionFailedMessage, type ItemParamStatus, type ItemTruncateMessage, type ItemTruncatedMessage, type KeyCredential, LowLevelRTClient, type MessageItem, MessageItemType, type MessageRole, type Modality, type NoTurnDetection, type OutputTextContentPart, RTAudioContent, type RTAzureOpenAIOptions, RTClient, RTError, RTFunctionCallItem, RTInputAudioItem, type RTMessageContent, RTMessageItem, type RTOpenAIOptions, RTResponse, RTTextContent, type RateLimits, type RateLimitsUpdatedMessage, type RealtimeError, type Response, type ResponseAudioDeltaMessage, type ResponseAudioDoneMessage, type ResponseAudioTranscriptDeltaMessage, type ResponseAudioTranscriptDoneMessage, type ResponseBlendShapeMessage, type ResponseCancelMessage, type ResponseCancelledDetails, type ResponseContentPartAddedMessage, type ResponseContentPartDoneMessage, type ResponseCreateMessage, type ResponseCreateParams, type ResponseCreatedMessage, type ResponseDoneMessage, type ResponseFailedDetails, type ResponseFunctionCallArgumentsDeltaMessage, type ResponseFunctionCallArgumentsDoneMessage, type ResponseFunctionCallItem, type ResponseFunctionCallOutputItem, type ResponseIncompleteDetails, type ResponseItem, type ResponseItemAudioContentPart, type ResponseItemBase, type ResponseItemContentPart, type ResponseItemInputAudioContentPart, type ResponseItemInputTextContentPart, type ResponseItemStatus, type ResponseItemTextContentPart, type ResponseMessageItem, type ResponseOutputItemAddedMessage, type ResponseOutputItemDoneMessage, type ResponseStatus, type ResponseStatusDetails, type ResponseTextDeltaMessage, type ResponseTextDoneMessage, type ServerMessageBase, type ServerMessageType, type ServerVAD, type Session, type SessionAvatarConnectMessage, type SessionAvatarConnectingMessage, type SessionCreatedMessage, type SessionUpdateMessage, type SessionUpdateParams, type SessionUpdatedMessage, type SystemContentPart, type SystemMessageItem, type TokenCredential, type ToolChoice, type ToolsDefinition, type TurnDetection, type Usage, type UserContentPart, type UserMessageItem, type UserMessageType, type Voice, isFunctionCallItem, isMessageItem };
//# sourceMappingURL=index.d.ts.map
