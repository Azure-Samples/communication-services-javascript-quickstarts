// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { IconButton, PrimaryButton, Stack, TextField, useTheme, Checkbox, Icon } from '@fluentui/react';
import {
    clicktoCallSetupContainerStyles,
    checkboxStyles,
    startCallButtonStyles,
    clickToCallContainerStyles,
    callIconStyles,
    logoContainerStyles,
    collapseButtonStyles,
    clickToCallInCallContainerStyles
} from '../styles/ClickToCallComponent.styles';
import React, { useEffect, useMemo, useCallback } from 'react';
import { useState } from 'react';
import { AdapterArgs } from '../utils/AppUtils';
import { useAzureCommunicationCallAdapter, AzureCommunicationCallAdapterArgs, CallAdapter, CallComposite } from '@azure/communication-react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';

export interface clickToCallComponentProps {
    /**
     *  arguments for creating an AzureCommunicationCallAdapter for your Calling experience
     */
    adapterArgs: AdapterArgs;
    /**
     * if provided, will be used to create a new window for call experience. if not provided
     * will use the current window.
     */
    onRenderStartCall?: () => void;
    /**
     * Custom render function for displaying logo.
     * @returns
     */
    onRenderLogo?: () => JSX.Element;
    /**
     * Handler to set displayName for the user in the call.
     * @param displayName
     * @returns
     */
    onSetDisplayName?: (displayName: string | undefined) => void;
    /**
     * Handler to set whether to use video in the call.
     */
    onSetUseVideo?: (useVideo: boolean) => void;
}

/**
 * Widget for Click to Call
 * @param props
 */
export const ClickToCallComponent = (props: clickToCallComponentProps): JSX.Element => {
    const { adapterArgs, onRenderStartCall, onRenderLogo, onSetDisplayName, onSetUseVideo } = props;

    const [widgetState, setWidgetState] = useState<'new' | 'setup' | 'inCall'>('new');
    const [displayName, setDisplayName] = useState<string>();
    const [useLocalVideo, setUseLocalVideo] = useState<boolean>(false);
    const [consentToData, setConsentToData] = useState<boolean>(false);

    const theme = useTheme();

    const credential = useMemo(() => {
        try {
            return new AzureCommunicationTokenCredential(adapterArgs.token);
        } catch {
            console.error('Failed to construct token credential');
            return undefined;
        }
    }, [adapterArgs.token]);

    const callAdapterArgs = useMemo(() => {
        return {
            userId:adapterArgs.userId,
            credential:  credential,
            locator: adapterArgs.locator,
            displayName: displayName,
            alternateCallerId: adapterArgs.alternateCallerId
        }
    },[adapterArgs.alternateCallerId, adapterArgs.locator, adapterArgs.userId, credential, displayName]);

    const afterCreate = useCallback(async (adapter: CallAdapter): Promise<CallAdapter> => {
        adapter.on('callEnded',() => {
            setDisplayName(undefined);
            setUseLocalVideo(false);
            setWidgetState('new')
        });
        return adapter;
    },[])

    const adapter = useAzureCommunicationCallAdapter(callAdapterArgs as AzureCommunicationCallAdapterArgs, afterCreate);

    useEffect(() => {
        if (widgetState === 'new' && onSetUseVideo) {
            onSetUseVideo(false);
        }
    }, [widgetState, onSetUseVideo]);

    if (widgetState === 'setup' && onSetDisplayName && onSetUseVideo) {
        return (
            <Stack styles={clicktoCallSetupContainerStyles(theme)} tokens={{ childrenGap: '1rem' }}>
                <IconButton
                    styles={collapseButtonStyles}
                    iconProps={{ iconName: 'Dismiss' }}
                    onClick={() => setWidgetState('new')}
                />
                <Stack tokens={{ childrenGap: '1rem' }} styles={logoContainerStyles}>
                    <Stack style={{ transform: 'scale(1.8)' }}>{onRenderLogo && onRenderLogo()}</Stack>
                </Stack>
                <TextField
                    label={'Name'}
                    required={true}
                    placeholder={'Enter your name'}
                    onChange={(_, newValue) => {
                        setDisplayName(newValue);
                    }}
                />
                <Checkbox
                    styles={checkboxStyles(theme)}
                    label={'Use video - Checking this box will enable camera controls and screen sharing'}
                    onChange={(_, checked?: boolean | undefined) => {
                        onSetUseVideo(!!checked);
                        setUseLocalVideo(true);
                    }}
                ></Checkbox>
                <Checkbox
                    required={true}
                    styles={checkboxStyles(theme)}
                    label={
                        'By checking this box you are consenting that we will collect data from the call for customer support reasons'
                    }
                    onChange={(_, checked?: boolean | undefined) => {
                        setConsentToData(!!checked);
                    }}
                ></Checkbox>
                <PrimaryButton
                    styles={startCallButtonStyles(theme)}
                    onClick={() => {
                        if (displayName && consentToData && onRenderStartCall) {
                            onSetDisplayName(displayName);
                            onRenderStartCall();
                        } else if (displayName && consentToData && adapter) {
                            setWidgetState('inCall');
                            // adapter?.joinCall();
                        }
                    }}
                >
                    StartCall
                </PrimaryButton>
            </Stack>
        );
    }

    if(widgetState === 'inCall' && adapter){
        return(
            <Stack styles={clickToCallInCallContainerStyles(theme)}>
                <CallComposite adapter={adapter} options={{
                    callControls: {
                        cameraButton: useLocalVideo,
                        screenShareButton: useLocalVideo,
                        moreButton: false,
                        peopleButton: false,
                        displayType: 'compact'
                    },
                    localVideoTileOptions: { position: !useLocalVideo ? 'hidden' : 'floating' }
                }}></CallComposite>
            </Stack>
        )
    }

    return (
        <Stack
            horizontalAlign="center"
            verticalAlign="center"
            styles={clickToCallContainerStyles(theme)}
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
