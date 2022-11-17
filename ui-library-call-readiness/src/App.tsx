import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { useState } from 'react';
import { TestComplete } from './pages/TestComplete';
import CallReadinessChecks from './call-readiness/CallReadinessCheckComponent';
import { PreparingYourSession } from './pages/PreparingYourSession';

// Initializing and registering icons should only be done once per app.
initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

type TestingState = 'running' | 'finished';

/**
 * Entry point of a React app.
 *
 * This shows a PreparingYourSession component while the CallReadinessChecks are running.
 * Once the CallReadinessChecks are finished, the TestComplete component is shown.
 */
const App = (): JSX.Element => {
  const [testState, setTestState] = useState<TestingState>('running');

  return (
    <FluentThemeProvider>
      {/* Show a Preparing your session screen while running the call readiness checks */}
      {testState === 'running' && (
        <>
          <PreparingYourSession callTitle='Meeting name' callDescription='Some details about the meeting' />
          <CallReadinessChecks onTestsSuccessful={() => setTestState('finished')} />
        </>
      )}

      {/* Show a TestComplete screen when the call readiness checks are finished */}
      {testState === 'finished' && <TestComplete />}
    </FluentThemeProvider>
  );
}

export default App;
