import { AzureCommunicationTokenCredential, CommunicationUserIdentifier } from '@azure/communication-common';
import {
  CallComposite,
  fromFlatCommunicationIdentifier,
  Role,
  useAzureCommunicationCallAdapter
} from '@azure/communication-react';
import React, { useMemo } from 'react';

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
const USER_ID = '<Azure Communication Services Identifier>';
const TOKEN = '<Azure Communication Services Access Token>';
/**
 * Display name for the local participant.
 * In a real application, this would be part of the user data that your
 * backend services provides to the client application after the user
 * goes through your authentication flow.
 */
const DISPLAY_NAME = '<Display Name>';

/**
 * RoomsId to join rooms Call
 */
const ROOM_ID = '<Azure Communication Services Rooms Identifier>'
/**
 * Choose the role from 'Presenter' | 'Attendee' | 'Consumer'. 
 * The default value is set to 'Presenter'
 */
let ROLE: Role = 'Presenter';

/**
 * Entry point of your application.
 */
function App(): JSX.Element {
  // Arguments that would usually be provided by your backend service or
  // (indirectly) by the user.
  const { userId, token, displayName, roomId } = useAzureCommunicationServiceArgs();

  // A well-formed token is required to initialize the chat and calling adapters.
  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error('Failed to construct token credential');
      return undefined;
    }
  }, [token]);

  // Memoize arguments to `useAzureCommunicationCallAdapter` so that
  // a new adapter is only created when an argument changes.
  const callAdapterArgs = useMemo(
    () => ({
      userId: fromFlatCommunicationIdentifier(userId) as CommunicationUserIdentifier,
      displayName,
      credential,
      locator: { roomId }
    }),
    [userId, credential, displayName, roomId]
  );
  const callAdapter = useAzureCommunicationCallAdapter(callAdapterArgs);

  if (!!callAdapter) {
    return (
      <div style={{ height: '100vh', display: 'flex'}}>
          <CallComposite adapter={callAdapter} role={ROLE}/>
      </div>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

/**
 * This hook returns all the arguments required to use the Azure Communication services
 * that would be provided by your backend service after user authentication
 * depending on the user-flow (e.g. which chat thread to use).
 */
function useAzureCommunicationServiceArgs(): {
  userId: string;
  token: string;
  displayName: string;
  roomId: string;
} {
  return {
    userId: USER_ID,
    token: TOKEN,
    displayName: DISPLAY_NAME,
    roomId: ROOM_ID
  };
}

export default App;
