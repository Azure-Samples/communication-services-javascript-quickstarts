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

  const recordingButton = useCallback((args: CustomCallControlButtonCallbackArgs): CustomCallControlButtonProps => ({
    placement: 'afterCameraButton',
    showLabel: true,
    labelKey: 'recordingButtonLabel',
    strings: {
      offLabel: "Start Recording",
      onLabel: "Stop Recording",
      tooltipOffContent: "Start Recording",
      tooltipOnContent: "Stop Recording",
    },
    onRenderOffIcon: (): JSX.Element => (<Record20Regular />),
    onRenderOnIcon: (): JSX.Element => (<RecordStop20Filled />),
    checked: !!recordingId,
    onClick: async () => {
      if (!serverCallId) {
        console.warn('Recording buton: No serverCallId yet!');
        return;
      }

      if (!!recordingId) {
        // stop the recording
        await stopRecording(serverCallId, recordingId);
        setRecordingId('');
        return
      }

      // start the recording
      const { recordingId: newRecordingId } = await startRecording(serverCallId);
      setRecordingId(newRecordingId);
    }
  }), [serverCallId, recordingId]);

  const callCompositeOptions = useMemo(() => ({
    callControls: {
      onFetchCustomButtonProps: [recordingButton]
    }
  }), []);

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

interface StartRecordingResponse {
  recordingId: string;
}

const startRecording = async (serverCallId: string): Promise<StartRecordingResponse> => {
  const { recordingId } = await (
    await fetch(`/api/startRecording`, {
      method: "POST",
      body: JSON.stringify({ serverCallId: serverCallId }),
    })
  ).json();
  console.log(`Started recording for ${serverCallId}: ${recordingId}`);
  return { recordingId };
}

const stopRecording = async (serverCallId: string, recordingId: string): Promise<void> => {
  await fetch(`/api/stopRecording`, {
    method: "POST",
    body: JSON.stringify({ serverCallId: serverCallId }),
  })
  console.log(`Stopped recording for ${serverCallId}: ${recordingId}`);
}
export default App;