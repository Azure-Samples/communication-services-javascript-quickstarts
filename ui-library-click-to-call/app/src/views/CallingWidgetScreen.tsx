import { CommunicationUserIdentifier, MicrosoftTeamsUserIdentifier } from '@azure/communication-common';
import { CompoundButton, Spinner, Stack, Text, TextField } from '@fluentui/react';
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { CallingWidgetComponent } from '../components/CallingWidgetComponent';
import { CallAdapterLocator } from '@azure/communication-react';
import { useRef } from 'react';
import { fetchAutoAttendantId, fetchCallQueueId, fetchTokenResponse } from '../utils/AppUtils';

export const CallingWidgetScreen = (): JSX.Element => {
    const hero = require('../hero.svg') as string;

    const [userDisplayName, setUserDisplayName] = useState<string>();
    const newWindowRef = useRef<Window | null>(null);
    const [useVideo, setUseVideo] = useState<boolean>(false);

    const [userIdentifier, setUserIdentifier] = useState<CommunicationUserIdentifier>();
    const [userToken, setUserToken] = useState<string>('');
    const [callQueueId, setCallQueueId] = useState<string>();
    const [autoAttendantId, setAutoAttendantId] = useState<string>();
    const [currentLocator, setCurrentLocator] = useState <'queue' | 'attendant'>('queue');
    const [callLocator, setCallLocator] = useState<CallAdapterLocator>();
    const [userCredentialFetchError, setUserCredentialFetchError] = useState<boolean>(false);

    // Get Azure Communications Service token and Voice app identification from the server.
    useEffect(() => {
        (async () => {
            try {
                const { token, user } = await fetchTokenResponse();
                const responseCallQueueId = await fetchCallQueueId();
                const responseAutoAttendantId = await fetchAutoAttendantId();

                setCallQueueId(`28:orgid:${responseCallQueueId}`);
                setAutoAttendantId(`28:orgid:${responseAutoAttendantId}`);

                setUserToken(token);
                setUserIdentifier(user);

                setCallLocator({ participantIds: [`28:orgid:${responseCallQueueId}`] })
            } catch (e) {
                console.error(e);
                setUserCredentialFetchError(true);
            }
        })();
    }, []);

    const startNewWindow = useCallback(() => {
        const startNewSessionString = 'newSession=true';
        newWindowRef.current = window.open(
            window.origin + `/?${startNewSessionString}`,
            'call screen',
            'width=500, height=450'
        );
    }, []);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.origin) {
                return;
            }
            if (event.data === 'args please') {
                const data = {
                    userId: userIdentifier,
                    displayName: userDisplayName,
                    token: userToken,
                    locator: callLocator,
                    useVideo: useVideo
                };
                console.log(data);
                newWindowRef.current?.postMessage(data, window.origin);
            }
        });
    }, [userIdentifier, userToken, callLocator, userDisplayName, useVideo]);

    if (userCredentialFetchError) {
        return (
            <Stack verticalAlign='center' style={{ height: '100%', width: '100%' }}>
                <Spinner label={'There was an issue getting credentials'} ariaLive="assertive" labelPosition="top" />;
            </Stack>
        )
    }

    return (
        <Stack
            style={{ height: "100%", width: "100%", padding: "3rem" }}
            tokens={{ childrenGap: "1.5rem" }}
        >
            <Stack style={{ margin: "auto" }} tokens={{ childrenGap: '1rem' }}>
                <Stack
                    style={{ padding: "3rem" }}
                    horizontal
                    tokens={{ childrenGap: "2rem" }}
                >
                    <Text style={{ marginTop: "auto" }} variant="xLarge">
                        Welcome to a Calling Widget and Teams Voice Application sample
                    </Text>
                    <img
                        style={{ width: "7rem", height: "auto" }}
                        src={hero}
                        alt="logo"
                    />
                </Stack>

                <Text>
                    Sample has the ability to:
                </Text>
                <ul>
                    <li>
                        Make calls to Teams voice applications like Call Queues and Auto Attendants.
                    </li>
                    <li>
                        Adhoc call Teams users with a tenant set that allows for calls from your Azure Communication Services resource.
                    </li>
                </ul>
                <Text>
                    Make the selection to which Teams voice application you would like to call with the buttons below. Then use the widget in the corner to start your call!
                </Text>
                <Stack tokens={{childrenGap: '1rem'}}>
                    <CompoundButton primary={currentLocator === 'queue' ? true : false} secondaryText={'Select for Call Queue'} onClick={() => {
                        if(callQueueId){
                            setCallLocator({participantIds: [callQueueId]});
                            setCurrentLocator('queue');
                            return;
                        }
                        console.warn('No Call Queue id found.');
                    }}>
                        Call Queue
                    </CompoundButton>
                    <CompoundButton primary={currentLocator === 'attendant' ? true : false} secondaryText={'Select for Auto Attendant'} onClick={() => {
                        if (autoAttendantId) {
                            setCallLocator({participantIds: [autoAttendantId]});
                            setCurrentLocator('attendant');
                            return;
                        }
                        console.warn('No Auto Attendant id found.')
                    }}>
                        Auto Attendant
                    </CompoundButton>
                </Stack>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: '1.5rem' }} style={{ overflow: 'hidden', margin: 'auto' }}>
                {userToken && userIdentifier && callLocator && (<CallingWidgetComponent
                    adapterArgs={{
                        locator: callLocator,
                        token: userToken,
                        userId: userIdentifier,
                        displayName: userDisplayName
                    }}
                    onRenderLogo={() => {
                        return (
                            <img
                                style={{ height: '4rem', width: '4rem', margin: 'auto' }}
                                src={hero}
                                alt="logo"
                            />
                        );
                    }}
                    onSetDisplayName={setUserDisplayName}
                    onSetUseVideo={setUseVideo}
                />)}
            </Stack>
        </Stack>
    );
};