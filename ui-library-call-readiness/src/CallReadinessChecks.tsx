import { PreparingYourSession } from './components/PreparingYourSession';
import { useEffect, useState } from 'react';
import { BrowserUnsupportedModal } from './components/UnsupportedBrowserModal';
import { CheckingDeviceAccessPrompt, PermissionsDeniedPrompt, AcceptDevicePermissionRequestPrompt } from './components/DevicePermissionPrompts';
import { CallReadinessChecker } from './lib/CallReadinessChecker';

type CallReadinessChecksState = 'runningChecks' |
  'browserUnsupported' |
  'checkingDeviceAccess' |
  'promptingForDeviceAccess' |
  'deniedDeviceAccess' |
  'finished';

/**
 * This component is a demo of how to use the CallReadinessChecker with CallReadiness Components to get a user
 * ready to join a call.
 * This component checks the browser support and if camera and microphone permissions have been granted.
 */
const CallReadinessChecks = (props: {
  /**
   * Callback triggered when the tests are complete and successful
   */
  onTestsSuccessful: () => void
}): JSX.Element => {
  const [currentCheckState, setCurrentCheckState] = useState<CallReadinessChecksState>('runningChecks');

  // Run call readiness checks when component mounts
  useEffect(() => {
    const runCallReadinessChecks = async (): Promise<void> => {
      const callReadinessChecker = new CallReadinessChecker();

      // First we'll begin with a browser support check.
      const browserSupport = await callReadinessChecker.checkBrowserSupport();
      if (!browserSupport) {
        setCurrentCheckState('browserUnsupported');
        // If browser support fails, we'll stop here and display a modal to the user.
        return;
      }

      // Next we will check if we need to prompt the user for camera and microphone permissions.
      // The prompt check only works if the browser supports the PermissionAPI for querying camera and microphone.
      // In the event that is not supported, we show a more generic prompt to the user.
      const devicePermissionState = await callReadinessChecker.checkDevicePermissionsState();
      if (devicePermissionState === 'unknown') {
        // We don't know if we need to request camera and microphone permissions, so we'll show a generic prompt.
        setCurrentCheckState('checkingDeviceAccess');
      } else if (devicePermissionState.camera === 'prompt' || devicePermissionState.microphone === 'prompt') {
        // We know we need to request camera and microphone permissions, so we'll show the prompt.
        setCurrentCheckState('promptingForDeviceAccess');
      }

      // Now the user has an appropriate prompt, we can request camera and microphone permissions.
      const devicePermissionsState = await callReadinessChecker.requestCameraAndMicrophonePermissions();

      if (!devicePermissionsState.audio || !devicePermissionsState.video) {
        // If the user denied camera and microphone permissions, we prompt the user to take corrective action.
        setCurrentCheckState('deniedDeviceAccess');
      } else {
        setCurrentCheckState('finished');
        // Test finished successfully, trigger callback to parent component to take user to the next stage of the app.
        props.onTestsSuccessful();
      }
    };

    runCallReadinessChecks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {<PreparingYourSession callTitle='Meeting name' callDescription='Some details about the meeting' />}

      {/* We show this when the browser is unsupported */}
      <BrowserUnsupportedModal isOpen={currentCheckState === 'browserUnsupported'} />

      {/* We show this when we are prompting the user to accept device permissions */}
      <AcceptDevicePermissionRequestPrompt isOpen={currentCheckState === 'promptingForDeviceAccess'} />

      {/* We show this when the PermissionsAPI is not supported and we are checking what permissions the user has granted or denied */}
      <CheckingDeviceAccessPrompt isOpen={currentCheckState === 'checkingDeviceAccess'} />

      {/* We show this when the user has failed to grant camera and microphone access */}
      <PermissionsDeniedPrompt isOpen={currentCheckState === 'deniedDeviceAccess'} />
    </>
  );
}

export default CallReadinessChecks;
