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

  const endpointUrl = '<Azure Communication Services Resource Endpoint>';
  const token = '<Azure Communication Services Resource Access Token>';
  const userId = '<User Id associated to the token>';
  const threadId = '<Get thread id from chat service>';
  const displayName = '<Display Name>';

  const tokenCredential = new AzureCommunicationTokenCredential(
    token
  );

  // Instantiate the statefulChatClient
  const statefulChatClient = createStatefulChatClient({
    userId: { communicationUserId: userId },
    displayName: displayName,
    endpoint: endpointUrl,
    credential: tokenCredential,
  });

  statefulChatClient.startRealtimeNotifications();

  const chatThreadClient = statefulChatClient.getChatThreadClient(threadId);

  initializeThreadState(chatThreadClient);

  return (
    <FluentThemeProvider>
      <ChatClientProvider chatClient={statefulChatClient}>
        <ChatThreadClientProvider chatThreadClient={chatThreadClient}>
          <ChatComponents />
        </ChatThreadClientProvider>
      </ChatClientProvider>
    </FluentThemeProvider>
  );
}

async function initializeThreadState(
  chatThreadClient: ChatThreadClient
): Promise<void> {
  await chatThreadClient.getProperties();
  for await (const _page of chatThreadClient.listParticipants().byPage()) {
    // Simply fetching participants updates the cached state in client.
  }
}

export default App;
