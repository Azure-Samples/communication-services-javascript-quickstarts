import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  ChatComposite,
  ChatAdapter,
  createAzureCommunicationChatAdapter
} from '@azure/communication-react';
import React, { useEffect, useMemo, useState } from 'react';

function App(): JSX.Element {
  // Common variables
  const endpointUrl = '<Azure Communication Services Resource Endpoint>';
  const userId = '<Azure Communication Services Identifier>';
  const displayName = '<Display Name>';
  const token = '<Azure Communication Services Access Token>';
  // Calling Variables
  // Provide any valid UUID for `groupId`.
  const groupId = '<Developer generated GUID>';
  // Chat Variables
  const threadId = '<Get thread id from chat service>';

  const [callAdapter, setCallAdapter] = useState<CallAdapter>();
  const [chatAdapter, setChatAdapter] = useState<ChatAdapter>();

  // We can't even initialize the Chat and Call adapters without a well-formed token.
  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error('Failed to construct token credential');
      return undefined;
    }
  }, [token]);

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      setChatAdapter(
        await createAzureCommunicationChatAdapter({
          endpoint: endpointUrl,
          userId: { communicationUserId: userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          threadId
        })
      );
      setCallAdapter(
        await createAzureCommunicationCallAdapter({
          userId: { communicationUserId: userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          locator: { groupId }
        })
      );
    };
    createAdapter();
  }, []);

  if (!!callAdapter && !!chatAdapter) {
    return (
      <>
        <div style={containerStyle}>
          <ChatComposite adapter={chatAdapter} />
        </div>
        <div style={containerStyle}>
          <CallComposite adapter={callAdapter} />
        </div>
      </>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

const containerStyle = {
  height: '50%',
};

export default App;
