import React from 'react';
import { PrimaryButton, Dropdown } from 'office-ui-fabric-react';
import { Features } from '@azure/communication-calling';
import { BackgroundBlurEffect, BackgroundReplacementEffect } from '@azure/communication-calling-effects';
import VideoEffectsImagePicker from './VideoEffectsImagePicker';

export const LoadingSpinner = () => {
    return (
        <div className='video-effects-loading-spinner'></div>
    )
};

export default class VideoEffectsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.localVideoStreamFeatureApi = null;

        this.state = {
            selectedVideoEffect: null,
            supportedVideoEffects: [],
            supportedVideoEffectsPopulated: false,
            videoEffectsList: [],
            startEffectsLoading: false,
            stopEffectsLoading: false
        };

        this.initLocalVideoStreamFeatureApi();
    }

    componentDidCatch(e) {
        this.logError(JSON.stringify(e));
    }

    componentDidMount() {
        this.populateVideoEffects();
    }

    logError(error) {
        this.setState({
            ...this.state,
        });

        console.error(error);
    }

    initLocalVideoStreamFeatureApi() {
        const localVideoStream =  this.call.localVideoStreams.find(v => { return v.mediaStreamType === 'Video'});

        if (!localVideoStream) {
            this.logError('No local video streams found.');
            return;
        }
        const lvsFeatureApi = localVideoStream.feature && localVideoStream.feature(Features?.VideoEffects);
        if (!lvsFeatureApi) {
            this.logError('Could not get local video stream feature API.');
            return;
        }
        this.localVideoStreamFeatureApi = lvsFeatureApi;

        this.localVideoStreamFeatureApi.on('effectsError', (error) => {
            this.logError(JSON.stringify(error));
            this.setState({
                ...this.state,
                startEffectsLoading: false,
                stopEffectsLoading: false
            });
        });

        this.localVideoStreamFeatureApi.on('effectsStarted', () => {
            this.setState({
                ...this.state,
                startEffectsLoading: false
            });
        });

        this.localVideoStreamFeatureApi.on('effectsStopped', () => {
            this.setState({
                ...this.state,
                stopEffectsLoading: false
            });
        });
    }

    async populateVideoEffects() {
        const supported = [];
        const backgroundBlur = new BackgroundBlurEffect();
        const isBackgroundBlurSupported = await backgroundBlur.isSupported();
        if (isBackgroundBlurSupported) {
            supported.push(backgroundBlur);
        }

        const backgroundReplacement = new BackgroundReplacementEffect({
            backgroundImageUrl: '../assets/images/ACSBackdrop.png'
        });
        const isBackgroundReplacementSupported = await backgroundReplacement.isSupported();
        if (isBackgroundReplacementSupported) {
            supported.push(backgroundReplacement);
        }

        const videoEffectsList = supported.map(effect => {
            return {
                key: effect.name,
                text: effect.name.replace('Background', 'Background ')
            }
        });

        this.setState({
            ...this.state,
            supportedVideoEffects: [ ...supported ],
            supportedVideoEffectsPopulated: true,
            selectedVideoEffect: supported[0].name,
            videoEffectsList
        });
    }

    effectSelectionChanged(event, item) {
        const newSelection = this.state.supportedVideoEffects.find(effect => effect.name === item.key);
        if (newSelection) {
            this.setState({
                ...this.state,
                selectedVideoEffect: newSelection
            });
        }
    }

    async startEffects() {
        if (!this.localVideoStreamFeatureApi) {
            this.logError('Feature api not found.');
            return;
        }

        this.setState({
            ...this.state,
            startEffectsLoading: true
        });

        await this.localVideoStreamFeatureApi.startEffects(this.state.selectedVideoEffect);
    }

    async stopEffects() {
        if (!this.localVideoStreamFeatureApi) {
            this.logError('Feature api not found.');
            return;
        }

        this.setState({
            ...this.state,
            stopEffectsLoading: true
        });

        await this.localVideoStreamFeatureApi.stopEffects();
    }

    async handleImageClick(imageLocation) {
        if (this.state.selectedVideoEffect.name !== 'BackgroundReplacement') {
            this.logError('Wrong effect selected.');
            return;
        }

        await this.state.selectedVideoEffect.configure({
            backgroundImageUrl: imageLocation
        });
    }

    render() {
        return (
            <div>
                <h4>Video effects</h4>
                {this.state.supportedVideoEffects.length > 0 ?
                    <div>
                        <Dropdown
                            onChange={(e, item) => this.effectSelectionChanged(e, item)}
                            options={this.state.videoEffectsList}
                            placeHolder={'Select an option'}
                            styles={{ dropdown: { width: 300, color: 'black' } }}
                        />
                        <PrimaryButton
                            className='secondary-button mt-2'
                            onClick={() => this.startEffects()}
                        >
                            {this.state.startEffectsLoading ? <LoadingSpinner /> : 'Start Effects'}
                        </PrimaryButton>

                        <PrimaryButton
                            className='secondary-button mt-2'
                            onClick={() => this.stopEffects()}
                        >
                            {this.state.stopEffectsLoading ? <LoadingSpinner /> : 'Stop Effects'}
                        </PrimaryButton>
                        <VideoEffectsImagePicker 
                            disabled={this.state.selectedVideoEffect.name !== 'BackgroundReplacement'}
                            handleImageClick={(imageLocation) => this.handleImageClick(imageLocation)}
                        />
                    </div>
                    :
                    <div>Background Blur/Replacement are only supported on Windows Chrome, Windows Edge, MacOS Chrome, MacOS Edge, and MacOS Safari</div>
                }
            </div>
        );
    }
}
