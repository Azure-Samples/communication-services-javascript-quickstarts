import React from "react";
import { StreamRendererComponent } from "./StreamRendererComponent";
// import AddParticipantPopover from "./AddParticipantPopover";
import { LocalVideoStream } from '@azure/communication-calling';
import { Button } from "@fluentui/react-components";
import { utils } from "../utils/common";
import { Alert } from "@fluentui/react-components/unstable";

export default class CallComponent extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.deviceManager = props.deviceManager;
        this.state = {
            callState: this.call.state,
            callId: this.call.id,
            remoteParticipants: this.call.remoteParticipants,
            allRemoteParticipantStreams: [],
            videoOn: !!this.call.localVideoStreams[0],
            micMuted: false,
            onHold: this.call.state === 'LocalHold' || this.call.state === 'RemoteHold',
            cameraDeviceOptions: props.cameraDeviceOptions ? props.cameraDeviceOptions : [],
            speakerDeviceOptions: props.speakerDeviceOptions ? props.speakerDeviceOptions : [],
            microphoneDeviceOptions: props.microphoneDeviceOptions ? props.microphoneDeviceOptions : [],
            selectedCameraDeviceId: props.selectedCameraDeviceId,
            selectedSpeakerDeviceId: this.deviceManager.selectedSpeaker?.id,
            selectedMicrophoneDeviceId: this.deviceManager.selectedMicrophone?.id,
            showSettings: false,
            showLocalVideo: false,
            callMessage: undefined
        };
    }

    componentWillUnmount() {
        this.call.off('stateChanged', () => {});
        this.deviceManager.off('videoDevicesUpdated', () => {});
        this.deviceManager.off('audioDevicesUpdated', () => {});
        this.deviceManager.off('selectedSpeakerChanged', () => {});
        this.deviceManager.off('selectedMicrophoneChanged', () => {});
        this.call.off('localVideoStreamsUpdated', () => {});
        this.call.off('idChanged', () => {});
        this.call.off('isMutedChanged', () => {});
        this.call.off('remoteParticipantsUpdated', () => {});
    }

    componentDidMount() {
        if (this.call) {
            this.deviceManager.on('videoDevicesUpdated', async e => {
                let newCameraDeviceToUse = undefined;
                e.added.forEach(addedCameraDevice => {
                    newCameraDeviceToUse = addedCameraDevice;
                    const addedCameraDeviceOption = { key: addedCameraDevice.id, text: addedCameraDevice.name };
                    this.setState(prevState => ({
                        ...prevState,
                        cameraDeviceOptions: [...prevState.cameraDeviceOptions, addedCameraDeviceOption]
                    }));
                });
                // When connecting a new camera, ts device manager automatically switches to use this new camera and
                // this.call.localVideoStream[0].source is never updated. Hence I have to do the following logic to update
                // this.call.localVideoStream[0].source to the newly added camera. This is a bug. Under the covers, this.call.localVideoStreams[0].source
                // should have been updated automatically by the sdk.
                if (newCameraDeviceToUse) {
                    try {
                        await this.call.localVideoStreams[0]?.switchSource(newCameraDeviceToUse);
                        this.setState({ selectedCameraDeviceId: newCameraDeviceToUse.id });
                    } catch {
                        console.error('Failed to switch to newly added video device', error);
                    }
                }

                e.removed.forEach(removedCameraDevice => {
                    this.setState(prevState => ({
                        ...prevState,
                        cameraDeviceOptions: prevState.cameraDeviceOptions.filter(option => { return option.key !== removedCameraDevice.id })
                    }))
                });

                // If the current camera being used is removed, pick a new random one
                // if (!this.state.cameraDeviceOptions.find(option => { return option.key === this.state.selectedCameraDeviceId })) {
                //     const newSelectedCameraId = this.state.cameraDeviceOptions[0]?.key;
                //     const cameras = await this.deviceManager.getCameras();
                //     const videoDeviceInfo = cameras.find(c => { return c.id === newSelectedCameraId });
                //     await this.call.localVideoStreams[0]?.switchSource(videoDeviceInfo);
                //     this.setState({ selectedCameraDeviceId: newSelectedCameraId });
                // }
            });

            this.deviceManager.on('audioDevicesUpdated', e => {
                e.added.forEach(addedAudioDevice => {
                    const addedAudioDeviceOption = { key: addedAudioDevice.id, text: addedAudioDevice.name };
                    if (addedAudioDevice.deviceType === 'Speaker') {
                        this.setState(prevState => ({
                            ...prevState,
                            speakerDeviceOptions: [...prevState.speakerDeviceOptions, addedAudioDeviceOption]
                        }));
                    } else if (addedAudioDevice.deviceType === 'Microphone') {
                        this.setState(prevState => ({
                            ...prevState,
                            microphoneDeviceOptions: [...prevState.microphoneDeviceOptions, addedAudioDeviceOption]
                        }));
                    }
                });

                e.removed.forEach(removedAudioDevice => {
                    if (removedAudioDevice.deviceType === 'Speaker') {
                        this.setState(prevState => ({
                            ...prevState,
                            speakerDeviceOptions: prevState.speakerDeviceOptions.filter(option => { return option.key !== removedAudioDevice.id })
                        }))
                    } else if (removedAudioDevice.deviceType === 'Microphone') {
                        this.setState(prevState => ({
                            ...prevState,
                            microphoneDeviceOptions: prevState.microphoneDeviceOptions.filter(option => { return option.key !== removedAudioDevice.id })
                        }))
                    }
                });
            });

            this.deviceManager.on('selectedSpeakerChanged', () => {
                this.setState({ selectedSpeakerDeviceId: this.deviceManager.selectedSpeaker?.id });
            });

            this.deviceManager.on('selectedMicrophoneChanged', () => {
                this.setState({ selectedMicrophoneDeviceId: this.deviceManager.selectedMicrophone?.id });
            });

            const callStateChanged = () => {
                console.log('Call state changed ', this.call.state);
                if (this.call.state !== 'None' &&
                    this.call.state !== 'Connecting' &&
                    this.call.state !== 'Incoming') {
                    if (this.callFinishConnectingResolve) {
                        this.callFinishConnectingResolve();
                    }
                }
                if (this.call.state === 'Incoming') {
                    this.setState({ selectedCameraDeviceId: cameraDevices[0]?.id });
                    this.setState({ selectedSpeakerDeviceId: speakerDevices[0]?.id });
                    this.setState({ selectedMicrophoneDeviceId: microphoneDevices[0]?.id });
                }

                if (this.call.state !== 'Disconnected') {
                    this.setState({ callState: this.call.state });
                }
            }
            callStateChanged();
            this.call.on('stateChanged', callStateChanged);

            this.call.localVideoStreams.forEach(lvs => {
                this.setState({ videoOn: true});
            });
            this.call.on('localVideoStreamsUpdated', e => {
                e.added.forEach(lvs => {
                    this.setState({ videoOn: true });
                });
                e.removed.forEach(lvs => {
                    this.setState({ videoOn: false });
                });
            });

            this.call.on('idChanged', () => {
                console.log('Call id Changed ', this.call.id);
                this.setState({ callId: this.call.id });
            });

            this.call.on('isMutedChanged', () => {
                console.log('Local microphone muted changed ', this.call.isMuted);
                this.setState({ micMuted: this.call.isMuted });
            });

            this.call.remoteParticipants.forEach(rp => this.subscribeToRemoteParticipant(rp));
            this.call.on('remoteParticipantsUpdated', e => {
                console.log(`Call=${this.call.callId}, remoteParticipantsUpdated, added=${e.added}, removed=${e.removed}`);
                e.added.forEach(p => {
                    console.log('participantAdded', p);
                    this.subscribeToRemoteParticipant(p);
                });
                e.removed.forEach(p => {
                    console.log('participantRemoved', p);
                    if(p.callEndReason) {
                        this.setState(prevState => ({
                            ...prevState,
                            callMessage: `${prevState.callMessage ? prevState.callMessage + `\n` : ``}
                                        Remote participant ${utils.getIdentifierText(p.identifier)} disconnected: code: ${p.callEndReason.code}, subCode: ${p.callEndReason.subCode}.`
                        }));
                    }
                    this.setState({ remoteParticipants: this.state.remoteParticipants.filter(remoteParticipant => { return remoteParticipant !== p }) });
                    this.setState({ allRemoteParticipantStreams: this.state.allRemoteParticipantStreams.filter(s => { return s.participant !== p }) });
                    p.off('videoStreamsUpdated', () => {});
                });
            });
        }
    }

    subscribeToRemoteParticipant(participant) {
        if (!this.state.remoteParticipants.find((p) => { return p === participant })) {
            this.setState(prevState => ({
                ...prevState,
                remoteParticipants: [...prevState.remoteParticipants, participant]
            }));
        }

        const addToListOfAllRemoteParticipantStreams = (participantStreams) => {
            if (participantStreams) {
                let participantStreamTuples = participantStreams.map(stream => { return { stream, participant, streamRendererComponentRef: React.createRef() }});
                participantStreamTuples.forEach(participantStreamTuple => {
                    if (!this.state.allRemoteParticipantStreams.find((v) => { return v === participantStreamTuple })) {
                        this.setState(prevState => ({
                            ...prevState,
                            allRemoteParticipantStreams: [...prevState.allRemoteParticipantStreams, participantStreamTuple]
                        }));
                    }
                })
            }
        }

        const removeFromListOfAllRemoteParticipantStreams = (participantStreams) => {
            participantStreams.forEach(streamToRemove => {
                const tupleToRemove = this.state.allRemoteParticipantStreams.find((v) => { return v.stream === streamToRemove })
                if (tupleToRemove) {
                    this.setState({
                        ...prevState,
                        allRemoteParticipantStreams: this.state.allRemoteParticipantStreams.filter(streamTuple => { return streamTuple !== tupleToRemove })
                    });
                }
            });
        }

        const handleVideoStreamsUpdated = (e) => {
            addToListOfAllRemoteParticipantStreams(e.added);
            removeFromListOfAllRemoteParticipantStreams(e.removed);
        }

        addToListOfAllRemoteParticipantStreams(participant.videoStreams);
        participant.on('videoStreamsUpdated', handleVideoStreamsUpdated);
    }

    async handleVideoOnOff() {
        try {
            const cameras = await this.deviceManager.getCameras();
            const cameraDeviceInfo = cameras.find(cameraDeviceInfo => {
                return cameraDeviceInfo.id === this.state.selectedCameraDeviceId
            });
            let selectedCameraDeviceId = this.state.selectedCameraDeviceId;
            let localVideoStream
            if (this.state.selectedCameraDeviceId) {
                localVideoStream = new LocalVideoStream(cameraDeviceInfo);

            } else if (!this.state.videoOn) {
                const cameras = await this.deviceManager.getCameras();
                selectedCameraDeviceId = cameras[0].id;
                localVideoStream = new LocalVideoStream(cameras[0]);
            }

            if (this.call.state === 'None' ||
                this.call.state === 'Connecting' ||
                this.call.state === 'Incoming') {
                if (this.state.videoOn) {
                    this.setState({ videoOn: false });
                } else {
                    this.setState({ videoOn: true, selectedCameraDeviceId })
                }
                await this.watchForCallFinishConnecting();
                if (this.state.videoOn) {
                    this.call.startVideo(localVideoStream).catch(error => { });
                } else {
                    this.call.stopVideo(this.call.localVideoStreams[0]).catch(error => { });
                }
            } else {
                if (this.call.localVideoStreams[0]) {
                    await this.call.stopVideo(this.call.localVideoStreams[0]);
                } else {
                    await this.call.startVideo(localVideoStream);
                }
            }

            this.setState({ videoOn: this.call.localVideoStreams[0] ? true : false });
        } catch (e) {
            console.error(e);
        }
    }

    async watchForCallFinishConnecting() {
        return new Promise((resolve) => {
            if (this.state.callState !== 'None' && this.state.callState !== 'Connecting' && this.state.callState !== 'Incoming') {
                resolve();
            } else {
                this.callFinishConnectingResolve = resolve;
            }
        }).then(() => {
            this.callFinishConnectingResolve = undefined;
        });
    }

    async handleMicOnOff() {
        try {
            if (!this.call.isMuted) {
                await this.call.mute();
            } else {
                await this.call.unmute();
            }
            this.setState({ micMuted: this.call.isMuted });
        } catch (e) {
            console.error(e);
        }
    }

    cameraDeviceSelectionChanged = async (event, item) => {
        const cameras = await this.deviceManager.getCameras();
        const cameraDeviceInfo = cameras.find(cameraDeviceInfo => { return cameraDeviceInfo.id === item.key });
        const localVideoStream = this.call.localVideoStreams[0];
        if (localVideoStream) {
            localVideoStream.switchSource(cameraDeviceInfo);
        }
        this.setState({ selectedCameraDeviceId: cameraDeviceInfo.id });
    };

    speakerDeviceSelectionChanged = async (event, item) => {
        const speakers = await this.deviceManager.getSpeakers();
        const speakerDeviceInfo = speakers.find(speakerDeviceInfo => { return speakerDeviceInfo.id === item.key });
        this.deviceManager.selectSpeaker(speakerDeviceInfo);
        this.setState({ selectedSpeakerDeviceId: speakerDeviceInfo.id });
    };

    microphoneDeviceSelectionChanged = async (event, item) => {
        const microphones = await this.deviceManager.getMicrophones();
        const microphoneDeviceInfo = microphones.find(microphoneDeviceInfo => { return microphoneDeviceInfo.id === item.key });
        this.deviceManager.selectMicrophone(microphoneDeviceInfo);
        this.setState({ selectedMicrophoneDeviceId: microphoneDeviceInfo.id });
    };

    render() {
        return (
            <div className="ms-Grid mt-2">
                <div className="ms-Grid-row">
                    {
                        this.state.callMessage &&
                        <Alert
                            intent="warning"
                            action="Dismiss">
                            <b>{this.state.callMessage}</b>
                        </Alert>
                    }
                </div>
                <div className="ms-Grid-row">
                    {
                        this.state.callState === 'Connected' &&
                        <div className="ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl3">
                            <div className="participants-panel mt-1 mb-3">
                                {
                                    this.state.dominantSpeakerMode &&
                                    <div>
                                        Current dominant speaker: {this.state.dominantRemoteParticipant ? utils.getIdentifierText(this.state.dominantRemoteParticipant.identifier) : `None`}
                                    </div>
                                }
                                {
                                /*<div className="participants-panel-title custom-row text-center">
                                    <AddParticipantPopover call={this.call} />
                                </div>*/
                                }
                                {
                                    this.state.remoteParticipants.length === 0 &&
                                    <p className="text-center">No other participants currently in the call</p>
                                }
                                <ul className="participants-panel-list">
                                    {/*
                                        this.state.remoteParticipants.map(remoteParticipant =>
                                            <RemoteParticipantCard key={`${utils.getIdentifierText(remoteParticipant.identifier)}`} remoteParticipant={remoteParticipant} call={this.call} />
                                        )*/
                                    }
                                </ul>
                            </div>
                        </div>
                    }
                    <div className={this.state.callState === 'Connected' ? `ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl9` : 'ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl12'}>
                        <div className="mb-2">
                            {
                                this.state.callState !== 'Connected' &&
                                <div className="custom-row">
                                    <div className="ringing-loader mb-4"></div>
                                </div>
                            }
                            <div className="text-center">
                                <Button className="in-call-button"
                                    variant="secondary"
                                    onClick={() => this.handleVideoOnOff()}>
                                        Video toggle
                                </Button>
                                <Button className="in-call-button"
                                    title={`${this.state.micMuted ? 'Unmute' : 'Mute'} your microphone`}
                                    variant="secondary"
                                    onClick={() => this.handleMicOnOff()}>
                                        Mic toggle
                                </Button>
                                <Button className="in-call-button"
                                    title="Settings"
                                    variant="secondary"
                                    onClick={() => this.setState({ showSettings: true })}>
                                        Settings
                                </Button>
                                <Button className="in-call-button"
                                    onClick={() => this.call.hangUp()}>
                                        Hang up
                                </Button>
                                {/*
                                <Panel type={PanelType.medium}
                                    isLightDismiss
                                    isOpen={this.state.showSettings}
                                    onDismiss={() => this.setState({ showSettings: false })}
                                    closeButtonAriaLabel="Close"
                                    headerText="Settings">
                                    <div className="pl-2 mt-3">
                                        <h3>Video settings</h3>
                                        <div className="pl-2">
                                            <span>
                                                <h4>Camera preview</h4>
                                            </span>
                                            <DefaultButton onClick={() => this.setState({ showLocalVideo: !this.state.showLocalVideo })}>
                                                Show/Hide
                                            </DefaultButton>
                                            {
                                                this.state.callState === 'Connected' &&
                                                <Dropdown
                                                    selectedKey={this.state.selectedCameraDeviceId}
                                                    onChange={this.cameraDeviceSelectionChanged}
                                                    label={'Camera'}
                                                    options={this.state.cameraDeviceOptions}
                                                    placeHolder={this.state.cameraDeviceOptions.length === 0 ? 'No camera devices found' : this.state.selectedCameraDeviceId }
                                                    styles={{ dropdown: { width: 400 } }}
                                                />
                                            }
                                        </div>
                                    </div>
                                    <div className="pl-2 mt-4">
                                        <h3>Sound Settings</h3>
                                        <div className="pl-2">
                                            {
                                                this.state.callState === 'Connected' &&
                                                <Dropdown
                                                    selectedKey={this.state.selectedSpeakerDeviceId}
                                                    onChange={this.speakerDeviceSelectionChanged}
                                                    options={this.state.speakerDeviceOptions}
                                                    label={'Speaker'}
                                                    placeHolder={this.state.speakerDeviceOptions.length === 0 ? 'No speaker devices found' : this.state.selectedSpeakerDeviceId}
                                                    styles={{ dropdown: { width: 400 } }}
                                                />
                                            }
                                            {
                                                this.state.callState === 'Connected' &&
                                                <Dropdown
                                                    selectedKey={this.state.selectedMicrophoneDeviceId}
                                                    onChange={this.microphoneDeviceSelectionChanged}
                                                    options={this.state.microphoneDeviceOptions}
                                                    label={'Microphone'}
                                                    placeHolder={this.state.microphoneDeviceOptions.length === 0 ? 'No microphone devices found' : this.state.selectedMicrophoneDeviceId}
                                                    styles={{ dropdown: { width: 400 } }}
                                                />
                                            }
                                            <div>
                                            {
                                                (this.state.callState === 'Connected') && !this.state.micMuted && !this.state.incomingAudioMuted &&
                                                <h3>Volume Visualizer</h3>
                                            }
                                            {
                                                (this.state.callState === 'Connected') && !this.state.micMuted && !this.state.incomingAudioMuted &&
                                                <VolumeVisualizer call={this.call} deviceManager={this.deviceManager} remoteVolumeLevel={this.state.remoteVolumeLevel} />
                                            }
                                            </div>
                                        </div>
                                    </div>
                                </Panel>*/
                                }
                            </div>
                        </div>
                        <div>
                            {
                                /*this.state.showLocalVideo &&
                                <div className="mb-3">
                                    <LocalVideoPreviewCard selectedCameraDeviceId={this.state.selectedCameraDeviceId} deviceManager={this.deviceManager} />
                                </div>*/
                            }
                        </div>
                        {
                            <div className="video-grid-row">
                                {
                                    (this.state.callState === 'Connected' ||
                                    this.state.callState === 'LocalHold' ||
                                    this.state.callState === 'RemoteHold') &&
                                    this.state.allRemoteParticipantStreams.map(v =>
                                        <StreamRendererComponent
                                                        key={`${utils.getIdentifierText(v.participant.identifier)}-${v.stream.mediaStreamType}-${v.stream.id}`}
                                                        ref ={v.streamRendererComponentRef}
                                                        stream={v.stream}
                                                        remoteParticipant={v.participant}
                                                        dominantSpeakerMode={this.state.dominantSpeakerMode}
                                                        dominantRemoteParticipant={this.state.dominantRemoteParticipant}
                                                        call={this.call}
                                                        maximumNumberOfRenderers={this.maximumNumberOfRenderers}
                                                        updateStreamList={() => this.updateStreamList()}
                                                        showMediaStats={this.state.logMediaStats}
                                                        />
                                    )
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}
