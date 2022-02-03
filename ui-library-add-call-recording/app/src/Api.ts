export interface StartRecordingRequest {
    serverCallId: string;
}
export interface StartRecordingResponse {
    recordingId: string;
}

export const startRecording = async (req: StartRecordingRequest): Promise<StartRecordingResponse> => {
    const response = await (
        await fetch(`/api/startRecording`, {
            method: "POST",
            body: JSON.stringify({ serverCallId: req.serverCallId }),
        })
    ).json();
    console.log(`Started recording for ${req.serverCallId}: ${response['recordingId']}`);
    return { recordingId: response['recordingId'] };
}

export interface StopRecordingRequest {
    serverCallId: string;
    recordingId: string;
}

export const stopRecording = async (req: StopRecordingRequest): Promise<void> => {
    await fetch(`/api/stopRecording`, {
        method: "POST",
        body: JSON.stringify({ serverCallId: req.serverCallId, recordingId: req.recordingId }),
    })
    console.log(`Stopped recording for ${req.serverCallId}: ${req.recordingId}`);
}