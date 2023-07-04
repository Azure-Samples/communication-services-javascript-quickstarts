// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationUserIdentifier, MicrosoftTeamsUserIdentifier } from '@azure/communication-common';
import { CallAdapterLocator } from '@azure/communication-react';
import { Stack, Text } from '@fluentui/react';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { CallingWidgetComponent } from '../components/CallingWidgetComponent';
import hero from '../hero.svg';

export interface CallingWidgetPageProps {
    token: string;
    userId:
    | CommunicationUserIdentifier
    | /* @conditional-compile-remove(teams-identity-support) */ MicrosoftTeamsUserIdentifier;
    callLocator: CallAdapterLocator;
    alternateCallerId?: string
}

export const CallingWidgetScreen = (props: CallingWidgetPageProps): JSX.Element => {
    const { token, userId, callLocator, alternateCallerId } = props;

    const [userDisplayName, setUserDisplayName] = useState<string>();
    const newWindowRef = useRef<Window | null>(null);
    const [useVideo, setUseVideo] = useState<boolean>(false);

    // we also want to make this memoized version of the args for the new window.
    const adapterParams = useMemo(() => {
        const args = {
            userId: userId as CommunicationUserIdentifier,
            displayName: userDisplayName ?? '',
            token,
            locator: callLocator,
            alternateCallerId
        };
        return args;
    }, [userId, userDisplayName, token, callLocator, alternateCallerId]);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.origin) {
                return;
            }
            if (event.data === 'args please') {
                const data = {
                    userId: adapterParams.userId,
                    displayName: adapterParams.displayName,
                    token: adapterParams.token,
                    locator: adapterParams.locator,
                    alternateCallerId: adapterParams.alternateCallerId,
                    useVideo: useVideo
                };
                console.log(data);
                newWindowRef.current?.postMessage(data, window.origin);
            }
        });
    }, [adapterParams, adapterParams.locator, adapterParams.displayName, useVideo]);

    const startNewWindow = useCallback(() => {
        const startNewSessionString = 'newSession=true';
        newWindowRef.current = window.open(
            window.origin + `/?${startNewSessionString}`,
            'call screen',
            'width=500, height=450'
        );
    }, []);

    return (
        <Stack
            style={{ height: '100%', width: '100%', padding: '3rem' }}
            tokens={{ childrenGap: '1.5rem' }}
        >
            <Stack style={{ margin: 'auto' }}>
                <Stack style={{ padding: '3rem' }} horizontal tokens={{ childrenGap: '2rem' }}>
                    <Text style={{ marginTop: 'auto' }} variant="xLarge">
                        Welcome to a Calling Widget sample
                    </Text>
                    <img
                        style={{ width: '7rem', height: 'auto' }}
                        src={hero}
                        alt="kcup logo"
                    />
                </Stack>

                <Text>Welcome to a Calling Widget sample for the Azure Communications UI Library. Sample has the ability to:</Text>
                <ul>
                    <li>Adhoc call teams users with a tenant set that allows for external calls</li>
                    <li>Joining Teams interop meetings as a Azure Communications user</li>
                    <li>Make a Calling Widget PSTN call to a help phone line</li>
                    <li>Join a Azure Communications group call</li>
                </ul>
                <Text>
                    As a user all you need to do is click the widget below, enter your display name for the call
                    - this will act as your caller id, and action the <b>start call</b> button.
                </Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: '1.5rem' }} style={{ overflow: 'hidden', margin: 'auto' }}>
                <CallingWidgetComponent
                    onRenderStartCall={startNewWindow}
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
                />
            </Stack>
        </Stack>
    );
};
