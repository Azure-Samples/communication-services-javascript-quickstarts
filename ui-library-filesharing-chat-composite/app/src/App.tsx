import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier,
} from "@azure/communication-common";
import {
  ChatComposite,
  fromFlatCommunicationIdentifier,
  useAzureCommunicationChatAdapter,
} from "@azure/communication-react";
import React, { useMemo } from "react";
import { downloadOptions } from "./AttachmentDownloadOptions";
import { initializeIcons } from "@fluentui/react";
import { initializeFileTypeIcons } from "@fluentui/react-file-type-icons";
import { uploadOptions } from "./AtachmentUploadOptions";

function App(): JSX.Element {
  initializeIcons();
  initializeFileTypeIcons();

  // Common variables
  const endpointUrl = "<Azure Communication Services Resource Endpoint>";
  const token = "<Azure Communication Services Resource Access Token>";
  const userId = "<User Id associated to the token>";
  const threadId = "<Get thread id from chat service>";
  const displayName = "<Display Name>";

  // We can't even initialize the Chat and Call adapters without a well-formed token.
  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error("Failed to construct token credential");
      return undefined;
    }
  }, [token]);

  // Memoize arguments to `useAzureCommunicationChatAdapter` so that
  // a new adapter is only created when an argument changes.
  const chatAdapterArgs = useMemo(
    () => ({
      endpoint: endpointUrl,
      userId: fromFlatCommunicationIdentifier(
        userId
      ) as CommunicationUserIdentifier,
      displayName,
      credential,
      threadId,
    }),
    [userId, displayName, credential, threadId]
  );
  const chatAdapter = useAzureCommunicationChatAdapter(chatAdapterArgs);

  if (chatAdapter) {
    return (
      <div style={containerStyle}>
        <ChatComposite
          adapter={chatAdapter}
          options={{
            attachmentOptions: {
              uploadOptions: uploadOptions,
              downloadOptions: downloadOptions,
            }
          }}
        />
      </div>
    );
  }
  if (credential === undefined) {
    return (
      <h3>Failed to construct credential. Provided token is malformed.</h3>
    );
  }
  return <h3>Initializing...</h3>;
}

const containerStyle = {
  height: "100%",
};

export default App;
