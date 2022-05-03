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

  const endpointUrl = "<Azure Communication Services Resource Endpoint>";
  const userId = "<Azure Communication Services Identifier>";
  const displayName = "<Display Name>";
  const userAccessToken = "<Azure Communication Services Access Token>";
  const threadId = "<Get thread id from chat service>";

  const tokenCredential = new AzureCommunicationTokenCredential(
    userAccessToken
  );

  // Instantiate the statefulChatClient
  const statefulChatClient = createStatefulChatClient({
    userId: { communicationUserId: userId },
    displayName: displayName,
    endpoint: endpointUrl,
    credential: tokenCredential,
  });

  // Listen to notifications
  statefulChatClient.startRealtimeNotifications();

  const chatThreadClient = statefulChatClient.getChatThreadClient(threadId);
  // Fetch thread properties, participants etc.
  // Past messages are fetched as needed when the user scrolls to them.
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
