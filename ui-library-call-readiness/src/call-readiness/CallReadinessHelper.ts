import { AudioDeviceInfo, DeviceAccess, Features, VideoDeviceInfo } from "@azure/communication-calling";
import { StatefulCallClient, StatefulDeviceManager, VideoStreamRendererViewState } from "@azure/communication-react";

/**
 * A helper class to perform call readiness related checks and behavior.
 *
 * Functionality:
 * - Check if the browser is supported.
 * - Check if the user should be prompted for camera and microphone permissions.
 * - Request camera and microphone permissions.
 */
export class CallReadinessHelper {
  private callClient: StatefulCallClient;

  /**
   * @param callClient use an existing callClient instance. If this is not supplied a new instance will be created.
   */
  constructor(callClient: StatefulCallClient) {
    this.callClient = callClient;
  }

  /**
   * Use the callClient's getEnvironmentInfo() method to check if the browser is supported.
   */
  public checkBrowserSupport = async (): Promise<boolean> =>
    (await this.callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedBrowser;

  /**
   * Check if the user needs to be prompted for camera and microphone permissions.
   * 
   * @remarks
   * The Permissions API we are using is not supported in Firefox, Android WebView or Safari < 16.
   * In those cases this will return 'unknown'.
   */
  public checkDevicePermissionsState = async (): Promise<{camera: PermissionState, microphone: PermissionState} | 'unknown'> => {
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

  /**
   * Use the DeviceManager to request for permissions to access the camera and microphone.
   */
  public requestCameraAndMicrophonePermissions = async (): Promise<DeviceAccess> =>
    await (await this.callClient.getDeviceManager()).askDevicePermission({ audio: true, video: true });

  /**
   * Getting device information is an asynchronous operation. This method will return a promise that resolves when the device information has been retrieved.
   * After which you can use the getCameraList() and getMicrophoneList() methods to get the device information.
   */
  public populateInitialDeviceLists = async (): Promise<void> => {
    const deviceManager = await this.callClient.getDeviceManager();
    await Promise.all([
      deviceManager.getCameras(),
      deviceManager.getMicrophones(),
      deviceManager.getSpeakers(),
    ]);
  }

  /** Get cameras devices. Recommended to have called populateInitialDeviceLists once before calling this. */
  public getCameras = (): VideoDeviceInfo[] => this.callClient.getState().deviceManager.cameras;
  /** Get microphones devices. Recommended to have called populateInitialDeviceLists once before calling this. */
  public getMicrophones = (): AudioDeviceInfo[] => this.callClient.getState().deviceManager.microphones;
  /** Get speaker devices. Recommended to have called populateInitialDeviceLists once before calling this. */
  public getSpeakers = (): AudioDeviceInfo[] => this.callClient.getState().deviceManager.speakers;

  /** Update the call client's currently selected microphone. */
  public updateSelectedMicrophone = async (microphone: AudioDeviceInfo): Promise<void> => {
    const deviceManager = (await this.callClient.getDeviceManager()) as StatefulDeviceManager;
    return deviceManager.selectMicrophone(microphone);
  }
  /** Update the call client's currently selected speaker. */
  public updateSelectedSpeaker = async (speaker: AudioDeviceInfo): Promise<void> => {
    const deviceManager = (await this.callClient.getDeviceManager()) as StatefulDeviceManager;
    return deviceManager.selectSpeaker(speaker);
  }
  /** Update the call client's currently selected camera. */
  public updateSelectedCamera = async (camera: VideoDeviceInfo | undefined): Promise<void> => {
    const deviceManager = (await this.callClient.getDeviceManager()) as StatefulDeviceManager;
    deviceManager.selectCamera(camera);
  }

  /** Subscribe to be notified when the microphone device lists change. */
  public onMicrophoneListChanged = (listener: (devices: AudioDeviceInfo[]) => void): void => {
    this.callClient.onStateChange((state) => {
      listener(state.deviceManager.microphones);
    });
  }
  /** Subscribe to be notified when the speaker device list changes. */
  public onSpeakerListChanged = (listener: (devices: AudioDeviceInfo[]) => void): void => {
    this.callClient.onStateChange((state) => {
      listener(state.deviceManager.speakers);
    });
  }
  /** Subscribe to be notified when the camera device list changes. */
  public onCameraListChanged = (listener: (devices: VideoDeviceInfo[]) => void): void => {
    this.callClient.onStateChange((state) => {
      listener(state.deviceManager.cameras);
    });
  }

  /** Unsubscribe to being notified when the microphone device lists change. */
  public offMicrophoneListChanged = (listener: (devices: AudioDeviceInfo[]) => void): void => {
    this.callClient.offStateChange((state) => {
      listener(state.deviceManager.microphones);
    });
  }
  /** Unsubscribe to being notified when the speaker device lists change. */
  public offSpeakerListChanged = (listener: (devices: AudioDeviceInfo[]) => void): void => {
    this.callClient.offStateChange((state) => {
      listener(state.deviceManager.speakers);
    });
  }
  /** Unsubscribe to being notified when the camera device lists change. */
  public offCameraListChanged = (listener: (devices: VideoDeviceInfo[]) => void): void => {
    this.callClient.offStateChange((state) => {
      listener(state.deviceManager.cameras);
    });
  }

  private previousCameraSelectedId: string | undefined;
  public onCameraSelectionChanged = (listener: (device: VideoDeviceInfo | undefined) => void): void => {
    this.callClient.onStateChange((state) => {
      if (state.deviceManager.selectedCamera?.id !== this.previousCameraSelectedId) {
        this.previousCameraSelectedId = state.deviceManager.selectedCamera?.id;
        listener(state.deviceManager.selectedCamera);
      }
    });
  }

  public offCameraSelectionChanged = (listener: (device: VideoDeviceInfo | undefined) => void): void => {
    this.callClient.offStateChange((state) => {
      listener(state.deviceManager.selectedCamera);
    });
  }

  public startLocalPreview = async (): Promise<VideoStreamRendererViewState | undefined> => {
    const selectedCamera = this.callClient.getState().deviceManager.selectedCamera;
    if (!selectedCamera) {
      console.warn('no camera selected to start preview with');
      return;
    }

    const createViewResult = await this.callClient.createView(
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

    return createViewResult?.view;
  }

  public stopAllLocalPreviews = (): void => {
    const unparentedViews = this.callClient.getState().deviceManager.unparentedViews;
    for (const view of unparentedViews) {
      this.callClient.disposeView(undefined, undefined, view);
    }
  }
}
