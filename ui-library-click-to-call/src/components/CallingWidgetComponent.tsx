import { IconButton, PrimaryButton, Stack, TextField, useTheme, Checkbox, Icon } from '@fluentui/react';
import React, { useState } from 'react';
import {
    callingWidgetSetupContainerStyles,
    checkboxStyles,
    startCallButtonStyles,
    callingWidgetContainerStyles,
    callIconStyles,
    logoContainerStyles,
    collapseButtonStyles
} from '../styles/CallingWidgetComponent.styles';

import { AzureCommunicationTokenCredential, CommunicationIdentifier, MicrosoftTeamsAppIdentifier } from '@azure/communication-common';
import {
    CallAdapter,
    CallComposite,
    useAzureCommunicationCallAdapter,
    AzureCommunicationCallAdapterArgs
} from '@azure/communication-react';
// lets add to our react imports as well
import { useCallback, useMemo } from 'react';

import { callingWidgetInCallContainerStyles } from '../styles/CallingWidgetComponent.styles';

/**
 * Properties needed for our widget to start a call.
 */
export type WidgetAdapterArgs = {
    token: string;
    userId: CommunicationIdentifier;
    teamsAppIdentifier: MicrosoftTeamsAppIdentifier;
};

export interface CallingWidgetComponentProps {
    /**
     *  arguments for creating an AzureCommunicationCallAdapter for your Calling experience
     */
    widgetAdapterArgs: WidgetAdapterArgs;
    /**
     * Custom render function for displaying logo.
     * @returns
     */
    onRenderLogo?: () => JSX.Element;
}

/**
 * Widget for Calling Widget
 * @param props
 */
export const CallingWidgetComponent = (
    props: CallingWidgetComponentProps
): JSX.Element => {
    const { onRenderLogo, widgetAdapterArgs } = props;

    const [widgetState, setWidgetState] = useState<'new' | 'setup' | 'inCall'>('new');
    const [displayName, setDisplayName] = useState<string>();
    const [consentToData, setConsentToData] = useState<boolean>(false);
    const [useLocalVideo, setUseLocalVideo] = useState<boolean>(false);

    const theme = useTheme();

    // add this before the React template
    const credential = useMemo(() => {
        try {
            return new AzureCommunicationTokenCredential(widgetAdapterArgs.token);
        } catch {
            console.error('Failed to construct token credential');
            return undefined;
        }
    }, [widgetAdapterArgs.token]);

    const callAdapterArgs = useMemo(() => {
        return {
            userId: widgetAdapterArgs.userId,
            credential: credential,
            locator: { participantIds: [`28:orgid:${widgetAdapterArgs.teamsAppIdentifier.teamsAppId}`] },
            displayName: displayName
        }
    }, [widgetAdapterArgs.userId, widgetAdapterArgs.teamsAppIdentifier.teamsAppId, credential, displayName]);

    const afterCreate = useCallback(async (adapter: CallAdapter): Promise<CallAdapter> => {
        adapter.on('callEnded', () => {
            setDisplayName(undefined);
            setWidgetState('new');
        });
        return adapter;
    }, [])

    const adapter = useAzureCommunicationCallAdapter(callAdapterArgs as AzureCommunicationCallAdapterArgs, afterCreate);

    /** widget template for when widget is open, put any fields here for user information desired */
    if (widgetState === 'setup') {
        return (
            <Stack styles={callingWidgetSetupContainerStyles(theme)} tokens={{ childrenGap: '1rem' }}>
                <IconButton
                    styles={collapseButtonStyles}
                    iconProps={{ iconName: 'Dismiss' }}
                    onClick={() => setWidgetState('new')} />
                <Stack tokens={{ childrenGap: '1rem' }} styles={logoContainerStyles}>
                    <Stack style={{ transform: 'scale(1.8)' }}>{onRenderLogo && onRenderLogo()}</Stack>
                </Stack>
                <TextField
                    label={'Name'}
                    required={true}
                    placeholder={'Enter your name'}
                    onChange={(_, newValue) => {
                        setDisplayName(newValue);
                    }} />
                <Checkbox
                    styles={checkboxStyles(theme)}
                    label={'Use video - Checking this box will enable camera controls and screen sharing'}
                    onChange={(_, checked?: boolean | undefined) => {
                        setUseLocalVideo(true);
                    }}
                />
                <Checkbox
                    required={true}
                    styles={checkboxStyles(theme)}
                    label={'By checking this box, you are consenting that we will collect data from the call for customer support reasons'}
                    onChange={(_, checked?: boolean | undefined) => {
                        setConsentToData(!!checked);
                    }}
                />
                <PrimaryButton
                    styles={startCallButtonStyles(theme)}
                    onClick={() => {
                        if (displayName && consentToData && adapter && widgetAdapterArgs.teamsAppIdentifier) {
                            setWidgetState('inCall');
                            console.log(callAdapterArgs.locator);
                            adapter.startCall([`28:orgid:${widgetAdapterArgs.teamsAppIdentifier.teamsAppId}`]);
                        }
                    }}
                >
                    StartCall
                </PrimaryButton>
            </Stack>
        );
    }

    if (widgetState === 'inCall' && adapter) {
        return (
            <Stack styles={callingWidgetInCallContainerStyles(theme)}>
                <CallComposite
                    adapter={adapter}
                    options={{
                        callControls: {
                            cameraButton: useLocalVideo,
                            screenShareButton: useLocalVideo,
                            moreButton: false,
                            peopleButton: false,
                            displayType: 'compact'
                        },
                        localVideoTile: !useLocalVideo ? false : { position: 'floating' }
                    }} />
            </Stack>
        )
    }

    return (
        <Stack
            horizontalAlign="center"
            verticalAlign="center"
            styles={callingWidgetContainerStyles(theme)}
            onClick={() => {
                setWidgetState('setup');
            }}
        >
            <Stack
                horizontalAlign="center"
                verticalAlign="center"
                style={{ height: '4rem', width: '4rem', borderRadius: '50%', background: theme.palette.themePrimary }}
            >
                <Icon iconName="callAdd" styles={callIconStyles(theme)} />
            </Stack>
        </Stack>
    );

};
