// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CallAdapterLocator } from "@azure/communication-react";
import { CommunicationIdentifier } from '@azure/communication-common';

/**
 * get go ahead to request for adapter args from url
 * @returns
 */
export const getStartSessionFromURL = (): boolean | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('newSession') === 'true';
};

/**
 * Properties needed to create a call screen for a Azure Communications CallComposite.
 */
export type AdapterArgs = {
  token: string;
  userId: CommunicationIdentifier;
  locator: CallAdapterLocator;
  displayName?: string;
  alternateCallerId?: string;
};