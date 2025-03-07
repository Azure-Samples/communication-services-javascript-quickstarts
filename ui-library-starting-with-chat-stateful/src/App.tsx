import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import {
  createStatefulChatClient,
  FluentThemeProvider,
  ChatClientProvider,
  ChatThreadClientProvider,
  DEFAULT_COMPONENT_ICONS,
} from "@azure/communication-react";
import ChatComponents from "./ChatComponentsStateful";
import { initializeIcons, registerIcons } from "@fluentui/react";

initializeIcons();
registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

function App(): JSX.Element {
  const ENDPOINT_URL = "<Azure Communication Services Resource Endpoint>";
  const TOKEN = "<Azure Communication Services Resource Access Token>";
  const USER_ID = "<User Id associated to the token>";
  const THREAD_ID = "<Get thread id from chat service>";
  const DISPLAY_NAME = "<Display Name>";

  const tokenCredential = new AzureCommunicationTokenCredential(TOKEN);
  //Instantiate the statefulChatClient
  const statefulChatClient = createStatefulChatClient({
    userId: { communicationUserId: USER_ID },
    displayName: DISPLAY_NAME,
    endpoint: ENDPOINT_URL,
    credential: tokenCredential,
  });

  const chatThreadClient = statefulChatClient.getChatThreadClient(THREAD_ID);

  //Listen to notifications
  statefulChatClient.startRealtimeNotifications();

  return (
    <FluentThemeProvider>
      <ChatClientProvider chatClient={statefulChatClient}>
        <ChatThreadClientProvider chatThreadClient={chatThreadClient}>
          <ChatComponents chatClient={statefulChatClient} chatThreadClient={chatThreadClient} threadId={THREAD_ID} userId={USER_ID} displayName={DISPLAY_NAME}/>
        </ChatThreadClientProvider>
      </ChatClientProvider>
    </FluentThemeProvider>
  );
}

export default App;
