import { CommunicationUserIdentifier, MicrosoftTeamsUserIdentifier } from '@azure/communication-common';
import { Spinner, Stack, Text, TextField } from '@fluentui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CallingWidgetComponent } from '../components/CallingWidgetComponent';
import { CallAdapterLocator } from '@azure/communication-react';
import { useRef } from 'react';
// This import pulls in the place holder react logo from CRA, you can replace this with a logo or other image of your choosing
import hero from '../hero.svg';
import { fetchTokenResponse } from '../utils/AppUtils';

export const CallingWidgetScreen = (): JSX.Element => {

    const [userDisplayName, setUserDisplayName] = useState<string>();
    const newWindowRef = useRef<Window | null>(null);
    const [useVideo, setUseVideo] = useState<boolean>(false);

    const [userIdentifier, setUserIdentifier] = useState<CommunicationUserIdentifier>();
    const [userToken, setUserToken] = useState<string>('');
    const [callLocator, setCallLocator] = useState<CallAdapterLocator>();
    const [userCredentialFetchError, setUserCredentialFetchError] = useState<boolean>(false);

    // Get Azure Communications Service token from the server
    useEffect(() => {
        (async () => {
            try {
                const { token, user } = await fetchTokenResponse();
                setUserToken(token);
                setUserIdentifier(user);
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
    }, [ userIdentifier, userToken, callLocator, userDisplayName, useVideo]);

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
                        Welcome to a Calling Widget sample
                    </Text>
                    <img
                        style={{ width: "7rem", height: "auto" }}
                        src={hero}
                        alt="logo"
                    />
                </Stack>
                
                <Text>
                    Welcome to a Calling Widget sample for the Azure Communication Services UI
                    Library. Sample has the ability to:
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
                    As a user all you need to do is click the widget below, enter your
                    display name for the call - this will act as your caller id, and
                    action the <b>start call</b> button.
                </Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: '1.5rem' }} style={{ overflow: 'hidden', margin: 'auto' }}>
                { userToken && userIdentifier && callLocator && (<CallingWidgetComponent
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