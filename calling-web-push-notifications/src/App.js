import React from "react";
import './App.css';
import './bootstrap-grid.min.css';
import { CallClient, LocalVideoStream } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { Button, Label, Input, Divider } from "@fluentui/react-components";
import CallComponent from './main/CallComponent'
import { LoginComponent } from './main/LoginComponent';
import IncomingCallComponent from "./main/IncomingCallComponent";
import { setLogLevel, AzureLogger } from '@azure/logger';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.callClient = null;
        this.callAgent = null;
        this.deviceManager = null;
        this.destinationUserIds = null;
        this.destinationGroup = null;
        this.callError = null;
        this.tokenCredential = null;
        this.logInComponentRef = React.createRef();

        this.state = {
            id: undefined,
            loggedIn: false,
            call: undefined,
            incomingCall: undefined,
            showCallSampleCode: false,
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            deviceManagerWarning: null,
            callError: null,
            permissions: {
                audio: null,
                video: null
            },
        };

        AzureLogger.log = (...args) => {
            if (args[0].startsWith('azure:ACS-calling:info')) {
                console.info(...args);
            } else if (args[0].startsWith('azure:ACS-calling:verbose')) {
                console.debug(...args);
            } else if (args[0].startsWith('azure:ACS-calling:warning')) {
                console.warn(...args);
            } else if (args[0].startsWith('azure:ACS-calling:error')) {
                console.error(...args);
            } else {
                console.log(...args);
            }
        };
    }

    handleLogIn = async (userDetails) => {
        if (userDetails) {
            try {
                const tokenCredential = new AzureCommunicationTokenCredential(userDetails.token);
                this.tokenCredential = tokenCredential;
                setLogLevel('verbose');
                this.callClient = new CallClient({ diagnostics: { appName: 'azure-communication-services web push notifications quickstart', appVersion: '1.12.0-beta.1', tags: ["javascript_calling_sdk", `#clientTag:${userDetails.clientTag}`] } });
                this.callAgent = await this.callClient.createCallAgent(tokenCredential, { displayName: userDetails.displayName });
                this.callAgent.on('callsUpdated', e => {
                  console.log(`CallAgent: callsUpdated, added=${e.added}, removed=${e.removed}`);

                  e.added.forEach(call => {
                    this.setState({ call: call });
                  });

                  e.removed.forEach(call => {
                    if (this.state.call && this.state.call === call) {
                      this.displayCallEndReason(this.state.call.callEndReason);
                    }
                  });
                });

                this.callAgent.on('incomingCall', args => {
                  const incomingCall = args.incomingCall;
                  if (this.state.call) {
                    incomingCall.reject();
                    return;
                  }

                  this.setState({ incomingCall: incomingCall });

                  incomingCall.on('callEnded', args => {
                    this.displayCallEndReason(args.callEndReason);
                  });
                });

                this.setState({ loggedIn: true });
                this.logInComponentRef.current.setCallAgent(this.callAgent);

                this.deviceManager = await this.callClient.getDeviceManager();
                const permissions = await this.deviceManager.askDevicePermission({ audio: true, video: true });
                this.setState({permissions: permissions});
            } catch (e) {
                console.error(e);
            }
        }
    }

    displayCallEndReason = (callEndReason) => {
        if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
            this.setState({ callError: `Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}` });
        }

        this.setState({ call: null, incomingCall: null });
    }

    placeCall = async (withVideo) => {
        try {
            let identitiesToCall = [];
            const userIdsArray = this.destinationUserIds.split(',');

            userIdsArray.forEach((userId, index) => {
                if (userId) {
                    userId = userId.trim();
                    if (userId === '8:echo123') {
                        userId = { id: userId };
                    } else {
                        userId = { communicationUserId: userId };
                    }
                    if (!identitiesToCall.find(id => { return id === userId })) {
                        identitiesToCall.push(userId);
                    }
                }
            });

            const callOptions = await this.getCallOptions(withVideo);

            this.callAgent.startCall(identitiesToCall, callOptions);

        } catch (e) {
            console.error('Failed to place a call', e);
            this.setState({ callError: 'Failed to place a call: ' + e });
        }
    };

    joinGroup = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions(withVideo);
            this.callAgent.join({ groupId: this.destinationGroup }, callOptions);
        } catch (e) {
            console.error('Failed to join a call', e);
            this.setState({ callError: 'Failed to join a call: ' + e });
        }
    };

    async getCallOptions(withVideo) {
        let callOptions = {
            videoOptions: {
                localVideoStreams: undefined
            },
            audioOptions: {
                muted: false
            }
        };

        let cameraWarning = undefined;
        let speakerWarning = undefined;
        let microphoneWarning = undefined;

        // On iOS, device permissions are lost after a little while, so re-ask for permissions
        const permissions = await this.deviceManager.askDevicePermission({ audio: true, video: true });
        this.setState({permissions: permissions});

        const cameras = await this.deviceManager.getCameras();
        const cameraDevice = cameras[0];
        if (cameraDevice && cameraDevice?.id !== 'camera:') {
            this.setState({
                selectedCameraDeviceId: cameraDevice?.id,
                cameraDeviceOptions: cameras.map(camera => { return { key: camera.id, text: camera.name } })
            });
        }
        if (withVideo) {
            try {
                if (!cameraDevice || cameraDevice?.id === 'camera:') {
                    throw new Error('No camera devices found.');
                } else if (cameraDevice) {
                    callOptions.videoOptions = { localVideoStreams: [new LocalVideoStream(cameraDevice)] };
                    if (this.videoConstraints) {
                        callOptions.videoOptions.constraints = this.videoConstraints;
                    }
                }
            } catch (e) {
                cameraWarning = e.message;
            }
        }

        try {
            const speakers = await this.deviceManager.getSpeakers();
            const speakerDevice = speakers[0];
            if (!speakerDevice || speakerDevice.id === 'speaker:') {
                throw new Error('No speaker devices found.');
            } else if (speakerDevice) {
                this.setState({
                    selectedSpeakerDeviceId: speakerDevice.id,
                    speakerDeviceOptions: speakers.map(speaker => { return { key: speaker.id, text: speaker.name } })
                });
                await this.deviceManager.selectSpeaker(speakerDevice);
            }
        } catch (e) {
            speakerWarning = e.message;
        }

        try {
            const microphones = await this.deviceManager.getMicrophones();
            const microphoneDevice = microphones[0];
            if (!microphoneDevice || microphoneDevice.id === 'microphone:') {
                throw new Error('No microphone devices found.');
            } else {
                this.setState({
                    selectedMicrophoneDeviceId: microphoneDevice.id,
                    microphoneDeviceOptions: microphones.map(microphone => { return { key: microphone.id, text: microphone.name } })
                });
                await this.deviceManager.selectMicrophone(microphoneDevice);
            }
        } catch (e) {
            microphoneWarning = e.message;
        }

        if (cameraWarning || speakerWarning || microphoneWarning) {
            this.setState({
                deviceManagerWarning:
                    `${cameraWarning ? cameraWarning + ' ' : ''}
                    ${speakerWarning ? speakerWarning + ' ' : ''}
                    ${microphoneWarning ? microphoneWarning + ' ' : ''}`
            });
        }

        return callOptions;
    }

    render() {
      const handlePushNotificationCode = `

      `;
        return (
            <div>
                <LoginComponent onLoggedIn={this.handleLogIn} ref={this.logInComponentRef}/>
                <Divider className="mt-5 mb-5" inset/>
                {
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <div className="ms-Grid-col ms-lg6 ms-sm6 mb-4">
                                <h3>Placing and receiving calls</h3>
                                <div>{`Permissions audio: ${this.state.permissions.audio} video: ${this.state.permissions.video}`}</div>
                            </div>
                            {
                            /*<div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <Button
                                    text={`${this.state.showCallSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showCallSampleCode: !this.state.showCallSampleCode })}>
                                </Button>
                            </div>*/
                            }
                        </div>
                        <div className="mb-2">Having provisioned an ACS Identity and initialized the Calling SDK from the section above, you are now ready to place calls, join group calls, and receiving calls.</div>
                        {
                            this.state.showCallSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {handlePushNotificationCode}
                                </code>
                            </pre>
                        }
                        {
                            this.state.callError &&
                            <Alert
                                intent="error"
                                action="Dismiss">
                                <b>{this.state.callError}</b>
                            </Alert>
                        }
                        {
                            this.state.deviceManagerWarning &&
                            <Alert
                                intent="warning"
                                action="Dismiss">
                                <b>{this.state.deviceManagerWarning}</b>
                            </Alert>
                        }
                        {
                            !this.state.incomingCall && !this.state.call &&
                            <div>
                                <div className="ms-Grid-row mt-3">
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                        <h3 className="mb-1">Place a call</h3>
                                        <div>Enter an Identity to make a call to.</div>
                                        <div>You can specify multiple Identities to call by using "," separated values.</div>
                                        <div>If calling a Phone Identity, your Alternate Caller Id must be specified. </div>
                                        <div>
                                            <div>
                                                <Label htmlFor={'calleesInput'} disabled={this.state.call || !this.state.loggedIn} style={{fontSize: "12px"}}>
                                                    Destination Identity or Identities
                                                </Label>
                                            </div>
                                            <div>
                                                <Input id={'calleesInput'}  onChange={(e) => { this.destinationUserIds = e.target.value }}/>
                                            </div>
                                        </div>
                                        <Button
                                            className="mt-2 mr-2"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(false)}>
                                            Place call audio only
                                        </Button>
                                        <Button
                                            className="mt-2"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(true)}>
                                            Place call with video
                                        </Button>
                                    </div>
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                        <h3 className="mb-1">Join a group call</h3>
                                        <div>Group Id must be in GUID format.</div>
                                        <div>
                                            <div>
                                                <Label htmlFor={'groupIdInput'} disabled={this.state.call || !this.state.loggedIn} style={{fontSize: "12px"}}>
                                                    Group Id
                                                </Label>
                                            </div>
                                            <div>
                                                <Input id={'groupIdInput'}
                                                    onChange={(e) => { this.destinationGroup = e.target.value }}
                                                    placeholder="29228d3e-040e-4656-a70e-890ab4e173e5"
                                                    defaultValue="29228d3e-040e-4656-a70e-890ab4e173e5"/>
                                            </div>
                                        </div>
                                        <Button
                                            className="mt-2 mr-2"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinGroup(false)}>
                                            Join group call audio only
                                        </Button>
                                        <Button
                                            className="mt-2"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinGroup(true)}>
                                            Join group call with video
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        }
                        {
                            this.state.call &&
                            <CallComponent
                                call={this.state.call}
                                deviceManager={this.deviceManager}
                                selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                                cameraDeviceOptions={this.state.cameraDeviceOptions}
                                speakerDeviceOptions={this.state.speakerDeviceOptions}
                                microphoneDeviceOptions={this.state.microphoneDeviceOptions}
                                onShowCameraNotFoundWarning={(show) => { this.setState({ showCameraNotFoundWarning: show }) }}
                                onShowSpeakerNotFoundWarning={(show) => { this.setState({ showSpeakerNotFoundWarning: show }) }}
                                onShowMicrophoneNotFoundWarning={(show) => { this.setState({ showMicrophoneNotFoundWarning: show }) }} />
                        }
                        {
                            this.state.incomingCall && !this.state.call &&
                            <IncomingCallComponent
                                incomingCall={this.state.incomingCall}
                                acceptCallOptions={async () => await this.getCallOptions()}
                                acceptCallWithVideoOptions={async () => await this.getCallOptions(true)}
                                onReject={() => { this.setState({ incomingCall: undefined }) }} />
                        }
                    </div>
                </div>
                }
            </div>
        );
    }
}
