import { CommunicationIdentifier } from "@azure/communication-common";

export interface OutStreamingData {
    kind: string;
    audioData: AudioData;
    stopAudio: StopAudio;
}

export interface AudioData {
    data: string;
    timestamp: string;
    isSilent: boolean;
    participant: CommunicationIdentifier | undefined;
}

export interface StopAudio {
}
