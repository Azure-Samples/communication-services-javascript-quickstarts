import { useEffect, useState } from 'react';
import { BrowserUnsupportedPrompt, BrowserVersionUnsupportedPrompt, OperatingSystemUnsupportedPrompt } from './UnsupportedEnvironmentPrompts';
import { CheckingDeviceAccessPrompt, PermissionsDeniedPrompt, AcceptDevicePermissionRequestPrompt } from './DevicePermissionPrompts';
import { useCallClient } from '@azure/communication-react';
import { checkBrowserSupport } from '../helpers/browserSupportUtils';
import { checkDevicePermissionsState, requestCameraAndMicrophonePermissions } from '../helpers/devicePermissionUtils';

export type DevicesAccessChecksState = 'runningDeviceAccessChecks' |
  'runningDeviceAccessChecks' |
  'checkingDeviceAccess' |
  'promptingForDeviceAccess' |
  'deniedDeviceAccess';

/**
 * This component is a demo of how to use the StatefulCallClient with CallReadiness Components to get a user
 * ready to join a call.
 * This component checks the browser support and if camera and microphone permissions have been granted.
 */
export const PreCallChecksComponent = (props: {
  /**
   * Callback triggered when the tests are complete and successful
   */
  onTestsSuccessful: () => void
}): JSX.Element => {
  const [currentCheckState, setCurrentCheckState] = useState<DevicesAccessChecksState>('runningDeviceAccessChecks');
  

  // Run call readiness checks when component mounts
  const callClient = useCallClient();
  useEffect(() => {
    const runCallReadinessChecks = async (): Promise<void> => {

      // Next we will check if we need to prompt the user for camera and microphone permissions.
      // The prompt check only works if the browser supports the PermissionAPI for querying camera and microphone.
      // In the event that is not supported, we show a more generic prompt to the user.
      const devicePermissionState = await checkDevicePermissionsState();
      if (devicePermissionState === 'unknown') {
        // We don't know if we need to request camera and microphone permissions, so we'll show a generic prompt.
        setCurrentCheckState('checkingDeviceAccess');
      } else if (devicePermissionState.camera === 'prompt' || devicePermissionState.microphone === 'prompt') {
        // We know we need to request camera and microphone permissions, so we'll show the prompt.
        setCurrentCheckState('promptingForDeviceAccess');
      }

      // Now the user has an appropriate prompt, we can request camera and microphone permissions.
      const devicePermissionsState = await requestCameraAndMicrophonePermissions(callClient);

      if (!devicePermissionsState.audio || !devicePermissionsState.video) {
        // If the user denied camera and microphone permissions, we prompt the user to take corrective action.
        setCurrentCheckState('deniedDeviceAccess');
      } else {
        // Test finished successfully, trigger callback to parent component to take user to the next stage of the app.
        props.onTestsSuccessful();
      }
    };

    runCallReadinessChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* We show this when we are prompting the user to accept device permissions */}
      <AcceptDevicePermissionRequestPrompt isOpen={currentCheckState === 'promptingForDeviceAccess'} />

      {/* We show this when the PermissionsAPI is not supported and we are checking what permissions the user has granted or denied */}
      <CheckingDeviceAccessPrompt isOpen={currentCheckState === 'checkingDeviceAccess'} />

      {/* We show this when the user has failed to grant camera and microphone access */}
      <PermissionsDeniedPrompt isOpen={currentCheckState === 'deniedDeviceAccess'} />
    </>
  );
}
