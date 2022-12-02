import { Dropdown } from '@fluentui/react';
import { useCameras, useMicrophones, useSpeakers } from '../helpers/deviceSetupHooks';

export const CameraSelectionDropdown = (): JSX.Element => {
  const { cameras, selectedCamera, setSelectedCamera } = useCameras();
  return (
    <DeviceSelectionDropdown
      placeholder={cameras.length === 0 ? 'No cameras found' : 'Select a camera'}
      label={'Camera'}
      devices={cameras}
      selectedDevice={selectedCamera}
      onSelectionChange={(selectedDeviceId) => {
        const newlySelectedCamera = cameras.find((camera) => camera.id === selectedDeviceId);
        if (newlySelectedCamera) {
          setSelectedCamera(newlySelectedCamera);
        }
      }}
    />
  );
};

export const MicrophoneSelectionDropdown = (): JSX.Element => {
  const { microphones, selectedMicrophone, setSelectedMicrophone } = useMicrophones();
  return (
    <DeviceSelectionDropdown
      placeholder={microphones.length === 0 ? 'No microphones found' : 'Select a microphone'}
      label={'Microphone'}
      devices={microphones}
      selectedDevice={selectedMicrophone}
      onSelectionChange={(selectedDeviceId) => {
        const newlySelectedMicrophone = microphones.find((microphone) => microphone.id === selectedDeviceId);
        if (newlySelectedMicrophone) {
          setSelectedMicrophone(newlySelectedMicrophone);
        }
      }}
    />
  );
};

export const SpeakerSelectionDropdown = (): JSX.Element => {
  const { speakers, selectedSpeaker, setSelectedSpeaker } = useSpeakers();
  return (
    <DeviceSelectionDropdown
      placeholder={speakers.length === 0 ? 'No speakers found' : 'Select a speaker'}
      label={'Speaker'}
      devices={speakers}
      selectedDevice={selectedSpeaker}
      onSelectionChange={(selectedDeviceId) => {
        const newlySelectedSpeaker = speakers.find((speaker) => speaker.id === selectedDeviceId);
        if (newlySelectedSpeaker) {
          setSelectedSpeaker(newlySelectedSpeaker);
        }
      }}
    />
  );
};

const DeviceSelectionDropdown = (props: {
  placeholder: string,
  label: string,
  devices: { id: string, name: string }[],
  selectedDevice: { id: string, name: string } | undefined,
  onSelectionChange: (deviceId: string | undefined) => void
}): JSX.Element => {
  return (
    <Dropdown
      placeholder={props.placeholder}
      label={props.label}
      options={props.devices.map((device) => ({ key: device.id, text: device.name }))}
      selectedKey={props.selectedDevice?.id}
      onChange={(_, option) => props.onSelectionChange?.(option?.key as string | undefined)}
    />
  );
};
