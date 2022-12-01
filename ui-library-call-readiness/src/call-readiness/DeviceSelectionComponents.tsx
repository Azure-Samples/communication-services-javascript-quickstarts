import { Dropdown } from '@fluentui/react';
import { useEffect, useState } from 'react';
import { useCameras, useMicrophones, useSpeakers } from './CallReadinessHelpers';

export const CameraSelectionDropdown = (): JSX.Element => {
  const { cameras, selectedCamera, setSelectedCamera } = useCameras();
  return (
    <DeviceSelectionDropdown
      placeholder={cameras.length === 0 ? 'No cameras found' : 'Select a camera'}
      label={'Camera'}
      devices={cameras}
      selectedDevice={selectedCamera}
      onSelectionChange={(selectedDeviceId) =>
        setSelectedCamera(cameras.find((camera) => camera.id === selectedDeviceId)!)
      }
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
      onSelectionChange={(selectedDeviceId) =>
        setSelectedMicrophone(microphones.find((microphone) => microphone.id === selectedDeviceId)!)
      }
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
      onSelectionChange={(selectedDeviceId) =>
        setSelectedSpeaker(speakers.find((speaker) => speaker.id === selectedDeviceId)!)
      }
    />
  );
};

const DeviceSelectionDropdown = (props: {
  placeholder: string,
  label: string,
  devices: { id: string, name: string }[],
  selectedDevice: { id: string, name: string } | undefined,
  onSelectionChange: (deviceId: string) => void
}): JSX.Element => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();

  // Improve the user selection by preselecting a device.
  // When the devices are populated, select the first one as the default selected device.
  useEffect(() => {
    if (!selectedDeviceId && props.devices.length > 0) {
      const selectedDeviceId = props.devices[0].id;
      setSelectedDeviceId(selectedDeviceId);
      props.onSelectionChange(selectedDeviceId);
    }
  }, [props, selectedDeviceId]);

  return (
    <Dropdown
      placeholder={props.placeholder}
      label={props.label}
      onChange={(_, option) => {
        if (option) {
          setSelectedDeviceId(option.key as string);
          props.onSelectionChange?.(option.key as string)
        }
      }}
      options={props.devices.map((device) => ({ key: device.id, text: device.name }))}
      selectedKey={selectedDeviceId}
    />
  );
};
