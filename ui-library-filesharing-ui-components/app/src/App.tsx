import { ChatThreadClient } from "@azure/communication-chat";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  createStatefulChatClient,
  FluentThemeProvider,
  ChatClientProvider,
  ChatThreadClientProvider,
  DEFAULT_COMPONENT_ICONS,
} from "@azure/communication-react";
import { registerIcons, initializeIcons } from "@fluentui/react";
import React from "react";
import ChatComponents from "./ChatComponents";
import { initializeFileTypeIcons } from "@fluentui/react-file-type-icons";

function App(): JSX.Element {
  initializeIcons();
  registerIcons({ icons: DEFAULT_COMPONENT_ICONS });
  initializeFileTypeIcons();

  const ENDPOINT_URL = "<Azure Communication Services Resource Endpoint>";
  const TOKEN = "<Azure Communication Services Resource Access Token>";
  const USER_ID = "<User Id associated to the token>";
  const THREAD_ID = "<Get thread id from chat service>";
  const DISPLAY_NAME = "<Display Name>";

  const tokenCredential = new AzureCommunicationTokenCredential(TOKEN);

  // Instantiate the statefulChatClient
  const statefulChatClient = createStatefulChatClient({
    userId: { communicationUserId: USER_ID },
    displayName: DISPLAY_NAME,
    endpoint: ENDPOINT_URL,
    credential: tokenCredential,
  });

  statefulChatClient.startRealtimeNotifications();

  const chatThreadClient = statefulChatClient.getChatThreadClient(THREAD_ID);

  initializeThreadState(chatThreadClient);

  return (
    <div style={containerStyle}>
      <FluentThemeProvider>
        <ChatClientProvider chatClient={statefulChatClient}>
          <ChatThreadClientProvider chatThreadClient={chatThreadClient}>
            <ChatComponents />
          </ChatThreadClientProvider>
        </ChatClientProvider>
      </FluentThemeProvider>
    </div>
  );
}

async function initializeThreadState(chatThreadClient: ChatThreadClient): Promise<void> {
  await chatThreadClient.getProperties();
  for await (const _page of chatThreadClient.listParticipants().byPage()) {
    // Simply fetching participants updates the cached state in client.
  }
}

const containerStyle = {
  height: "100%",
};

export default App;
