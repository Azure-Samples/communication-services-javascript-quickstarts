// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { MessageThread, SendBox, usePropsFor } from '@azure/communication-react';
import { Stack } from '@fluentui/react';

function ChatComponents(): JSX.Element {
  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);
  return (
    <Stack style={{ height: '100%' }}>
      {messageThreadProps && (
        <Stack style={{ height: '100%' }} grow>
          <MessageThread {...messageThreadProps} />
        </Stack>
      )}
      {sendBoxProps && <Stack verticalAlign="end">{sendBoxProps && <SendBox {...sendBoxProps} />}</Stack>}
    </Stack>
  );
}
export default ChatComponents;