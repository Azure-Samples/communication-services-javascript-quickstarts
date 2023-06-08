declare module Root {
    export interface AudioConfiguration {
        sampleRate: number;
        bitRate: number;
        channels: number;
    }

    export interface VideoConfiguration {
        longerSideLength: number;
        shorterSideLength: number;
        framerate: number;
        bitRate: number;
    }

    export interface RecordingInfo {
        contentType: string;
        channelType: string;
        format: string;
        audioConfiguration: AudioConfiguration;
        videoConfiguration: VideoConfiguration;
    }

    export interface Participant {
        participantId: string;
    }

    export interface RootObject {
        resourceId: string;
        callId: string;
        chunkDocumentId: string;
        chunkIndex: number;
        chunkStartTime: Date;
        chunkDuration: number;
        pauseResumeIntervals: any[];
        recordingInfo: RecordingInfo;
        participants: Participant[];
    }
}

export default Root