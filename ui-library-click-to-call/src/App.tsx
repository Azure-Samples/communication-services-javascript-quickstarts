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
import { Dismiss20Regular } from '@fluentui/react-icons';

type AppPages = 'click-to-call' | 'same-origin-call';

registerIcons({ icons: { dismiss: <Dismiss20Regular /> } });
initializeIcons();
function App() {

  const [page, setPage] = useState<AppPages>('click-to-call');

  /**
   * Token for local user.
   */
  const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwNiIsIng1dCI6Im9QMWFxQnlfR3hZU3pSaXhuQ25zdE5PU2p2cyIsInR5cCI6IkpXVCJ9.eyJza3lwZWlkIjoiYWNzOmI2YWFkYTFmLTBiMWQtNDdhYy04NjZmLTkxYWFlMDBhMWQwMV8wMDAwMDAxOC1kMTBmLTkwMDctYTYxMC0yNDQ4MjIwMDExM2YiLCJzY3AiOjE3OTIsImNzaSI6IjE2ODQ0NTIyNzMiLCJleHAiOjE2ODQ1Mzg2NzMsInJnbiI6ImFtZXIiLCJhY3NTY29wZSI6ImNoYXQsdm9pcCIsInJlc291cmNlSWQiOiJiNmFhZGExZi0wYjFkLTQ3YWMtODY2Zi05MWFhZTAwYTFkMDEiLCJyZXNvdXJjZUxvY2F0aW9uIjoidW5pdGVkc3RhdGVzIiwiaWF0IjoxNjg0NDUyMjczfQ.T3ZnuJGDIk_CS9jb6KYmo1Wp3dVt6IJ07TdEp6E1w6gR9WW8yHnRpVjhrPo-YIX91gNMZLxP3Ht65tlnvb186W7pwtuMej7bP0z5MmUt3wH4pj5Ls1ghdc-KpVBDZ1WKjnTW_QUmYOJLoCwEsi3-JSLp4hLJ0EJDr11o1teK94rsel5asP7JFbOD9V4LBZlD8fQB9RhOivHIAFMTQY9Hzbl43Qm_-icdrrLLQ386VaCUSLFLtWA6dw5fy8D_7kQcSBT9VClPzw1jCIYRquJ0lQTK-eHWer8kfz4UbdldcTaOHtNdI_CX53aELDhGjNnJPz9YtapTUSOfYNc8KvKbmQ';
  
  /**
   * User identifier for local user.
   */
  const userId: CommunicationIdentifier = { communicationUserId: '8:acs:b6aada1f-0b1d-47ac-866f-91aae00a1d01_00000018-d10f-9007-a610-24482200113f'};
  
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
  const locator: CallAdapterLocator = {participantIds: ['+14039883391']};

  /**
   * Phone number needed from your Azure Communications resource to start a PSTN call. Can be created under the phone numbers
   * tab of your resource.
   * 
   * For more information on phone numbers and Azure Communications go to this link: https://learn.microsoft.com/en-us/azure/communication-services/concepts/telephony/plan-solution
   * 
   * This can be left alone if not making a PSTN call.
   */
  const alternateCallerId = '+15125186727';

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
      if (!token || !userId || !locator || startSession === undefined) {
        return (
          <Stack style={{height: '100%', width: '100%'}}>
            <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
          </Stack>
        )
        
      }
      return <ClickToCallScreen token={token} userId={userId} callLocator={locator} alternateCallerId={alternateCallerId}/>;
    }
    case 'same-origin-call': {
      if (!adapterArgs) {
        return (
          <Stack style={{ height: '100%', width: '100%' }}>
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
