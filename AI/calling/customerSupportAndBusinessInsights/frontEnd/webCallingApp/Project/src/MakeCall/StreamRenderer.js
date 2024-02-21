import React from "react";
import { utils } from '../Utils/Utils';
import { VideoStreamRenderer } from "@azure/communication-calling";
import CustomVideoEffects from "./RawVideoAccess/CustomVideoEffects";
import VideoReceiveStats from './VideoReceiveStats';

export default class StreamRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.stream = props.stream;
        this.remoteParticipant = props.remoteParticipant;
        this.componentId = `${utils.getIdentifierText(this.remoteParticipant.identifier)}-${this.stream.mediaStreamType}-${this.stream.id}`;
        this.videoContainerId = this.componentId + '-videoContainer';
        this.videoContainer = undefined;
        this.renderer = undefined;
        this.view = undefined;
        this.dominantSpeakerMode = props.dominantSpeakerMode;
        this.dominantRemoteParticipant = props.dominantRemoteParticipant;
        this.loadingSpinner = document.createElement('div');
        this.loadingSpinner.className = 'remote-video-loading-spinner';
        this.state = {
            isSpeaking: false,
            displayName: this.remoteParticipant.displayName?.trim(),
            videoStats: undefined
        };
        this.call = props.call;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.dominantSpeakerMode !== prevProps.dominantSpeakerMode) {
            this.dominantSpeakerMode = prevProps.dominantSpeakerMode
        }

        if (this.dominantRemoteParticipant !== prevProps.dominantRemoteParticipant) {
            this.dominantRemoteParticipant = prevProps.dominantRemoteParticipant
        }
    }

    /**
     * Start stream after DOM has rendered
     */
    async componentDidMount() {
        document.getElementById(this.componentId).hidden = true;
        this.videoContainer = document.getElementById(this.videoContainerId);

        this.remoteParticipant.on('isSpeakingChanged', () => {
            this.setState({ isSpeaking: this.remoteParticipant.isSpeaking });
        });

        this.remoteParticipant.on('isMutedChanged', () => {
            if (this.remoteParticipant.isMuted) {
                this.setState({ isSpeaking: false });
            }
        });
        this.remoteParticipant.on('displayNameChanged', () => {
            this.setState({ displayName: this.remoteParticipant.displayName?.trim() });
        })

        console.log(`[App][StreamMedia][id=${this.stream.id}] handle new stream`);
        console.log(`[App][StreamMedia][id=${this.stream.id}] stream info - ` + 
                    `streamId=${this.stream.id}, streamType=${this.stream.mediaStreamType}, ` + 
                    `isAvailable=${this.stream.isAvailable}, isReceiving=${this.stream.isReceiving}`);

        /**
         * This feature is alpha
         * @beta
         */
        console.log(`[App][StreamMedia][id=${this.stream.id}] subscribing to isRenderingChanged`);
        this.stream.on('isReceivingChanged', () => {
            try {
                if (this.stream.isAvailable) {
                    const isReceiving = this.stream.isReceiving;
                    const isLoadingSpinnerActive = this.videoContainer.contains(this.loadingSpinner);
                    if (!isReceiving && !isLoadingSpinnerActive) {
                        this.videoContainer.appendChild(this.loadingSpinner);
                    } else if (isReceiving && isLoadingSpinnerActive) {
                        this.videoContainer.removeChild(this.loadingSpinner);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });

        console.log(`[App][StreamMedia][id=${this.stream.id}] subscribing to isAvailableChanged`);
        this.stream.on('isAvailableChanged', async () => {
            try {
                if(this.dominantSpeakerMode && this.dominantRemoteParticipant !== this.remoteParticipant) {
                    return;
                }

                console.log(`[App][StreamMedia][id=${this.stream.id}][isAvailableChanged] triggered`);
                if (this.stream.isAvailable && !this.renderer) {
                    console.log(`[App][StreamMedia][id=${this.stream.id}][isAvailableChanged] isAvailable=${this.stream.isAvailable}`);
                    await this.createRenderer();
                    this.attachRenderer();
                } else {
                    console.log(`[App][StreamMedia][id=${this.stream.id}][isAvailableChanged] isAvailable=${this.stream.isAvailable}`);
                    this.disposeRenderer();
                }
            } catch (e) {
                console.error(e);
            }
        });

        if(this.dominantSpeakerMode && this.dominantRemoteParticipant !== this.remoteParticipant) {
            return;
        }

        try {
            console.log(`[App][StreamMedia][id=${this.stream.id}] checking initial value - isAvailable=${this.stream.isAvailable}`);
            if (this.stream.isAvailable && !this.renderer) {
                await this.createRenderer();
                this.attachRenderer();
            }
        } catch (e) {
            console.error(e);
        }
    }

    getRenderer() {
        return this.renderer;
    }

    updateReceiveStats(videoStats) {
        if (this.state.videoStats !== videoStats) {
            this.setState({ videoStats });
        }
    }

    async createRenderer() {
        console.info(`[App][StreamMedia][id=${this.stream.id}][renderStream] attempt to render stream type=${this.stream.mediaStreamType}, id=${this.stream.id}`);
        if (!this.renderer) {
            this.renderer = new VideoStreamRenderer(this.stream);
            this.view = await this.renderer.createView();
            console.info(`[App][StreamMedia][id=${this.stream.id}][renderStream] createView resolved, appending view`);
        } else {
            throw new Error(`[App][StreamMedia][id=${this.stream.id}][createRenderer] stream already has a renderer`);
        }
    }

    async attachRenderer() {
        console.info(`[App][StreamMedia][id=${this.stream.id}][attachRenderer] attempt to attach view=${this.view.target}, id=${this.stream.id} to DOM, under container id=${this.videoContainerId}`);
        try {
            if(!this.view.target) {
                throw new Error(`[App][StreamMedia][id=${this.stream.id}][attachRenderer] target is undefined. Must create renderer first`);
            }
            document.getElementById(this.componentId).hidden = false;
            document.getElementById(this.videoContainerId).appendChild(this.view.target);
        } catch (e) {
            console.error(e);
        }
    }

    disposeRenderer() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = undefined;
            document.getElementById(this.componentId).hidden = true;
        } else {
            console.warn(`[App][StreamMedia][id=${this.stream.id}][disposeRender] no renderer to dispose`);
        }
    }

    render() {
        return (
            <div id={this.componentId} className={`py-3 ms-Grid-col ms-sm-12 ms-lg12 ms-xl12 ${this.stream.mediaStreamType === 'ScreenSharing' ? `ms-xxl12` : `ms-xxl6`}`}>
                <div className={`remote-video-container ${this.state.isSpeaking ? `speaking-border-for-video` : ``}`} id={this.videoContainerId}>
                    <h4 className="video-title">
                        {this.state.displayName ? this.state.displayName : utils.getIdentifierText(this.remoteParticipant.identifier)}
                    </h4>
                    {
                        this.state.videoStats &&
                        <h4 className="video-stats">
                            <VideoReceiveStats videoStats={this.state.videoStats} />
                        </h4>
                    }
                </div>
                <CustomVideoEffects call={this.call} videoContainerId={this.videoContainerId} remoteParticipantId={this.remoteParticipant.identifier}/>
            </div>
        );
    }
}



