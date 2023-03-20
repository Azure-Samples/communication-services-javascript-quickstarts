import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { utils } from '../utils/common';
import { VideoStreamRenderer } from "@azure/communication-calling";

export const StreamRendererComponent = forwardRef(({
    remoteParticipant,
    stream
}, ref) => {
    const componentId = `${utils.getIdentifierText(remoteParticipant.identifier)}-${stream.mediaStreamType}-${stream.id}`;
    const videoContainerId = componentId + '-videoContainer';
    const componentContainer = useRef(null);
    const videoContainer = useRef(null);
    const [renderer, setRenderer] = useState();
    const [view, setView] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(!!remoteParticipant?.isSpeaking);
    const [isMuted, setIsMuted] = useState(!!remoteParticipant?.isMuted);
    const [displayName, setDisplayName] = useState(remoteParticipant?.displayName?.trim() ?? '');
    const [videoStats, setVideoStats] = useState();

    useEffect(() => {
        initializeComponent();
        return () => {
            stream.off('isReceivingChanged', isReceivingChanged);
            stream.off('isAvailableChanged', isAvailableChanged);
            remoteParticipant.off('isSpeakingChanged', isSpeakingChanged);
            remoteParticipant.off('isMutedChanged', isMutedChanged);
            remoteParticipant.off('displayNameChanged', isDisplayNameChanged);
            if (renderer) {
                disposeRenderer();
            }
        }
    }, []);

    useEffect(() => {
        const createView = async () => {
            if (renderer) {
                const createdView = await renderer.createView();
                setView(createdView);
            }
        };
        createView();
    }, [renderer]);

    useEffect(() => {
        if (view) {
            attachRenderer();
        }
    }, [view]);

    const createRenderer = () => {
        if (!renderer) {
            const videoRenderer = new VideoStreamRenderer(stream);
            setRenderer(videoRenderer);
        } else {
            throw new Error(`[App][StreamMedia][id=${stream.id}][createRenderer] stream already has a renderer`);
        }
    }

    const attachRenderer = () => {
        try {
            if (!view.target) {
                throw new Error(`[App][StreamMedia][id=${stream.id}][attachRenderer] target is undefined. Must create renderer first`);
            } else {
                componentContainer.current.style.display = 'block';
                videoContainer.current.appendChild(view?.target);
            }
        } catch (e) {
            console.error(e);
        }
    }

    const disposeRenderer = async () => {
        if (videoContainer.current && componentContainer.current) {
            videoContainer.current.innerHTML = '';
            componentContainer.current.style.display = 'none';
        }
        if (renderer) {
            await renderer.dispose();
        } else {
            console.warn(`[App][StreamMedia][id=${stream.id}][disposeRender] no renderer to dispose`);
        }
    }
    const isReceivingChanged = () => {
        try {
            if (view && stream) {
                setIsLoading(stream.isAvailable && !stream.isReceiving);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const isAvailableChanged = async () => {
        try {
            if (stream.isAvailable && !renderer) {
                console.log(`[App][StreamMedia][id=${stream.id}][isAvailableChanged] isAvailable=${stream.isAvailable}`);
                createRenderer();
            } else if (!stream.isAvailable) {
                disposeRenderer();
                if (videoStats) {
                    setVideoStats(null);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const isMutedChanged = () => {
        setIsMuted(remoteParticipant && remoteParticipant?.isMuted);
    };

    const isSpeakingChanged = () => {
        setIsSpeaking(remoteParticipant && remoteParticipant.isSpeaking);
    }

    const isDisplayNameChanged = () => {
        setDisplayName(remoteParticipant.displayName.trim());
    }
    /**
     * Start stream after DOM has rendered
     */
    const initializeComponent = async () => {
        stream.on('isReceivingChanged', isReceivingChanged);

        stream.on('isAvailableChanged', isAvailableChanged);

        remoteParticipant.on('isMutedChanged', isMutedChanged);

        remoteParticipant.on('isSpeakingChanged', isSpeakingChanged);

        try {
            if (stream.isAvailable && !renderer) {
                createRenderer();
            }
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div id={componentId} ref={componentContainer} className={`stream-container py-3 ms-Grid-col ms-sm-12 ms-lg12 ms-xl12 ${stream.mediaStreamType === 'ScreenSharing' ? `ms-xxl12` : `ms-xxl6`}`}>
            <div className={`remote-video-container ${isSpeaking && !isMuted ? `speaking-border-for-video` : ``}`} id={videoContainerId} ref={videoContainer}>
                <h4 className="video-title">
                    {displayName ? displayName : remoteParticipant.displayName ? remoteParticipant.displayName : utils.getIdentifierText(remoteParticipant.identifier)}
                </h4>
                {
                    isLoading && <div className="remote-video-loading-spinner"></div>
                }
            </div>
        </div>
    );
});
