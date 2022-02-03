import { v1 } from 'uuid';
import React, { useEffect, useMemo, useState } from 'react';
import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
  CallComposite,
  CallAdapter,
  fromFlatCommunicationIdentifier,
  createStatefulCallClient,
  createAzureCommunicationCallAdapterFromClient,
  darkTheme
} from '@azure/communication-react';
import { ACS_TOKEN, ACS_USER_ID } from './Secrets';
import { initializeIcons } from '@fluentui/react';
import { recordingButtonPropsCallback } from './RecordingButton';
import { mergeStyles, Stack } from '@fluentui/react';
import { RecordingList } from './RecordingList';


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
      <Stack
        tokens={{ childrenGap: '1rem' }}
        className={mergeStyles({
          margin: '2rem'
        })}
      >
        <Stack.Item grow>
          <div style={{ height: '70vh', display: 'flex' }}>
            <CallComposite adapter={callAdapter} options={callCompositeOptions} fluentTheme={darkTheme} />
          </div>
        </Stack.Item>
        <RecordingList serverCallId={serverCallId} />
      </Stack>

    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

export default App;