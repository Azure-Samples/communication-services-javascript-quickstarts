import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  createStatefulChatClient,
  FluentThemeProvider,
  ChatClientProvider,
  ChatThreadClientProvider,
  DEFAULT_COMPONENT_ICONS
} from '@azure/communication-react';
import React from 'react';
import ChatComponents from './ChatComponentsStateful';
import { registerIcons } from '@fluentui/react';

function App(): JSX.Element {
  const endpointUrl = 'https://acs-test-resource.communication.azure.com/';
  const userAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMyIsIng1dCI6Ikc5WVVVTFMwdlpLQTJUNjFGM1dzYWdCdmFMbyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOjU3ZjAxZTQzLTMxOGUtNDY2MS1hZTBlLWI2NzY1ZDY1ODAxYV8wMDAwMDAwZC1iMWFlLTVlMzUtZjg4My0wODQ4MjIwMDI5YTIiLCJzY3AiOjE3OTIsImNzaSI6IjE2MzY2ODExNjkiLCJleHAiOjE2MzY3Njc1NjksImFjc1Njb3BlIjoidm9pcCxjaGF0IiwicmVzb3VyY2VJZCI6IjU3ZjAxZTQzLTMxOGUtNDY2MS1hZTBlLWI2NzY1ZDY1ODAxYSIsImlhdCI6MTYzNjY4MTE2OX0.CJ62QAygvQIsZKbAri_8GV0XkahLBjhyhcoC29wwggjNsx_iEzt1fff1LLJOGV7Q33jwVKIgBLN1DbBlK1NZ9qHD8ygvg-VLVCic97Gj2QJVXyzqi_Py3P03ZNGSHbn0V1-7nH23ju42jyXne5zwFek2ClBdXZmLA29pnch8ss6clNVamBahPw66QU5J9GCl_DBV1fNOTYfDzfagYmlEHAAhjwdCrlZbNPio2JScGl-ZZRpEtBYgqsK9FBYgPWIYNh8GBY3WDI7ZcoC0gM0Zn1EV03mu-YeKWjngDhLCBAPSXLLgpXTTMQTlnT2uPX3z1AH5mAHhNPqW5aL1drAV0Q';
  const userId = '8:acs:57f01e43-318e-4661-ae0e-b6765d65801a_0000000d-b1ae-5e35-f883-0848220029a2';
  const tokenCredential = new AzureCommunicationTokenCredential(userAccessToken);
  const threadId = '19:14sRlAANhpk54gu9exSgn6j2Xxk-yFxJyfyw6xmSm_M1@thread.v2';
  const displayName = 'TestUser';

  //Instantiate the statefulChatClient
  const statefulChatClient = createStatefulChatClient({
    userId: { communicationUserId: userId },
    displayName: displayName,
    endpoint: endpointUrl,
    credential: tokenCredential
  });

  const chatThreadClient = statefulChatClient.getChatThreadClient(threadId);

  //Listen to notifications
  statefulChatClient.startRealtimeNotifications();

  registerIcons({ icons: DEFAULT_COMPONENT_ICONS });

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

export default App;