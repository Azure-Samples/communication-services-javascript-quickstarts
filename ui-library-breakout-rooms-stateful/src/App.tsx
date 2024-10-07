import { Call, CallAgent } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  CallAgentProvider,
  CallClientProvider,
  CallProvider,
  createStatefulCallClient,
  DEFAULT_COMPONENT_ICONS,
  FluentThemeProvider,
  StatefulCallClient,
} from "@azure/communication-react";
import { initializeIcons, registerIcons, Stack } from "@fluentui/react";
import { useEffect, useState } from "react";
import CallingComponents from "./CallingComponentsStateful";

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

function App(): JSX.Element {
  const userAccessToken =
    "<Azure Communication Services Resource Access Token>";
  const userId = "<User Id associated to the token>";
  const meetingLink = "<Teams meeting link>";
  const displayName = "<Display Name>";

  const [statefulCallClient, setStatefulCallClient] =
    useState<StatefulCallClient>();
  const [callAgent, setCallAgent] = useState<CallAgent>();
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const statefulCallClient = createStatefulCallClient({
      userId: { communicationUserId: userId },
    });

    // Request camera and microphone access once we have access to the device manager
    statefulCallClient.getDeviceManager().then((deviceManager) => {
      deviceManager.askDevicePermission({ video: true, audio: true });
    });

    setStatefulCallClient(statefulCallClient);
  }, []);

  useEffect(() => {
    const tokenCredential = new AzureCommunicationTokenCredential(
      userAccessToken
    );
    if (callAgent === undefined && statefulCallClient && displayName) {
      const createUserAgent = async () => {
        setCallAgent(
          await statefulCallClient.createCallAgent(tokenCredential, {
            displayName: displayName,
          })
        );
      };
      createUserAgent();
    }
  }, [statefulCallClient, displayName, callAgent]);

  useEffect(() => {
    if (callAgent !== undefined) {
      setCall(callAgent.join({ meetingLink }));
    }
  }, [callAgent]);

  return (
    <FluentThemeProvider>
      <Stack horizontal style={{ width: "100vw", height: "100vh" }}>
        {statefulCallClient && (
          <Stack style={{ width: "100%", height: "100%" }}>
            <CallClientProvider callClient={statefulCallClient}>
              {callAgent && (
                <CallAgentProvider callAgent={callAgent}>
                  {call && (
                    <CallProvider call={call}>
                      <CallingComponents />
                    </CallProvider>
                  )}
                </CallAgentProvider>
              )}
            </CallClientProvider>
          </Stack>
        )}
      </Stack>
    </FluentThemeProvider>
  );
}

export default App;
