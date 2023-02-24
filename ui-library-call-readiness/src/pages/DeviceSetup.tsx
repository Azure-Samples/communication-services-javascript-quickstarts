import { PrimaryButton, Stack } from '@fluentui/react';
import { useState } from 'react';
import { CameraSelectionDropdown, MicrophoneSelectionDropdown, SpeakerSelectionDropdown } from '../components/DeviceSelectionComponents';
import { LocalPreview } from '../components/LocalPreview';

/**
 * This page displays a dropdown for the user to select their camera, microphone, and speaker, alongside
 * a preview of their camera and microphone. The user can toggle their camera and microphone on and off.
 */
export const DeviceSetup = (props: {
  /** Callback to let the parent component know what the chosen user device settings were */
  onDeviceSetupComplete: (userChosenDeviceState: { cameraOn: boolean; microphoneOn: boolean }) => void
}): JSX.Element => {
  const [microphoneOn, setMicrophoneOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '1rem' }}>
      <Stack horizontal tokens={{ childrenGap: '2rem' }}>
        <Stack.Item>
          <LocalPreview
            cameraOn={cameraOn}
            microphoneOn={microphoneOn}
            cameraToggled={setCameraOn}
            microphoneToggled={setMicrophoneOn}
          />
        </Stack.Item>
        <Stack tokens={{ childrenGap: '1rem' }} verticalAlign="center" verticalFill>
          <CameraSelectionDropdown />
          <MicrophoneSelectionDropdown />
          <SpeakerSelectionDropdown />
          <Stack.Item styles={{ root: { paddingTop: '0.5rem' }}}>
            <PrimaryButton text="Continue" onClick={() => props.onDeviceSetupComplete({ cameraOn, microphoneOn })} />
          </Stack.Item>
        </Stack>
      </Stack>
    </Stack>
  );
};
