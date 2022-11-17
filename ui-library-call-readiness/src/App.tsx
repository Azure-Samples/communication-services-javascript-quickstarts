import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { useState } from 'react';
import { TestComplete } from './TestComplete';
import CallReadinessChecks from './call-readiness/CallReadinessCheckComponent';

// Initializing and registering icons should only be done once per app.
initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

type TestingState = 'running' | 'finished';

/**
 * Entry point of a React app.
 * This spawns the CallReadinessChecks.
 */
const App = (): JSX.Element => {
  const [testState, setTestState] = useState<TestingState>('running');

  return (
    <FluentThemeProvider>
      {testState === 'running' && <CallReadinessChecks onTestsSuccessful={() => setTestState('finished')} />}
      {testState === 'finished' && <TestComplete />}
    </FluentThemeProvider>
  );
}

export default App;
