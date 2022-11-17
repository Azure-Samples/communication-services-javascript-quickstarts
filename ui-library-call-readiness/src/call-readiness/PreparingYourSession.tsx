import { useTheme } from '@azure/communication-react';
import { ISpinnerStyles, IStackItemStyles, IStackStyles, ITextStyles, ITheme, Spinner, Stack, Text } from '@fluentui/react';

export const PreparingYourSession = (props: { callTitle?: string; callDescription?: string }): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack verticalFill verticalAlign="center" horizontalAlign="center" tokens={{ childrenGap: '3rem' }}>
      {props.callTitle && (
        <Stack.Item>
          <Stack horizontalAlign="center" tokens={{ childrenGap: '1rem' }}>
            <Stack.Item styles={callTitleContainerStyles}>
              <Text styles={headingStyles} variant="large">
                {props.callTitle}
              </Text>
            </Stack.Item>
            {props.callDescription && (
              <Stack.Item styles={callDetailsContainerStyles}>
                <Text variant="medium">{props.callDescription}</Text>
              </Stack.Item>
            )}
          </Stack>
        </Stack.Item>
      )}
      <Stack.Item>
        <Stack horizontalAlign="center" tokens={{ childrenGap: '2rem' }} styles={preparingYourSessionStyles}>
          <Stack.Item>
            <Stack styles={spinnerContainerStyles(theme)}>
              <Spinner styles={spinnerStyles} />
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack horizontalAlign="center">
              <Stack.Item>
                <Text styles={headingStyles} variant="large">
                  Preparing your session
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text variant="medium">Please be patient</Text>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Stack.Item>
    </Stack>
  );
};

const preparingYourSessionStyles: IStackItemStyles = {
  root: {
    paddingTop: '2rem',
    paddingBottom: '3rem'
  }
};

const callTitleContainerStyles: IStackItemStyles = {
  root: {
    marginLeft: '2rem',
    marginRight: '2rem',
    maxWidth: '40rem',
    textAlign: 'center'
  }
};

const callDetailsContainerStyles: IStackItemStyles = {
  root: {
    marginLeft: '2rem',
    marginRight: '2rem',
    maxWidth: '40rem',
    textAlign: 'center',

    // Support ellipsis for long text
    display: 'block',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',

    // For browsers that support it, have multiple lines of text before ellipsis kicks in
    '@supports (-webkit-line-clamp: 2)': {
      display: '-webkit-box',
      whiteSpace: 'initial',
      '-webkit-line-clamp': '4',
      '-webkit-box-orient': 'vertical'
    }
  }
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
