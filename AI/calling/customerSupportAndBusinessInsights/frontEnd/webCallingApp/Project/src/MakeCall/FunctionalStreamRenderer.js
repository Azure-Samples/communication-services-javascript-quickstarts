import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { utils } from '../Utils/Utils';
import { VideoStreamRenderer } from "@azure/communication-calling";
import CustomVideoEffects from "./RawVideoAccess/CustomVideoEffects";
import VideoReceiveStats from './VideoReceiveStats';

export const FunctionalStreamRenderer = forwardRef(({
    remoteParticipant,
    stream,
    dominantRemoteParticipant,
    dominantSpeakerMode,
    call,
    showMediaStats
}, ref) => {
    const componentId = `${utils.getIdentifierText(remoteParticipant.identifier)}-${stream.mediaStreamType}-${stream.id}`;
    const videoContainerId = componentId + '-videoContainer';
    const componentContainer = useRef(null);
    const videoContainer = useRef(null);
    let renderer;
    let view;
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(!!remoteParticipant?.isSpeaking);
    const [isMuted, setIsMuted] = useState(!!remoteParticipant?.isMuted);
    const [displayName, setDisplayName] = useState(remoteParticipant?.displayName?.trim() ?? '');
    const [videoStats, setVideoStats] = useState();

    useEffect(() => {
        initializeComponent();
        return () => {
            stream.off('isReceivingChanged', isReceivingChanged);
            remoteParticipant.off('isSpeakingChanged', isSpeakingChanged);
            remoteParticipant.off('isMutedChanged', isMutedChanged);
            remoteParticipant.off('displayNameChanged', isDisplayNameChanged);
            if (renderer) {
                disposeRenderer();
            }
        }
    }, []);

    const getRenderer = () => {
        return view;
    }

    const createRenderer = async () => {
        if (!renderer) {
            renderer = new VideoStreamRenderer(stream);
            view = await renderer.createView();
            return view;
        } else {
            throw new Error(`[App][StreamMedia][id=${stream.id}][createRenderer] stream already has a renderer`);
        }
    }

    const attachRenderer = (v) => {
        try {
            if (v) {
                view = v;
            }

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

    const disposeRenderer = () => {
        if (videoContainer.current && componentContainer.current) {
            videoContainer.current.innerHTML = '';
            componentContainer.current.style.display = 'none';
        }
        if (renderer) {
            renderer.dispose();
        } else {
            console.warn(`[App][StreamMedia][id=${stream.id}][disposeRender] no renderer to dispose`);
        }
    }
    const isReceivingChanged = () => {
        try {
            if (stream?.isAvailable) {
                setIsLoading(!stream.isReceiving);
            } else {
                setIsLoading(false);
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
        remoteParticipant.on('isMutedChanged', isMutedChanged);
        remoteParticipant.on('isSpeakingChanged', isSpeakingChanged);
        if (dominantSpeakerMode && dominantRemoteParticipant !== remoteParticipant) {
            return;
        }

        try {
            if (stream.isAvailable && !renderer) {
                await createRenderer();
                attachRenderer();
            }
        } catch (e) {
            console.error(e);
        }
    }

    useImperativeHandle(ref, () => ({
        updateReceiveStats(videoStatsReceived) {
            if (videoStatsReceived) {
                if (videoStatsReceived !== videoStats && stream.isAvailable) {
                    setVideoStats(videoStatsReceived);
                }
            }
        },
        getRenderer,
        createRenderer,
        attachRenderer,
        disposeRenderer
    }));

    if (stream.isAvailable) {
        return (
            <div id={componentId} ref={componentContainer} className={`stream-container ${stream.mediaStreamType === 'ScreenSharing' ? `ms-xxl12` : ``} ${stream.isAvailable ? 'rendering' : ''}`}>
                <div className={`remote-video-container ${isSpeaking && !isMuted ? `speaking-border-for-video` : ``}`} id={videoContainerId} ref={videoContainer}>
                    <h4 className="video-title">
                        {displayName ? displayName : remoteParticipant.displayName ? remoteParticipant.displayName : utils.getIdentifierText(remoteParticipant.identifier)}
                    </h4>
                    <CustomVideoEffects
                        stream={stream}
                        buttons={{
                            add: {
                                label: "Set B/W effect",
                                disabled: false
                            },
                            remove: {
                                label: "Remove B/W effect", 
                                disabled: false
                            }
                        }}
                        isLocal={false}
                        videoContainerId={videoContainerId}/>
                    {
                        isLoading && <div className="remote-video-loading-spinner"></div>
                    }
                </div>
                {
                    videoStats && showMediaStats &&
                    <h4 className="video-stats">
                        <VideoReceiveStats videoStats={videoStats} />
                    </h4>
                }
            </div>
        );
    }
    return <></>;
});
