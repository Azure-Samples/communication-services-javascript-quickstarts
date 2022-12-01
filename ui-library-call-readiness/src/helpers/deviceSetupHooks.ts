import { AudioDeviceInfo, VideoDeviceInfo } from "@azure/communication-calling";
import { CallClientState, StatefulDeviceManager, useCallClient, VideoStreamRendererViewState } from "@azure/communication-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** A helper hook to get and update microphone device information */
export const useMicrophones = (): {
  microphones: AudioDeviceInfo[],
  selectedMicrophone: AudioDeviceInfo | undefined,
  setSelectedMicrophone: (microphone: AudioDeviceInfo) => Promise<void>
} => {
  const callClient = useCallClient();
  useEffect(() => {
    callClient.getDeviceManager().then(deviceManager => deviceManager.getMicrophones())
  }, [callClient]);

  const setSelectedMicrophone = async (microphone: AudioDeviceInfo) =>
    (await callClient.getDeviceManager()).selectMicrophone(microphone);

  const state = useCallClientStateChange();
  return {
    microphones: state.deviceManager.microphones,
    selectedMicrophone: state.deviceManager.selectedMicrophone,
    setSelectedMicrophone
  };
}

/** A helper hook to get and update speaker device information */
export const useSpeakers = (): {
  speakers: AudioDeviceInfo[],
  selectedSpeaker: AudioDeviceInfo | undefined,
  setSelectedSpeaker: (speaker: AudioDeviceInfo) => Promise<void>
} => {
  const callClient = useCallClient();
  useEffect(() => {
    callClient.getDeviceManager().then(deviceManager => deviceManager.getSpeakers())
  }, [callClient]);

  const setSelectedSpeaker = async (speaker: AudioDeviceInfo) =>
    (await callClient.getDeviceManager()).selectSpeaker(speaker);

  const state = useCallClientStateChange();
  return {
    speakers: state.deviceManager.speakers,
    selectedSpeaker: state.deviceManager.selectedSpeaker,
    setSelectedSpeaker
  };
}

/** A helper hook to get and update camera device information */
export const useCameras = (): {
  cameras: VideoDeviceInfo[],
  selectedCamera: VideoDeviceInfo | undefined,
  setSelectedCamera: (camera: VideoDeviceInfo) => Promise<void>
} => {
  const callClient = useCallClient();
  useEffect(() => {
    callClient.getDeviceManager().then(deviceManager => deviceManager.getCameras())
  }, [callClient]);

  const setSelectedCamera = async (camera: VideoDeviceInfo) =>
    (await callClient.getDeviceManager() as StatefulDeviceManager).selectCamera(camera);

  const state = useCallClientStateChange();
  return {
    cameras: state.deviceManager.cameras,
    selectedCamera: state.deviceManager.selectedCamera,
    setSelectedCamera
  };
}

/** A helper hook to providing functionality to create a local video preview */
export const useLocalPreview = (): {
  localPreview: VideoStreamRendererViewState | undefined,
  startLocalPreview: () => Promise<void>,
  stopLocalPreview: () => void
} => {
  const callClient = useCallClient();
  const state = useCallClientStateChange();
  const localPreview = state.deviceManager.unparentedViews[0];

  const startLocalPreview = useCallback(async () => {
    const selectedCamera = state.deviceManager.selectedCamera;
    if (!selectedCamera) {
      console.warn('no camera selected to start preview with');
      return;
    }
    callClient.createView(
      undefined,
      undefined,
      {
        source: selectedCamera,
        mediaStreamType: 'Video'
      },
      {
        scalingMode: 'Crop'
      }
    );
  }, [callClient, state.deviceManager.selectedCamera]);

  const stopLocalPreview = useCallback(() => {
    if (!localPreview) {
      console.warn('no local preview ti dispose');
      return;
    }
    callClient.disposeView(undefined, undefined, localPreview)
  }, [callClient, localPreview]);

  const selectedCameraRef = useRef(state.deviceManager.selectedCamera);
  useEffect(() => {
    if (selectedCameraRef.current !== state.deviceManager.selectedCamera) {
      stopLocalPreview();
      startLocalPreview();
      selectedCameraRef.current = state.deviceManager.selectedCamera;
    }
  }, [startLocalPreview, state.deviceManager.selectedCamera, stopLocalPreview]);

  return {
    localPreview: localPreview?.view,
    startLocalPreview,
    stopLocalPreview
  }
}

/** A helper hook to act when changes to the stateful client occur */
const useCallClientStateChange = (): CallClientState => {
  const callClient = useCallClient();
  const [state, setState] = useState<CallClientState>(callClient.getState());
  useEffect(() => {
    const updateState = (newState: CallClientState) => {
      setState(newState);
    }
    callClient.onStateChange(updateState);
    return () => {
      callClient.offStateChange(updateState);
    };
  }, [callClient]);
  return state;
}
