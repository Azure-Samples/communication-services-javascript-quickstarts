import { AudioDeviceInfo, DeviceAccess, Features, VideoDeviceInfo } from "@azure/communication-calling";
import { CallClientState, StatefulCallClient, StatefulDeviceManager, useCallClient, VideoStreamRendererViewState } from "@azure/communication-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Use the callClient's getEnvironmentInfo() method to check if the browser is supported. */
export const checkBrowserSupport = async (callClient: StatefulCallClient): Promise<boolean> =>
  (await callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedBrowser;

/**
 * Check if the user needs to be prompted for camera and microphone permissions.
 * 
 * @remarks
 * The Permissions API we are using is not supported in Firefox, Android WebView or Safari < 16.
 * In those cases this will return 'unknown'.
 */
export const checkDevicePermissionsState = async (): Promise<{camera: PermissionState, microphone: PermissionState} | 'unknown'> => {
  try {
    const [micPermissions, cameraPermissions] = await Promise.all([
      navigator.permissions.query({ name: "microphone" } as any),
      navigator.permissions.query({ name: "camera" } as any)
    ]);
    return { camera: cameraPermissions.state, microphone: micPermissions.state };
  } catch (e) {
    console.info("Permissions API unsupported", e);
    return 'unknown';
  }
}

/** Use the DeviceManager to request for permissions to access the camera and microphone. */
export const requestCameraAndMicrophonePermissions = async (callClient: StatefulCallClient): Promise<DeviceAccess> =>
  await (await callClient.getDeviceManager()).askDevicePermission({ audio: true, video: true });


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
  setSelectedSpeaker: (Speaker: AudioDeviceInfo) => Promise<void>
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
  startLocalPreview: any,
  stopLocalPreview: any
} => {
  const callClient = useCallClient();
  const state = useCallClientStateChange();
  const localPreview = state.deviceManager.unparentedViews[0];

  const startLocalPreview = useCallback(async (): Promise<VideoStreamRendererViewState | undefined> => {
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
const useCallClientStateChange = () => {
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
