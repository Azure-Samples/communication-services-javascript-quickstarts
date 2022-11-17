import { CallClient, DeviceAccess, Features } from "@azure/communication-calling";

/**
 * A helper class to perform call readiness related checks.
 *
 * Functionality:
 * - Check if the browser is supported.
 * - Check if the user should be prompted for camera and microphone permissions.
 * - Request camera and microphone permissions.
 */
export class CallReadinessChecker {
  private callClient: CallClient;

  /**
   * @param callClient use an existing callClient instance. If this is not supplied a new instance will be created.
   */
  constructor(callClient?: CallClient) {
    this.callClient = callClient || new CallClient();
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
}
