import { DeviceAccess } from "@azure/communication-calling";
import { StatefulCallClient } from "@azure/communication-react";

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
      navigator.permissions.query({ name: "microphone" as PermissionName }),
      navigator.permissions.query({ name: "camera" as PermissionName })
    ]);
    console.info('PermissionAPI results', [micPermissions, cameraPermissions]); // view console logs in the browser to see what the PermissionsAPI info is returned
    return { camera: cameraPermissions.state, microphone: micPermissions.state };
  } catch (e) {
    console.warn("Permissions API unsupported", e);
    return 'unknown';
  }
}

/** Use the DeviceManager to request for permissions to access the camera and microphone. */
export const requestCameraAndMicrophonePermissions = async (callClient: StatefulCallClient): Promise<DeviceAccess> => {
  const response = await (await callClient.getDeviceManager()).askDevicePermission({ audio: true, video: true });
  console.info('AskDevicePermission response', response); // view console logs in the browser to see what device access info is returned
  return response
}
