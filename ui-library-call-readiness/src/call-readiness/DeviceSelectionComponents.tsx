import { AudioDeviceInfo, VideoDeviceInfo } from '@azure/communication-calling';
import { Dropdown } from '@fluentui/react';
import { useEffect, useState } from 'react';

export const CameraSelectionDropdown = (props: {
  cameras: VideoDeviceInfo[],
  onSelectionChange: (camera: VideoDeviceInfo) => void
}): JSX.Element => {
  return (
    <DeviceSelectionDropdown
      placeholder={props.cameras.length === 0 ? 'No cameras found' : 'Select a camera'}
      label={'Camera'}
      devices={props.cameras}
      onSelectionChange={(selectedDeviceId) =>
        props.onSelectionChange(props.cameras.find((camera) => camera.id === selectedDeviceId)!)
      }
    />
  );
};

export const MicrophoneSelectionDropdown = (props: {
  microphones: AudioDeviceInfo[],
  onSelectionChange: (microphone: AudioDeviceInfo) => void
}): JSX.Element => {
  return (
    <DeviceSelectionDropdown
      placeholder={props.microphones.length === 0 ? 'No microphones found' : 'Select a microphone'}
      label={'Microphone'}
      devices={props.microphones}
      onSelectionChange={(selectedDeviceId) =>
        props.onSelectionChange(props.microphones.find((microphone) => microphone.id === selectedDeviceId)!)
      }
    />
  );
};

export const SpeakerSelectionDropdown = (props: {
  speakers: AudioDeviceInfo[],
  onSelectionChange: (speaker: AudioDeviceInfo) => void
}): JSX.Element => {
  return (
    <DeviceSelectionDropdown
      placeholder={props.speakers.length === 0 ? 'No speakers found' : 'Select a speaker'}
      label={'Speaker'}
      devices={props.speakers}
      onSelectionChange={(selectedDeviceId) =>
        props.onSelectionChange(props.speakers.find((speaker) => speaker.id === selectedDeviceId)!)
      }
    />
  );
};

export const DeviceSelectionDropdown = (props: {
  placeholder: string,
  label: string,
  devices: { id: string, name: string }[],
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
