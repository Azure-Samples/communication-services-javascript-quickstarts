import { v1 } from 'uuid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapter,
  fromFlatCommunicationIdentifier,
  CustomCallControlButtonCallbackArgs,
  CustomCallControlButtonProps,
  createStatefulCallClient,
  createAzureCommunicationCallAdapterFromClient
} from '@azure/communication-react';
import { ACS_TOKEN, ACS_USER_ID } from './Secrets';
import { initializeIcons } from '@fluentui/react';
import { Record20Regular, RecordStop20Filled } from '@fluentui/react-icons';
import { recordingButtonPropsCallback } from './RecordingButton';


initializeIcons();

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

  const [serverCallId, setServerCallId] = useState('');
  const [recordingId, setRecordingId] = useState('');

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      const callClient = await createStatefulCallClient({
        userId: fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier,
      })
      const callAgent = await callClient.createCallAgent(new AzureCommunicationTokenCredential(token))
      const newAdapter = await createAzureCommunicationCallAdapterFromClient(callClient, callAgent, { groupId });
      setCallAdapter(newAdapter);
      newAdapter.onStateChange(async (state) => {
        if (state.call?.state === 'Connected') {
          const call = callAgent.calls.find((call) => call.id === state.call?.id);
          if (call) {
            setServerCallId(await call.info.getServerCallId());
          }
        }
      })
    };
    createAdapter();
  }, []);

  const callCompositeOptions = useMemo(() => {
    return {
      callControls: {
        onFetchCustomButtonProps: [
          recordingButtonPropsCallback(serverCallId, recordingId, setRecordingId)
        ]
      }
    };
  }, [serverCallId, recordingId, setRecordingId]);

  if (!!callAdapter) {
    return (
      <div style={{ height: '100vh', display: 'flex' }}>
        <CallComposite adapter={callAdapter} options={callCompositeOptions} />
      </div>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

export default App;