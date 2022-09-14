import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier,
} from "@azure/communication-common";
import {
  CallComposite,
  fromFlatCommunicationIdentifier,
  useAzureCommunicationCallAdapter,
} from "@azure/communication-react";
import React, { CSSProperties, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Authentication information needed for your client application to use
 * Azure Communication Services.
 *
 * For this quickstart, you can obtain these from the Azure portal as described here:
 * https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/identity/quick-create-identity
 *
 * In a real application, your backend service would provide these to the client
 * application after the user goes through your authentication flow.
 */
const USER_ID = "<Azure Communication Services Identifier>";
const TOKEN = "<Azure Communication Services Access Token>";

/**
 * Display name for the local participant.
 * In a real application, this would be part of the user data that your
 * backend services provides to the client application after the user
 * goes through your authentication flow.
 */
const DISPLAY_NAME = "<Display Name>";

/**
 * Entry point of your application.
 */
function App(): JSX.Element {
  // Arguments that would usually be provided by your backend service or
  // (indirectly) by the user.
  const { userId, token, displayName, groupId } =
    useAzureCommunicationServiceArgs();

  // A well-formed token is required to initialize the calling adapter.
  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error("Failed to construct token credential");
      return undefined;
    }
  }, [token]);

  // Memoize arguments to `useAzureCommunicationCallAdapter` so that
  // a new adapter is only created when an argument changes.
  const callAdapterArgs = useMemo(
    () => ({
      userId: fromFlatCommunicationIdentifier(
        userId
      ) as CommunicationUserIdentifier,
      displayName,
      credential,
      locator: {
        // Can be a phone number if you want to call a PSTN number. For example, "+18001234567"
        // alternateCallerId is required for calling phone numbers using the call composite.
        // NOTE: Feature in public preview. Not recommended for production use.
        groupId,
      },
      // For using PSTN Calling features in CallComposite.
      // Read more about procuring a phone number from Azure
      // https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number
      // NOTE: Feature in public preview. Not recommended for production use.
      alternateCallerId: "<Azure Communication Services provided Phone Number>",
    }),
    [userId, credential, displayName, groupId]
  );
  const callAdapter = useAzureCommunicationCallAdapter(callAdapterArgs);

  if (!!callAdapter) {
    return (
      <div style={{ height: "100vh", display: "flex" }}>
        <div style={containerStyle}>
          <CallComposite adapter={callAdapter} />
        </div>
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

const containerStyle: CSSProperties = {
  border: "solid 0.125rem olive",
  margin: "0.5rem",
  width: "50vw",
};
/**
 * This hook returns all the arguments required to use the Azure Communication services
 * that would be provided by your backend service after user authentication
 * depending on the user-flow.
 */
function useAzureCommunicationServiceArgs(): {
  userId: string;
  token: string;
  displayName: string;
  groupId: string;
} {
  // For the quickstart, generate a random group ID.
  // The group Id must be a UUID.
  const groupId = useRef(uuidv4());

  return {
    userId: USER_ID,
    token: TOKEN,
    displayName: DISPLAY_NAME,
    groupId: groupId.current,
  };
}

export default App;
