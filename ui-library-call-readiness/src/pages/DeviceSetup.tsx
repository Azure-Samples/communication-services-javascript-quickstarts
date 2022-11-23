import { AudioDeviceInfo, VideoDeviceInfo } from '@azure/communication-calling';
import { PrimaryButton, Stack } from '@fluentui/react';
import { useEffect, useState } from 'react';
import { CallReadinessHelper } from '../call-readiness/CallReadinessHelper';
import { CameraSelectionDropdown, MicrophoneSelectionDropdown, SpeakerSelectionDropdown } from '../call-readiness/DeviceSelectionComponents';
import { LocalPreview } from '../call-readiness/LocalPreview';

export const DeviceSetup = (props: {
  /** Callback to let the parent component know what the chosen user device settings were */
  onDeviceSetupComplete: (userChosenDeviceState: { cameraOn: boolean; microphoneOn: boolean }) => void
  callReadinessHelper: CallReadinessHelper;
}): JSX.Element => {
  const { callReadinessHelper } = props;
  const [microphones, setMicrophones] = useState<AudioDeviceInfo[]>(callReadinessHelper.getMicrophones());
  const [speakers, setSpeakers] = useState<AudioDeviceInfo[]>(callReadinessHelper.getSpeakers());
  const [cameras, setCameras] = useState<VideoDeviceInfo[]>(callReadinessHelper.getCameras());

  const onMicrophoneSelectionChange = (microphone: AudioDeviceInfo) => {
    callReadinessHelper.updateSelectedMicrophone(microphone);
  };
  const onSpeakerSelectionChange = (speaker: AudioDeviceInfo) => {
    callReadinessHelper.updateSelectedSpeaker(speaker);
  };
  const onCameraSelectionChange = (camera: VideoDeviceInfo) => {
    callReadinessHelper.updateSelectedCamera(camera);
  };

  useEffect(() => {
    // Ensure the device lists are up to date
    callReadinessHelper.populateInitialDeviceLists();

    // subscribe to changes when the user plugs in or unplugs a device
    callReadinessHelper.onCameraListChanged(setCameras);
    callReadinessHelper.onMicrophoneListChanged(setMicrophones);
    callReadinessHelper.onSpeakerListChanged(setSpeakers);
    return () => {
      callReadinessHelper.offCameraListChanged(setCameras);
      callReadinessHelper.offMicrophoneListChanged(setMicrophones);
      callReadinessHelper.offSpeakerListChanged(setSpeakers);
    }
  }, [callReadinessHelper]);

  const [microphoneOn, setMicrophoneOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '1rem' }}>
      <Stack horizontal tokens={{ childrenGap: '2rem' }}>
        <Stack.Item>
          <LocalPreview
            callReadinessHelper={callReadinessHelper}
            cameraOn={cameraOn}
            microphoneOn={microphoneOn}
            cameraToggled={setCameraOn}
            microphoneToggled={setMicrophoneOn}
          />
        </Stack.Item>
        <Stack tokens={{ childrenGap: '1rem' }} verticalAlign="center" verticalFill>
          <CameraSelectionDropdown cameras={cameras} onSelectionChange={onCameraSelectionChange} />
          <MicrophoneSelectionDropdown microphones={microphones} onSelectionChange={onMicrophoneSelectionChange} />
          <SpeakerSelectionDropdown speakers={speakers} onSelectionChange={onSpeakerSelectionChange} />
          <Stack.Item styles={{ root: { paddingTop: '0.5rem' }}}>
            <PrimaryButton text="Continue" onClick={() => props.onDeviceSetupComplete({ cameraOn, microphoneOn })} />
          </Stack.Item>
        </Stack>
      </Stack>
    </Stack>
  );
};
