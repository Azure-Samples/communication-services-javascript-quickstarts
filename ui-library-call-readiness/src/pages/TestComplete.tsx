import { useTheme } from "@azure/communication-react";
import { Stack, Text } from "@fluentui/react";
import { CheckmarkCircle48Filled } from "@fluentui/react-icons";

/**
 * Final page to highlight the call readiness checks have completed.
 * Replace this with your own App's next stage.
 */
export const TestComplete = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: "1rem" }}>
      <CheckmarkCircle48Filled primaryFill={theme.palette.green} />
      <Text variant="xLarge">Call Readiness Complete</Text>
      <Text variant="medium">From here you can have the user join their call using their chosen settings.</Text>
    </Stack>
  );
};
