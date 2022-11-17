import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { PreparingYourSession } from './components/PreparingYourSession';
import { useEffect, useState } from 'react';
import { BrowserUnsupportedModal } from './components/UnsupportedBrowserModal';
import { TestComplete } from './components/TestComplete';
import { GenericPromptWhileCheckingDeviceAccessModal, PermissionsDeniedModal, PromptForDevicePermissionAccessModal } from './components/PromptForDevicePermissionAccessModal';
import { CallReadinessChecker } from './lib/CallReadinessChecker';

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

type TestingState = 'running' | 'finished';

const App = (): JSX.Element => {
  const [testState, setTestState] = useState<TestingState>('running');
  const [browserSupported, setBrowserSupported] = useState(true);
  const [displayPromptForRequestingDeviceAccess, setDisplayPromptForRequestingDeviceAccess] = useState(false);
  const [displayGenericPromptWhileCheckingDeviceAccess, setDisplayGenericPromptWhileCheckingDeviceAccess] = useState(false);
  const [cameraAndMicrophonePermissionsDenied, setCameraAndMicrophonePermissionsDenied] = useState(false);

  // Run call readiness checks
  useEffect(() => {
    const runCallReadinessChecks = async (): Promise<void> => {
      const callReadinessChecker = new CallReadinessChecker();

      // First we'll begin with a browser support check.
      const browserSupport = await callReadinessChecker.checkBrowserSupport();
      setBrowserSupported(browserSupport);

      // Next we will check if we need to prompt the user for camera and microphone permissions.
      // The prompt check only works if the browser supports the PermissionAPI for querying camera and microphone.
      // In the event that is not supported, we show a more generic prompt to the user.
      const devicePermissionState = await callReadinessChecker.checkDevicePermissionsState();
      if (devicePermissionState === 'unknown') {
        // We don't know if we need to request camera and microphone permissions, so we'll show a generic prompt.
        setDisplayGenericPromptWhileCheckingDeviceAccess(true);
      } else if (devicePermissionState.camera === 'prompt' || devicePermissionState.microphone === 'prompt') {
        // We know we need to request camera and microphone permissions, so we'll show the prompt.
        setDisplayPromptForRequestingDeviceAccess(true);
      }

      // Now the user has an appropriate prompt, we can request camera and microphone permissions.
      const devicePermissionsState = await callReadinessChecker.requestCameraAndMicrophonePermissions();

      // Remove previous prompts now the user has either accepted or denied device permission access.
      setDisplayPromptForRequestingDeviceAccess(false);
      setDisplayGenericPromptWhileCheckingDeviceAccess(false);

      if (!devicePermissionsState.audio || !devicePermissionsState.video) {
        // If the user denied camera and microphone permissions, we prompt the user to take corrective action.
        setCameraAndMicrophonePermissionsDenied(true);
      }

      setTestState('finished');
    };

    runCallReadinessChecks();
  }, []);

  const testSuccessfullyComplete = testState === 'finished' && browserSupported && !cameraAndMicrophonePermissionsDenied;
  return (
    <FluentThemeProvider>
      {!testSuccessfullyComplete && <PreparingYourSession callTitle='Meeting name' callDescription='Some details about the meeting' />}
      {testSuccessfullyComplete && <TestComplete />}

      {/* We show this when the browser is unsupported */}
      <BrowserUnsupportedModal isOpen={!browserSupported} />

      {/* We show this when we are prompting the user to accept device permissions */}
      <PromptForDevicePermissionAccessModal isOpen={displayPromptForRequestingDeviceAccess} />

      {/* We show this when the PermissionsAPI is not supported and we are checking what permissions the user has granted or denied */}
      <GenericPromptWhileCheckingDeviceAccessModal isOpen={displayGenericPromptWhileCheckingDeviceAccess} />

      {/* We show this when the user has failed to grant camera and microphone access */}
      <PermissionsDeniedModal isOpen={cameraAndMicrophonePermissionsDenied} />
    </FluentThemeProvider>
  );
}

export default App;
