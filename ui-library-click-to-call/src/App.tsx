// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { CallAdapterLocator } from '@azure/communication-react';
import { CommunicationIdentifier, CommunicationUserIdentifier } from '@azure/communication-common';
import { AdapterArgs, getStartSessionFromURL } from './utils/AppUtils';
import { ClickToCallScreen } from './views/ClickToCallScreen';
import { SameOriginCallScreen } from './views/NewWindowCallScreen';
import { Spinner, Stack, initializeIcons, registerIcons } from '@fluentui/react';
import { CallAdd20Regular, Dismiss20Regular } from '@fluentui/react-icons';

type AppPages = 'click-to-call' | 'same-origin-call';

registerIcons({ icons: { dismiss: <Dismiss20Regular />, callAdd: <CallAdd20Regular /> } });
initializeIcons();
function App() {

  const [page, setPage] = useState<AppPages>('click-to-call');

  /**
   * Token for local user.
   */
  const token = 'Enter your Azure Communication Services token here';
  
  /**
   * User identifier for local user.
   */
  const userId: CommunicationIdentifier = { communicationUserId: '<Enter your user Id>'};
  
  /**
   * This decides where the call will be going. This supports many different calling modalities in the Call Composite.
   * 
   * - teams meeting locator: {meetingLike: 'url to join link for a meeting'}
   * - Azure communications group call: {groupId: 'GUID that defines the call'}
   * - Azure Communications Rooms call: {roomId: 'guid that represents a rooms call'}
   * - teams adhoc, Azure communications 1:n, PSTN calls all take a participants locator: {participantIds: ['Array of participant id's to call']}
   * 
   * You can call teams voice apps like a Call queue with the participants locator.
   */
  const locator: CallAdapterLocator = {participantIds: ['<Enter a Participants Id here>']};

  /**
   * Phone number needed from your Azure Communications resource to start a PSTN call. Can be created under the phone numbers
   * tab of your resource.
   * 
   * For more information on phone numbers and Azure Communications go to this link: https://learn.microsoft.com/en-us/azure/communication-services/concepts/telephony/plan-solution
   * 
   * This can be left alone if not making a PSTN call.
   */
  const alternateCallerId = '<Enter your alternate CallerId here>';

  /**
   * Properties needed to start an Azure Communications Call Adapter. When these are set the app will go to the Call screen for the
   * Click to Call scenario. Call screen should create the credential that will be used in the call for the user.
   */
  const [adapterArgs, setAdapterArgs] = useState<AdapterArgs | undefined>();
  const [useVideo, setUseVideo] = useState<boolean>(false);

  const startSession = useMemo(() => {
    return getStartSessionFromURL();
  }, []);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if ((event.data as AdapterArgs).userId && (event.data as AdapterArgs).displayName !== '') {
        console.log(event.data);
        setAdapterArgs({
          userId: (event.data as AdapterArgs).userId as CommunicationUserIdentifier,
          displayName: (event.data as AdapterArgs).displayName,
          token: (event.data as AdapterArgs).token,
          locator: (event.data as AdapterArgs).locator,
          alternateCallerId: (event.data as AdapterArgs).alternateCallerId
        });
        setUseVideo(!!event.data.useVideo);
      }
    });
  }, []);

  useEffect(() => {
    if (startSession) {
      console.log('asking for args');
      if (window.opener) {
        window.opener.postMessage('args please', window.opener.origin);
      }
    }
  }, [startSession]);

  useEffect(() => {
    if (adapterArgs) {
      console.log('starting session');
      setPage('same-origin-call');
    }
  }, [adapterArgs]);

  switch (page) {
    case 'click-to-call': {
      if (!token || !userId || !locator || startSession !== false) {
        return (
          <Stack verticalAlign='center' style={{height: '100%', width: '100%'}}>
            <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
          </Stack>
        )
        
      }
      return <ClickToCallScreen token={token} userId={userId} callLocator={locator} alternateCallerId={alternateCallerId}/>;
    }
    case 'same-origin-call': {
      if (!adapterArgs) {
        return (
          <Stack verticalAlign='center' style={{ height: '100%', width: '100%' }}>
            <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
          </Stack>
        )
      }
      return (
        <SameOriginCallScreen
          adapterArgs={{
            userId: adapterArgs.userId as CommunicationUserIdentifier,
            displayName: adapterArgs.displayName ?? '',
            token: adapterArgs.token,
            locator: adapterArgs.locator,
            alternateCallerId: adapterArgs.alternateCallerId
          }}
          useVideo={useVideo}
        />
      );
    }
  }
}

export default App;
