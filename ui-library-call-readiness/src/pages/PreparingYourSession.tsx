import { useTheme } from '@azure/communication-react';
import { ISpinnerStyles, IStackStyles, ITextStyles, ITheme, Spinner, Stack, Text } from '@fluentui/react';

/** This page displays a spinner to the user. This is used to show the user that background checks are being performed. */
export const PreparingYourSession = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '3rem' }}>
      <Stack styles={spinnerContainerStyles(theme)}>
        <Spinner styles={spinnerStyles} />
      </Stack>
      <Stack horizontalAlign="center">
        <Text styles={headingStyles} variant="large">Preparing your session</Text>
        <Text variant="medium">Please be patient</Text>
      </Stack>
    </Stack>
  );
};

const headingStyles: ITextStyles = {
  root: {
    fontWeight: '600',
    lineHeight: '2rem'
  }
};

const spinnerStyles: ISpinnerStyles = {
  circle: {
    height: '2.75rem',
    width: '2.75rem',
    borderWidth: '0.2rem'
  }
};

const spinnerContainerStyles = (theme: ITheme): IStackStyles => ({
  root: {
    padding: '1.75rem',
    borderRadius: '50%',
    background: theme.palette?.themeLighterAlt
  }
});
