import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons, Stack } from '@fluentui/react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import { PreparingYourSession } from './components/PreparingYourSession';

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

const App = (): JSX.Element => {

  const runningTests = true;

  return (
    <FluentThemeProvider>
      {runningTests && <PreparingYourSession callTitle='Meeting name' callDescription='Some details about the meeting' />}
      {!runningTests && <Stack>Test complete</Stack>}
    </FluentThemeProvider>
  );
}

export default App;
