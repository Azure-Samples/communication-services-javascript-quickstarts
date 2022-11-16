import { useTheme } from '@azure/communication-react';
import { Stack, Text } from '@fluentui/react';
import { CheckmarkCircle48Filled } from '@fluentui/react-icons';

export const TestComplete = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '1rem' }}>
      <CheckmarkCircle48Filled primaryFill={theme.palette.green} />
      <Text variant='xLarge'>Test Complete</Text>
    </Stack>
  );
};
