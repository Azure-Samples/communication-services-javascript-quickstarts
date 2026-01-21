import React from 'react';
import { Features, LocalAudioStream } from '@azure/communication-calling';
import { 
    EchoCancellationEffect,
    DeepNoiseSuppressionEffect
} from '@azure/communication-calling-effects';
import { Dropdown, PrimaryButton } from '@fluentui/react';

export const LoadingSpinner = () => {
    return (
        <div className='audio-effects-loading-spinner'></div>
    );
};

export default class AudioEffectsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.deviceManager = props.deviceManager;
        this.localAudioStreamFeatureApi = null;
        this.localAudioStream = null;

        this.state = {
            supportedAudioEffects: [],
            supportedAudioEffectsPopulated: false,
            autoGainControl: {
                startLoading: false,
                stopLoading: false,
                autoGainControlList: [],
                currentSelected: undefined
            },
            echoCancellation: {
                startLoading: false,
                stopLoading: false,
                echoCancellationList: [],
                currentSelected: undefined
            },
            noiseSuppression: {
                startLoading: false,
                stopLoading: false,
                noiseSuppressionList: [],
                currentSelected: undefined
            },
            activeEffects: {
                autoGainControl: [],
                echoCancellation: [],
                noiseSuppression: []
            }
        };

        this.initLocalAudioStreamFeatureApi();
    }

    componentDidCatch(e) {
        this.logError(JSON.stringify(e));
    }

    componentDidMount() {
        this.populateAudioEffects();
    }

    logError(error) {
        console.error(error);
    }

    logWarn(error) {
        console.warn(error);
    }

    initLocalAudioStreamFeatureApi() {
        const localAudioStream = this.call.localAudioStreams.find(a => {
            return a.mediaStreamType === 'Audio';
        });

        if (!localAudioStream) {
            this.logWarn('No local audio streams found, creating a new one..');
            const selectedMicrophone = this.deviceManager.selectedMicrophone;
            if (selectedMicrophone) {
                this.localAudioStream = new LocalAudioStream(selectedMicrophone);
            } else {
                this.logWarn('No selected microphone found, cannot create LocalAudioStream');
                return;
            }
        } else {
            this.localAudioStream = localAudioStream;
        }

        const lasFeatureApi = this.localAudioStream.feature && this.localAudioStream.feature(Features?.AudioEffects);
        if (!lasFeatureApi) {
            this.logError('Could not get local audio stream feature API.');
            return;
        }
        this.localAudioStreamFeatureApi = lasFeatureApi;

        this.localAudioStreamFeatureApi.on('effectsError', (error) => {
            this.logError(JSON.stringify(error));
        });

        this.localAudioStreamFeatureApi.on('effectsStarted', (effect) => {
            this.updateActiveEffects();
            console.log(`Audio effects started: ${JSON.stringify(effect?.name ?? effect)}`);
        });

        this.localAudioStreamFeatureApi.on('effectsStopped', (effect) => {
            this.updateActiveEffects();
            console.log(`Audio effects stopped: ${JSON.stringify(effect?.name ?? effect)}`);
        });
    }

    updateActiveEffects() {
        this.setState({
            activeEffects: {
                autoGainControl: this.localAudioStreamFeatureApi?.activeEffects?.autoGainControl,
                echoCancellation: this.localAudioStreamFeatureApi?.activeEffects?.echoCancellation,
                noiseSuppression: this.localAudioStreamFeatureApi?.activeEffects?.noiseSuppression
            }
        });
    }

    async populateAudioEffects() {
        const supported = [];

        const autoGainControlList = [];
        const echoCancellationList = [];
        const noiseSuppressionList = [];

        if (this.localAudioStreamFeatureApi) {
            if (await this.localAudioStreamFeatureApi.isSupported('BrowserAutoGainControl')) {
                supported.push('BrowserAutoGainControl');
                autoGainControlList.push({
                    key: 'BrowserAutoGainControl',
                    text: 'Browser Auto Gain Control'
                });
            }

            if (await this.localAudioStreamFeatureApi.isSupported('BrowserEchoCancellation')) {
                supported.push('BrowserEchoCancellation');
                echoCancellationList.push({
                    key: 'BrowserEchoCancellation',
                    text: 'Browser Echo Cancellation'
                });
            }

            if (await this.localAudioStreamFeatureApi.isSupported('BrowserNoiseSuppression')) {
                supported.push('BrowserNoiseSuppression');
                noiseSuppressionList.push({
                    key: 'BrowserNoiseSuppression',
                    text: 'Browser Noise Suppression'
                });
            }

            const echoCancellation = new EchoCancellationEffect();
            if (await this.localAudioStreamFeatureApi.isSupported(echoCancellation)) {
                supported.push(echoCancellation);
                echoCancellationList.push({
                    key: echoCancellation.name,
                    text: 'Echo Cancellation'
                });
            }

            const deepNoiseSuppression = new DeepNoiseSuppressionEffect();
            if (await this.localAudioStreamFeatureApi.isSupported(deepNoiseSuppression)) {
                supported.push(deepNoiseSuppression);
                noiseSuppressionList.push({
                    key: deepNoiseSuppression.name,
                    text: 'Deep Noise Suppression'
                });
            }

            this.setState({
                supportedAudioEffects: [ ...supported ],
                supportedAudioEffectsPopulated: true,
                autoGainControl: {
                    ...this.state.autoGainControl,
                    autoGainControlList
                },
                echoCancellation: {
                    ...this.state.echoCancellation,
                    echoCancellationList
                },
                noiseSuppression: {
                    ...this.state.noiseSuppression,
                    noiseSuppressionList
                },
                activeEffects: {
                    autoGainControl: this.localAudioStreamFeatureApi?.activeEffects?.autoGainControl,
                    echoCancellation: this.localAudioStreamFeatureApi?.activeEffects?.echoCancellation,
                    noiseSuppression: this.localAudioStreamFeatureApi?.activeEffects?.noiseSuppression
                }
            });
        }
    }

    findEffectFromSupportedList(name) {
        const effect = this.state.supportedAudioEffects.find((supportedEffect) => {
            if (typeof supportedEffect === 'string' && supportedEffect === name) {
                return true;
            } else if (typeof supportedEffect === 'object' && supportedEffect.name && supportedEffect.name === name) {
                return true;
            }
        });

        return effect;
    }

    /* ------------ AGC control functions - start ---------------- */
    agcSelectionChanged(e, item) {
        const effect = this.findEffectFromSupportedList(item.key);
        if (effect) {
            this.setState({
                autoGainControl: {
                    ...this.state.autoGainControl,
                    currentSelected: effect
                }
            });
        }
    }

    async startAgc() {
        this.setState({
            autoGainControl: {
                ...this.state.autoGainControl,
                startLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.startEffects({
                autoGainControl: this.state.autoGainControl.currentSelected
            });
        }

        this.setState({
            autoGainControl: {
                ...this.state.autoGainControl,
                startLoading: false
            }
        });
    }

    async stopAgc() {
        this.setState({
            autoGainControl: {
                ...this.state.autoGainControl,
                stopLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.stopEffects({
                autoGainControl: true
            });
        }

        this.setState({
            autoGainControl: {
                ...this.state.autoGainControl,
                stopLoading: false
            }
        });
    }
    /* ------------ AGC control functions - end ---------------- */

    /* ------------ EC control functions - start ---------------- */
    ecSelectionChanged(e, item) {
        const effect = this.findEffectFromSupportedList(item.key);
        if (effect) {
            this.setState({
                echoCancellation: {
                    ...this.state.echoCancellation,
                    currentSelected: effect
                }
            });
        }
    }

    async startEc() {
        this.setState({
            echoCancellation: {
                ...this.state.echoCancellation,
                startLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.startEffects({
                echoCancellation: this.state.echoCancellation.currentSelected
            });
        }

        this.setState({
            echoCancellation: {
                ...this.state.echoCancellation,
                startLoading: false
            }
        });
    }

    async stopEc() {
        this.setState({
            echoCancellation: {
                ...this.state.echoCancellation,
                stopLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.stopEffects({
                echoCancellation: true
            });
        }

        this.setState({
            echoCancellation: {
                ...this.state.echoCancellation,
                stopLoading: false
            }
        });
    }
    /* ------------ EC control functions - end ---------------- */

    /* ------------ NS control functions - start ---------------- */
    nsSelectionChanged(e, item) {
        const effect = this.findEffectFromSupportedList(item.key);
        if (effect) {
            this.setState({
                noiseSuppression: {
                    ...this.state.noiseSuppression,
                    currentSelected: effect
                }
            });
        }
    }

    async startNs() {
        this.setState({
            noiseSuppression: {
                ...this.state.noiseSuppression,
                startLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.startEffects({
                noiseSuppression: this.state.noiseSuppression.currentSelected
            });
        }

        this.setState({
            noiseSuppression: {
                ...this.state.noiseSuppression,
                startLoading: false
            }
        });
    }

    async stopNs() {
        this.setState({
            noiseSuppression: {
                ...this.state.noiseSuppression,
                stopLoading: true
            }
        });

        if (this.localAudioStreamFeatureApi) {
            await this.localAudioStreamFeatureApi.stopEffects({
                noiseSuppression: true
            });
        }

        this.setState({
            noiseSuppression: {
                ...this.state.noiseSuppression,
                stopLoading: false
            }
        });
    }
    /* ------------ NS control functions - end ---------------- */

    render() {
        return (
            <>
                {this.state.supportedAudioEffects.length > 0 ?
                    <div>
                        <div className='ms-Grid-row'>
                            <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg4'>
                                <h4>Current active:</h4>
                            </div>
                        </div>
                        <div className='ms-Grid-row' style={{ marginBottom: '1rem' }}>
                            {this.state.activeEffects.autoGainControl?.length > 0 &&
                            <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg4'>
                                {this.state.activeEffects.autoGainControl[0]}
                            </div>
                            }
                            {this.state.activeEffects.echoCancellation?.length > 0 &&
                            <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg4'>
                                {this.localAudioStreamFeatureApi.activeEffects.echoCancellation[0]}
                            </div>
                            }
                            {this.state.activeEffects.noiseSuppression?.length > 0 &&
                            <div className='ms-Grid-col ms-sm4 ms-md4 ms-lg4'>
                                {this.state.activeEffects.noiseSuppression[0]}
                            </div>
                            }
                        </div>
                        <div className='ms-Grid-row'>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <Dropdown
                                    label='Auto Gain Control'
                                    onChange={(e, item) => this.agcSelectionChanged(e, item)}
                                    options={this.state.autoGainControl.autoGainControlList}
                                    placeholder={'Select an option'}
                                    styles={{ dropdown: { width: 300, color: 'black' }, label: { color: 'white' } }}
                                />
                            </div>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.startAgc()}
                                >
                                    {this.state.autoGainControl.startLoading ? <LoadingSpinner /> : 'Start AGC'}
                                </PrimaryButton>

                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.stopAgc()}
                                >
                                    {this.state.autoGainControl.stopLoading ? <LoadingSpinner /> : 'Stop AGC'}
                                </PrimaryButton>
                            </div>
                        </div>
                        
                        <div className='ms-Grid-row'>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <Dropdown
                                    label='Echo Cancellation'
                                    onChange={(e, item) => this.ecSelectionChanged(e, item)}
                                    options={this.state.echoCancellation.echoCancellationList}
                                    placeholder={'Select an option'}
                                    styles={{ dropdown: { width: 300, color: 'black' }, label: { color: 'white' } }}
                                />
                            </div>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.startEc()}
                                >
                                    {this.state.echoCancellation.startLoading ? <LoadingSpinner /> : 'Start EC'}
                                </PrimaryButton>

                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.stopEc()}
                                >
                                    {this.state.echoCancellation.stopLoading ? <LoadingSpinner /> : 'Stop EC'}
                                </PrimaryButton>
                            </div>
                        </div>

                        <div className='ms-Grid-row'>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <Dropdown
                                    label='Noise Suppression'
                                    onChange={(e, item) => this.nsSelectionChanged(e, item)}
                                    options={this.state.noiseSuppression.noiseSuppressionList}
                                    placeholder={'Select an option'}
                                    styles={{ dropdown: { width: 300, color: 'black' }, label: { color: 'white' } }}
                                />
                            </div>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.startNs()}
                                >
                                    {this.state.noiseSuppression.startLoading ? <LoadingSpinner /> : 'Start NS'}
                                </PrimaryButton>

                                <PrimaryButton
                                    className='secondary-button mt-2'
                                    onClick={() => this.stopNs()}
                                >
                                    {this.state.noiseSuppression.stopLoading ? <LoadingSpinner /> : 'Stop NS'}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                    :
                    <div>
                        Audio effects and enhancements are not supported in the current environment. <br/>
                        They are currently only supported on Windows Chrome, Windows Edge, MacOS Chrome, MacOS Edge and MacOS Safari.
                    </div>
                }
            </>
        )
    }
}
