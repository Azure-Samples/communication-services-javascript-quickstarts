import { CallAdapterLocator } from '@azure/communication-react';
import { CommunicationIdentifier } from '@azure/communication-common';

/**
 * Function to see if we should be making a request for the adapter args from URL
 * @returns
 */
export const getStartSessionFromURL = (): boolean | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("newSession") === "true";
};

/**
 * Properties needed to create a call screen for a  Azure Communication Services CallComposite.
 */
export type AdapterArgs = {
  token: string;
  userId: CommunicationIdentifier;
  locator: CallAdapterLocator;
  displayName?: string;
};