import { v1 } from 'uuid';
import React, { useEffect, useMemo, useState } from 'react';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  fromFlatCommunicationIdentifier
} from '@azure/communication-react';
import { ACS_TOKEN, ACS_USER_ID } from './Secrets';


function App(): JSX.Element {
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();

  const userId = ACS_USER_ID;
  if (!userId) {
    throw new Error('No userId set');
  }
  const token = ACS_TOKEN;
  if (!token) {
    throw new Error('No token set');
  }

  const displayName = 'CallRecordingDemoUser';
  const groupId = v1();

  // We can't even initialize the adapter without a well-formed token.
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
      setCallAdapter(
        await createAzureCommunicationCallAdapter({
          userId: fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier,
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          locator: { groupId }
        })
      );
    };
    createAdapter();
  }, []);

  if (!!callAdapter) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
        <CallComposite adapter={callAdapter} />
      </div>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

export default App;