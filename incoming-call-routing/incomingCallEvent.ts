import {
    CallConnectionStateChangedEvent,
    ToneReceivedEvent,
    PlayAudioResultEvent,
    AddParticipantResultEvent,
} from "@azure/communication-calling-server";

export type IncomingCallEvent = CallConnectionStateChangedEvent | ToneReceivedEvent | PlayAudioResultEvent | AddParticipantResultEvent | undefined;

export enum InternalEventTypeValue {
    InternalPlayAudioCompletedEvent = "Internal.PlayAudio.Completed",
    InternalPlayAudioRunningEvent = "Internal.PlayAudio.Running",
}
