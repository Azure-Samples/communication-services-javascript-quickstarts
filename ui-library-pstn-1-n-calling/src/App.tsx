import {
  AzureCommunicationTokenCredential,
  CommunicationUserIdentifier
} from "@azure/communication-common";
import {
  CallComposite,
  fromFlatCommunicationIdentifier,
  useAzureCommunicationCallAdapter,
} from "@azure/communication-react";
import React, { useMemo } from "react";
import { INPUTS } from "./INPUTS";
import { initializeIcons } from '@fluentui/react'

initializeIcons();
/**
 * Entry point of your application.
 */
function App(): JSX.Element {
  // Memoize arguments to `useAzureCommunicationCallAdapter` so that
  // a new adapter is only created when an argument changes.
  const callAdapterArgs = useMemo(
    () => {
      try {
        const { userIdentity, userToken, targetCallees, displayName, callerId } = INPUTS;
        return {
          userId: fromFlatCommunicationIdentifier(userIdentity) as CommunicationUserIdentifier,
          credential: new AzureCommunicationTokenCredential(userToken),
          displayName: displayName,
          targetCallees: targetCallees,
          alternateCallerId: callerId,
        };
      }
      catch (e) {
        console.error(e);
        return {};
      }
    },
    []
  );
  const callAdapter = useAzureCommunicationCallAdapter(callAdapterArgs);

  // Display the call composite if the adapter has finished constructing.
  if (callAdapter) {
    return (
      <div style={{ height: "100vh" }}>
        <CallComposite adapter={callAdapter} />
      </div>
    );
  }

  // Display an error message if the token was incorrect.
  if (!callAdapterArgs.credential === undefined) {
    return (
      <h3>Failed to construct credential. Provided token is malformed.</h3>
    );
  }

  // Display a loading message while the adapter is being constructed.
  return <h3>Initializing...</h3>;
}

export default App;
