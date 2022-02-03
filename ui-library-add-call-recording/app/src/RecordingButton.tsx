import { CustomCallControlButtonCallback, CustomCallControlButtonCallbackArgs } from "@azure/communication-react";
import { Record20Regular, RecordStop20Filled } from "@fluentui/react-icons";
import { startRecording, stopRecording } from "./Api";

export const recordingButtonPropsCallback = (serverCallId: string, recordingId: string, setRecordingId: (recordingId: string) => void): CustomCallControlButtonCallback => {
    return (args: CustomCallControlButtonCallbackArgs) => ({
        placement: 'afterCameraButton',
        showLabel: true,
        labelKey: 'recordingButtonLabel',
        strings: {
            offLabel: "Start Recording",
            onLabel: "Stop Recording",
            tooltipOffContent: "Start Recording",
            tooltipOnContent: "Stop Recording",
        },
        onRenderOffIcon: (): JSX.Element => (<Record20Regular />),
        onRenderOnIcon: (): JSX.Element => (<RecordStop20Filled />),
        checked: !!recordingId,
        onClick: async () => {
            if (!serverCallId) {
                console.warn('Recording buton: No serverCallId yet!');
                return;
            }

            if (!!recordingId) {
                // stop the recording
                await stopRecording({ serverCallId, recordingId });
                setRecordingId('');
                return
            }

            // start the recording
            const { recordingId: newRecordingId } = await startRecording({ serverCallId });
            setRecordingId(newRecordingId);
        }
    });
}
