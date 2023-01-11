import { CallClientProvider, createStatefulCallClient, FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { useState } from 'react';
import { PreCallChecksComponent } from './components/DeviceAccessChecksComponent';
import { PreparingYourSession } from './pages/PreparingYourSession';
import { DeviceSetup } from './pages/DeviceSetup';
import { TestComplete } from './pages/TestComplete';
import { EnvironmentChecksComponent } from './components/EnvironmentChecksComponent';

// Initializing and registering icons should only be done once per app.
initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

type TestingState = 'runningEnvironmentChecks' | 'runningDeviceAccessChecks' | 'deviceSetup' | 'finished';

// UserId is required for creating the stateful call client. In a production app this would not be `user id`, but instead
// retreived from a running service that can create Azure Communication Services users and credential tokens that have VOIP capabilities.
const USER_ID = 'user1';
const callClient = createStatefulCallClient({ userId: { communicationUserId: USER_ID } });

/**
 * Entry point of the React app.
 *
 * This shows a PreparingYourSession component while the CallReadinessChecks are running.
 * Once the CallReadinessChecks are finished, the TestComplete component is shown.
 */
const App = (): JSX.Element => {
  const [testState, setTestState] = useState<TestingState>('runningEnvironmentChecks');

  return (
    <FluentThemeProvider>
      <CallClientProvider callClient={callClient}>
        {testState === 'runningEnvironmentChecks' && (
          <>
            <PreparingYourSession />
            <EnvironmentChecksComponent onTestsSuccessful={() => setTestState('runningDeviceAccessChecks')} />
          </>
        )}
        
        {/* Show a Preparing your session screen while running the call readiness checks */}
        {testState === 'runningDeviceAccessChecks' && (
          <>
            <PreparingYourSession />
            <PreCallChecksComponent onTestsSuccessful={() => setTestState('deviceSetup')} />
          </>
        )}

        {/* After the initial checks are complete, take the user to a device setup page call readiness checks are finished */}
        {testState === 'deviceSetup' && (
          <DeviceSetup
            onDeviceSetupComplete={(userChosenDeviceState) => {
              console.log('Device setup complete', userChosenDeviceState);
              setTestState('finished');
            }}
          />
        )}

        {/* After the device setup is complete, take the user to the call. For this sample we will just show a test complete page. */}
        {testState === 'finished' && <TestComplete />}
      </CallClientProvider>
    </FluentThemeProvider>
  );
}

export default App;
