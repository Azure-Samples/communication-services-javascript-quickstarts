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

  const endpointUrl = "https://web-ui-dev.communication.azure.com";
  const userAccessToken =
    "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwNCIsIng1dCI6IlJDM0NPdTV6UENIWlVKaVBlclM0SUl4Szh3ZyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOmRkOTc1M2MwLTZlNjItNGY3NC1hYjBmLWM5NGY5NzIzYjRlYl8wMDAwMDAxMS0wMWQxLTVmMjUtNTcwYy0xMTNhMGQwMDRkMGUiLCJzY3AiOjE3OTIsImNzaSI6IjE2NTA5MTA1NDIiLCJleHAiOjE2NTA5OTY5NDIsImFjc1Njb3BlIjoidm9pcCxjaGF0IiwicmVzb3VyY2VJZCI6ImRkOTc1M2MwLTZlNjItNGY3NC1hYjBmLWM5NGY5NzIzYjRlYiIsImlhdCI6MTY1MDkxMDU0Mn0.Ux1WzfWI_RIxgD7bSSnAjTq2wlGSIE5QrZH40O7vdIJzhvfNDGXJlhcqxUqO2jKfkFmTeOEq_eBEiDDcpR65ImP11ciZMqSZLdYwmf5cwPIu42Jj7JNYLalnYzL2CKMHNqaNK3S02PXJi1HBAYqPUbGv2MKa1b2cRgGD19Ev-hsfzAQL9hRPngLfIoAALZ8Hd6j-NLS8v3gLTrI7R8MVtS0EqSilkBK-drbFtzWohlhhTw7gwyp_zkfhI5n2vdfJB0iZUshCwqLCCammMja37JIjhJ8lQK5oXhI0UreokmytdFfORYTAORMt2WFfNxcpN15ksHtjj_9xpbsCbSu2pQ";
  const userId = "8:acs:dd9753c0-6e62-4f74-ab0f-c94f9723b4eb_00000011-01d1-5f25-570c-113a0d004d0e";
  const tokenCredential = new AzureCommunicationTokenCredential(
    userAccessToken
  );
  const threadId = "19:XvuYShE3XIo8u10lzMES8_FdNYDoonp11NDEqhznuHc1@thread.v2";
  const displayName = "John Doe";

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
