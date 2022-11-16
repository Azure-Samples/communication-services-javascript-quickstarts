import { CallClient, DeviceAccess } from "@azure/communication-calling";

export const checkBrowserSupport = async (callClient: CallClient): Promise<boolean> =>
  (await callClient.getEnvironmentInfo()).isSupportedBrowser;

/**
 * The Permissions API we are using is not supported in Firefox, Android WebView or Safari < 16.
 * In those cases this will return 'unknown'.
 */
export const shouldPromptForCameraAndMicrophonePermissions = async (): Promise<true | false | 'unknown'> => {
  try {
    const micPermissions = await navigator.permissions.query({ name: "microphone" } as any);
    const cameraPermissions = await navigator.permissions.query({ name: "camera" } as any);
    return micPermissions.state === "prompt" || cameraPermissions.state === "prompt";
  } catch (e) {
    console.log("Permissions API unsupported", e);
    return 'unknown';
  }
}

/**
 * Use the device manager to request for permissions to access the camera and microphone.
 */
export const requestCameraAndMicrophonePermissions = async (callClient: CallClient): Promise<DeviceAccess> =>
  await (await callClient.getDeviceManager()).askDevicePermission({ audio: true, video: true });
