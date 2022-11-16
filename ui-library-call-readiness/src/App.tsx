import { FluentThemeProvider } from '@azure/communication-react';
import { initializeIcons, registerIcons, Stack } from '@fluentui/react';
import React from 'react';
import {
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

const App = (): JSX.Element => {
  return (
    <FluentThemeProvider>
      <Stack>
      </Stack>
    </FluentThemeProvider>
  );
}

export default App;
