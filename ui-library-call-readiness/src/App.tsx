import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { PreparingYourSession } from './components/PreparingYourSession';
import { useEffect, useState } from 'react';
import { checkBrowserSupport } from './utils/callReadinessChecks';
import { BrowserUnsupportedModal } from './components/UnsupportedBrowserModal';
import { CallClient } from '@azure/communication-calling';
import { TestComplete } from './components/TestComplete';

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

type AppState = 'runningTests' | 'testsComplete';

const App = (): JSX.Element => {
  const [appState, setAppState] = useState<AppState>('runningTests');
  const [browserSupported, setBrowserSupported] = useState(true);

  // Run call readiness checks
  useEffect(() => {
    const runCallReadinessChecks = async (): Promise<void> => {
      // For simplicity we are constructing a new CallClient instance here.
      // In a production application you should reuse the same instance of CallClient that you are using for your call.
      const callClient = new CallClient();
      const browserSupport = await checkBrowserSupport(callClient);
      setBrowserSupported(browserSupport);
      setAppState('testsComplete');
    };

    runCallReadinessChecks();
  }, []);

  return (
    <FluentThemeProvider>
      {appState === 'runningTests' && <PreparingYourSession callTitle='Meeting name' callDescription='Some details about the meeting' />}
      {appState === 'testsComplete' && <TestComplete />}

      {browserSupported === false && <BrowserUnsupportedModal />}
    </FluentThemeProvider>
  );
}

export default App;
