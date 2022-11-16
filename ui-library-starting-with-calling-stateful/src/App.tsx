import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  FluentThemeProvider,
  DEFAULT_COMPONENT_ICONS,
  CallClientProvider,
  CallAgentProvider,
  CallProvider,
  createStatefulCallClient,
  StatefulCallClient
} from '@azure/communication-react';
import React, { useEffect, useState } from 'react';
import CallingComponents from './CallingComponentsStateful';
import { initializeIcons, registerIcons } from '@fluentui/react';
import { Call, CallAgent } from '@azure/communication-calling';


initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

function App(): JSX.Element {
  const userAccessToken = '<Azure Communication Services Resource Access Token>';
  const userId = '<User Id associated to the token>';
  const groupId = '<Generated GUID groupd id>';
  const displayName = '<Display Name>';

  const [statefulCallClient, setStatefulCallClient] = useState<StatefulCallClient>();
  const [callAgent, setCallAgent] = useState<CallAgent>();
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    setStatefulCallClient(createStatefulCallClient({
      userId: { communicationUserId: userId }
    }));
  }, []);

  useEffect(() => {
    const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);
    if (callAgent === undefined && statefulCallClient && displayName) {
      const createUserAgent = async () => {
        setCallAgent(await statefulCallClient.createCallAgent(tokenCredential, { displayName: displayName }))
      }
      createUserAgent();
    }
  }, [statefulCallClient, displayName, callAgent]);

  useEffect(() => {
    if (callAgent !== undefined) {
      setCall(callAgent.join({ groupId }));
    }
  }, [callAgent]);

  return (
    <>
      <FluentThemeProvider>
        {statefulCallClient && <CallClientProvider callClient={statefulCallClient}>
          {callAgent && <CallAgentProvider callAgent={callAgent}>
            {call && <CallProvider call={call}>
              <CallingComponents />
            </CallProvider>}
          </CallAgentProvider>}
        </CallClientProvider>}
      </FluentThemeProvider>
    </>
  );
}

export default App;
