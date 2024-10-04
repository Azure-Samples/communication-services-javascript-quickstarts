import React from "react";
import { CallClient, LocalVideoStream, Features, CallAgentKind, VideoStreamRenderer } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential, createIdentifierFromRawId} from '@azure/communication-common';
import {
    PrimaryButton,
    TextField,
    MessageBar,
    MessageBarType
} from 'office-ui-fabric-react'
import { Icon } from '@fluentui/react/lib/Icon';
import IncomingCallCard from './IncomingCallCard';
import CallCard from '../MakeCall/CallCard';
import CallSurvey from '../MakeCall/CallSurvey';
import Login from './Login';
import MediaConstraint from './MediaConstraint';
import { setLogLevel, AzureLogger } from '@azure/logger';
import { inflate } from 'pako';
import { URL_PARAM } from "../Constants";
export default class MakeCall extends React.Component {
    constructor(props) {
        super(props);
        this.callClient = null;
        this.callAgent = null;
        this.deviceManager = null;
        this.destinationUserIds = null;
        this.destinationPhoneIds = null;
        this.destinationGroup = null;
        this.userToUser = null;
        this.xHeaders = [
            { key: null, value: null},
            { key: null, value: null},
            { key: null, value: null},
            { key: null, value: null},
            { key: null, value: null},
        ];
        this.meetingLink = null;
        this.meetingId = null;
        this.passcode = null;
        this.roomsId = null;
        this.threadId = null;
        this.messageId = null;
        this.organizerId = null;
        this.tenantId = null;
        this.callError = null;
        this.logBuffer = [];
        this.videoConstraints = null;
        this.tokenCredential = null;
        this.logInComponentRef = React.createRef();

        this.state = {
            id: undefined,
            loggedIn: false,
            isCallClientActiveInAnotherTab: false,
            call: undefined,
            callSurvey: undefined,
            incomingCall: undefined,
            showCallSampleCode: false,
            showMuteUnmuteSampleCode: false,
            showHoldUnholdCallSampleCode: false,
            showPreCallDiagnosticsSampleCode: false,
            showCustomContextSampleCode: false,
            showPreCallDiagnostcisResults: false,
            showCustomContext: false,
            xHeadersCount: 1,
            xHeadersMaxCount: 5,
            isPreCallDiagnosticsCallInProgress: false,
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            deviceManagerWarning: null,
            callError: null,
            ufdMessages: [],
            permissions: {
                audio: null,
                video: null
            },
            preCallDiagnosticsResults: {},
            isTeamsUser: false,
            identityMri: undefined
        };

        setInterval(() => {
            if (this.state.ufdMessages.length > 0) {
                this.setState({ ufdMessages: this.state.ufdMessages.slice(1) });
            }
        }, 10000);

        // override logger to be able to dowload logs locally
        AzureLogger.log = (...args) => {
            this.logBuffer.push(...args);
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
    
    autoJoinMeetingByMeetingLink = () => {
        if (this.state.loggedIn) {
            const params = new URLSearchParams(window.location.search);
            if (params.get(URL_PARAM.MEETING_LINK)) {
                const videoOn = params.get(URL_PARAM.VIDEO) && params.get(URL_PARAM.VIDEO).toLocaleLowerCase() === URL_PARAM.ON ? true : false;
                const micMuted = params.get(URL_PARAM.MIC) && params.get(URL_PARAM.MIC).toLocaleLowerCase() === URL_PARAM.ON ? false : true;
                this.joinTeamsMeeting(videoOn, micMuted);
                // Remove the search params from the URL
                window.history.replaceState({}, document.title, "/");
            }
        }
    }

    handleMediaConstraint = (constraints) => {
        if (constraints.video) {
            this.videoConstraints = constraints.video;
        }
    }

    handleLogIn = async (userDetails) => {
        if (userDetails) {
            try {
                const tokenCredential = new AzureCommunicationTokenCredential(userDetails.token);
                this.tokenCredential = tokenCredential;
                setLogLevel('verbose');

                const proxyConfiguration = userDetails.proxy.useProxy ? { url: userDetails.proxy.url } : undefined;
                const turnConfiguration = userDetails.customTurn.useCustomTurn ? userDetails.customTurn.turn : undefined;
                this.callClient = new CallClient({
                    diagnostics: {
                        appName: 'azure-communication-services',
                        appVersion: '1.3.1-beta.1',
                        tags: ["javascript_calling_sdk",
                        `#clientTag:${userDetails.clientTag}`]
                    },
                    networkConfiguration: {
                        proxy: proxyConfiguration,
                        turn: turnConfiguration
                    }
                });

                this.deviceManager = await this.callClient.getDeviceManager();
                const permissions = await this.deviceManager.askDevicePermission({ audio: true, video: true });
                this.setState({permissions: permissions});

                this.setState({ isTeamsUser: userDetails.isTeamsUser});
                this.setState({ identityMri: createIdentifierFromRawId(userDetails.communicationUserId)})
                this.callAgent =  this.state.isTeamsUser ?
                    await this.callClient.createTeamsCallAgent(tokenCredential) :
                    await this.callClient.createCallAgent(tokenCredential, { displayName: userDetails.displayName });

                window.callAgent = this.callAgent;
                window.videoStreamRenderer = VideoStreamRenderer;
                this.callAgent.on('callsUpdated', e => {
                    console.log(`callsUpdated, added=${e.added}, removed=${e.removed}`);

                    e.added.forEach(call => {
                        this.setState({ call: call });

                        const diagnosticChangedListener = (diagnosticInfo) => {
                                const rmsg = `UFD Diagnostic changed:
                                Diagnostic: ${diagnosticInfo.diagnostic}
                                Value: ${diagnosticInfo.value}
                                Value type: ${diagnosticInfo.valueType}`;
                                if (this.state.ufdMessages.length > 0) {
                                    // limit speakingWhileMicrophoneIsMuted diagnostic until another diagnostic is received
                                    if (diagnosticInfo.diagnostic === 'speakingWhileMicrophoneIsMuted' && this.state.ufdMessages[0].includes('speakingWhileMicrophoneIsMuted')) {
                                        console.info(rmsg);
                                        return;
                                    }
                                    this.setState({ ufdMessages: [rmsg, ...this.state.ufdMessages] });
                                } else {
                                    this.setState({ ufdMessages: [rmsg] });
                                }
                        };

                        const remoteDiagnosticChangedListener = (diagnosticArgs) => {
                            diagnosticArgs.diagnostics.forEach(diagnosticInfo => {
                                const rmsg = `UFD Diagnostic changed:
                                Diagnostic: ${diagnosticInfo.diagnostic}
                                Value: ${diagnosticInfo.value}
                                Value type: ${diagnosticInfo.valueType}
                                Participant Id: ${diagnosticInfo.participantId}
                                Participant name: ${diagnosticInfo.remoteParticipant?.displayName}`;
                                if (this.state.ufdMessages.length > 0) {
                                    this.setState({ ufdMessages: [rmsg, ...this.state.ufdMessages] });
                                } else {
                                    this.setState({ ufdMessages: [rmsg] });
                                }
                            });
                        };

                        call.feature(Features.UserFacingDiagnostics).media.on('diagnosticChanged', diagnosticChangedListener);
                        call.feature(Features.UserFacingDiagnostics).network.on('diagnosticChanged', diagnosticChangedListener);
                        call.feature(Features.UserFacingDiagnostics).remote?.on('diagnosticChanged', remoteDiagnosticChangedListener);
                        window.ufds = call.feature(Features.UserFacingDiagnostics);
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
                this.logInComponentRef.current.setCallClient(this.callClient);
                this.autoJoinMeetingByMeetingLink();
            } catch (e) {
                console.error(e);
            }
        }
    }

    displayCallEndReason = (callEndReason) => {
        if (callEndReason.code !== 0 || callEndReason.subCode !== 0) {
            this.setState({ callSurvey: this.state.call, callError: `Call end reason: code: ${callEndReason.code}, subcode: ${callEndReason.subCode}` });
        }

        this.setState({ call: null, callSurvey: this.state.call, incomingCall: null });
    }

    placeCall = async (withVideo) => {
        try {
            let identitiesToCall = [];
            const userIdsArray = this.destinationUserIds.value.split(',');
            const phoneIdsArray = this.destinationPhoneIds.value.split(',');

            userIdsArray.forEach((userId, index) => {
                if (userId) {
                    userId = userId.trim();
                    if (userId === '8:echo123') {
                        userId = { id: userId };
                    }
                    else {
                        userId = createIdentifierFromRawId(userId);
                    }
                    if (!identitiesToCall.find(id => { return id === userId })) {
                        identitiesToCall.push(userId);
                    }
                }
            });

            phoneIdsArray.forEach((phoneNumberId, index) => {
                if (phoneNumberId) {
                    phoneNumberId = phoneNumberId.trim();
                    phoneNumberId = createIdentifierFromRawId(phoneNumberId);
                    if (!identitiesToCall.find(id => { return id === phoneNumberId })) {
                        identitiesToCall.push(phoneNumberId);
                    }
                }
            });

            const callOptions = await this.getCallOptions({video: withVideo, micMuted: false});

            if (this.callAgent.kind === CallAgentKind.CallAgent && this.alternateCallerId.value !== '') {
                callOptions.alternateCallerId = { phoneNumber: this.alternateCallerId.value.trim() };
            }

            if (identitiesToCall.length > 1) {
                if (this.callAgent.kind === CallAgentKind.TeamsCallAgent && this.threadId?.value !== '') {
                    callOptions.threadId = this.threadId.value;
                }
            }

            if (this.state.showCustomContext) {
                if (this.userToUser.value) {
                    callOptions.customContext = callOptions.customContext || {};
                    callOptions.customContext.userToUser = this.userToUser.value;
                }
                
                const xHeaders = this.xHeaders
                    .filter(header => !!header.key.value && !!header.value.value)
                    .map(header => {
                        return { key: header.key.value, value: header.value.value };
                    });
                if (xHeaders.length > 0) {
                    callOptions.customContext = callOptions.customContext || {};
                    callOptions.customContext.xHeaders = xHeaders;
                }
            }

            this.callAgent.startCall(identitiesToCall, callOptions);

        } catch (e) {
            console.error('Failed to place a call', e);
            this.setState({ callError: 'Failed to place a call: ' + e });
        }
    };

    downloadLog = async () => {
        const date = new Date();
        const fileName = `logs-${date.toISOString().slice(0, 19)}.txt`;
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.logBuffer.join('\n')));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
        this.logBuffer = [];
    }

    downloadDebugInfoLogDump = async () => {
        const date = new Date();
        const fileName = `logs-${date.toISOString().slice(0, 19)}.txt`;
        var element = document.createElement('a');
        let newDebugInfo = null;
        try {
            let debugInfoFeature = this.callClient.feature(Features.DebugInfo);
            let debugInfo = debugInfoFeature.dumpDebugInfo();
            let debugInfoZippedDump = debugInfo.dump;
            let debugInfoDumpId = debugInfo.dumpId;
            newDebugInfo = {
                lastCallId: debugInfoFeature.lastCallId,
                lastLocalParticipantId: debugInfoFeature.lastLocalParticipantId,
                debugInfoDumpId:debugInfoDumpId,
                debugInfoDumpUnzipped: JSON.parse(inflate(debugInfoZippedDump, { to: 'string' })),
             }
        } catch (e) {
            console.error('ERROR, failed to dumpDebugInfo', e);
        }
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(newDebugInfo)));
        element.setAttribute('download', fileName);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    }

    joinGroup = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions({video: withVideo, micMuted: false});
            this.callAgent.join({ groupId: this.destinationGroup.value }, callOptions);
        } catch (e) {
            console.error('Failed to join a call', e);
            this.setState({ callError: 'Failed to join a call: ' + e });
        }
    };

    joinRooms = async (withVideo) => {
        try {
            const callOptions = await this.getCallOptions({video: withVideo, micMuted: false});
            this.callAgent.join({ roomId: this.roomsId.value }, callOptions);
        } catch (e) {
            console.error('Failed to join a call', e);
            this.setState({ callError: 'Failed to join a call: ' + e });
        }
    };

    joinTeamsMeeting = async (withVideo, micMuted = false) => {
        try {
            const callOptions = await this.getCallOptions({video: withVideo, micMuted: micMuted});
            if (this.meetingLink.value && !this.messageId.value && !this.threadId.value && this.tenantId && this.organizerId) {
                this.callAgent.join({ meetingLink: this.meetingLink.value }, callOptions);
            } else if (this.meetingId.value  || this.passcode.value && !this.meetingLink.value && !this.messageId.value && !this.threadId.value && this.tenantId && this.organizerId) {
                this.callAgent.join({ 
                    meetingId: this.meetingId.value,
                    passcode: this.passcode.value 
                }, callOptions);
            } else if (!this.meetingLink.value && this.messageId.value && this.threadId.value && this.tenantId && this.organizerId) {
                this.callAgent.join({
                    messageId: this.messageId.value,
                    threadId: this.threadId.value,
                    tenantId: this.tenantId.value,
                    organizerId: this.organizerId.value
                }, callOptions);
            } else {
                throw new Error('Please enter Teams meeting link or Teams meeting coordinate');
            }
        } catch (e) {
            console.error('Failed to join teams meeting:', e);
            this.setState({ callError: 'Failed to join teams meeting: ' + e });
        }
    }

    async getCallOptions(options) {
        let callOptions = {
            videoOptions: {
                localVideoStreams: undefined
            },
            audioOptions: {
                muted: !!options.micMuted
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
        if (!!options.video) {
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
            // Select the default or first speaker device found.
            const speakerDevice = speakers.find(speaker => speaker.isSystemDefault) ?? speakers[0];
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
            // Select the default or first microphone device found.
            const microphoneDevice = microphones.find(mic => mic.isSystemDefault) ?? microphones[0];
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

    handleCallSurveySubmitted() {
        this.setState({ callSurvey: null, call: null });
    }

    async runPreCallDiagnostics() {
        try {
            this.setState({
                showPreCallDiagnostcisResults: false,
                isPreCallDiagnosticsCall: true,
                preCallDiagnosticsResults: {}
            });
            const preCallDiagnosticsResult = await this.callClient.feature(Features.PreCallDiagnostics).startTest(this.tokenCredential);

            const deviceAccess =  await preCallDiagnosticsResult.deviceAccess;
            this.setState({preCallDiagnosticsResults: {...this.state.preCallDiagnosticsResults, deviceAccess}});

            const deviceEnumeration = await preCallDiagnosticsResult.deviceEnumeration;
            this.setState({preCallDiagnosticsResults: {...this.state.preCallDiagnosticsResults, deviceEnumeration}});

            const inCallDiagnostics =  await preCallDiagnosticsResult.inCallDiagnostics;
            this.setState({preCallDiagnosticsResults: {...this.state.preCallDiagnosticsResults, inCallDiagnostics}});

            const browserSupport =  await preCallDiagnosticsResult.browserSupport;
            this.setState({preCallDiagnosticsResults: {...this.state.preCallDiagnosticsResults, browserSupport}});

            this.setState({
                showPreCallDiagnostcisResults: true,
                isPreCallDiagnosticsCall: false
            });

        } catch {
            throw new Error("Can't run Pre Call Diagnostics test. Please try again...");
        }
    }

    xHeadersChanged = () => {
        const xHeadersFilled = this.xHeaders.filter(header => !!header.key.value && !!header.value.value).length;
        if (xHeadersFilled === this.state.xHeadersCount && this.state.xHeadersCount < this.state.xHeadersMaxCount) {
            this.setState({ xHeadersCount: this.state.xHeadersCount + 1 });
        }
    };

    render() {
        const callSampleCode = `
/******************************/
/*       Placing a call       */
/******************************/
// Set up CallOptions
const cameraDevice = this.callClient.getDeviceManager().getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
this.callOptions.videoOptions = { localVideoStreams: [localVideoStream] };

// To place a 1:1 call to another ACS user
const userId = { communicationUserId: 'ACS_USER_ID');
this.currentCall = this.callAgent.startCall([userId], this.callOptions);

// Place a 1:1 call to an ACS phone number. PSTN calling is currently in private preview.
// When making PSTN calls, your Alternate Caller Id must be specified in the call options.
const phoneNumber = { phoneNumber: <ACS_PHONE_NUMBER>);
this.callOptions.alternateCallerId = { phoneNumber: <ALTERNATE_CALLER_ID>}
this.currentCall = this.callAgent.startCall([phoneNumber], this.callOptions);

// Place a 1:N call. Specify a multiple destinations
this.currentCall = this.callAgent.startCall([userId1, phoneNumber], this.callOptions);

/******************************/
/*      Receiving a call      */
/******************************/
this.callAgent.on('incomingCall', async (args) => {
    // accept the incoming call
    const call = await args.incomingCall.accept();

    // or reject the incoming call
    args.incomingCall.reject();
});

/******************************/
/*    Joining a group call    */
/******************************/
// Set up CallOptions
const cameraDevice = this.callClient.deviceManager.getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
this.callOptions.videoOptions = { localVideoStreams: [localVideoStream] };

// Join a group call
this.currentCall = this.callAgent.join({groupId: <GUID>}, this.callOptions);

/*******************************/
/*  Joining a Teams meetings   */
/*******************************/
// Join a Teams meeting using a meeting link. To get a Teams meeting link, go to the Teams meeting and
// open the participants roster, then click on the 'Share Invite' button and then click on 'Copy link meeting' button.
this.currentCall = this.callAgent.join({meetingLink: <meeting link>}, this.callOptions);
// Join a Teams meeting using a meeting id.
this.currentCall = this.callAgent.join({meetingId: <meeting id> , passcode (optional): <passcode>}, this.callOptions);
// Join a Teams meeting using meeting coordinates. Coordinates can be derived from the meeting link
// Teams meeting link example
const meetingLink = 'https://teams.microsoft.com/l/meetup-join/19:meeting_NjNiNzE3YzMtYzcxNi00ZGQ3LTk2YmYtMjNmOTE1MTVhM2Jl@thread.v2/0?context=%7B%22Tid%22:%2272f988bf-86f1-41af-91ab-2d7cd011db47%22,%22Oid%22:%227e353a91-0f71-4724-853b-b30ee4ca6a42%22%7D'
const url = new URL(meetingLink);
// Derive the coordinates (threadId, messageId, tenantId, and organizerId)
const pathNameSplit = url.pathname.split('/');
const threadId = decodeURIComponent(pathNameSplit[3]);
const messageId = pathNameSplit[4];
const meetingContext = JSON.parse(decodeURIComponent(url.search.replace('?context=', '')));
const organizerId = meetingContext.Oid;
const tenantId = meetingContext.Tid;
this.currentCall = this.callAgent.join({
                                threadId,
                                messageId,
                                tenantId,
                                organizerId
                            }, this.callOptions);
        `;

        const preCallDiagnosticsSampleCode = `
//Get new token or use existing token.
const response = (await fetch('getAcsUserAccessToken')).json();
const token = response.token;
const tokenCredential = new AzureCommunicationTokenCredential(token);

// Start Pre Call diagnostics test
const preCallDiagnosticsResult = await this.callClient.feature(Features.PreCallDiagnostics).startTest(tokenCredential);

// Pre Call Diagnostics results
const deviceAccess =  await preCallDiagnosticsResult.deviceAccess;
const audioDeviceAccess = deviceAccess.audio // boolean
const videoDeviceAccess = deviceAccess.video // boolean

const deviceEnumeration = await preCallDiagnosticsResult.deviceEnumeration;
const microphone = deviceEnumeration.microphone // 'Available' | 'NotAvailable' | 'Unknown';
const camera = deviceEnumeration.camera // 'Available' | 'NotAvailable' | 'Unknown';
const speaker = deviceEnumeration.speaker // 'Available' | 'NotAvailable' | 'Unknown';

const inCallDiagnostics =  await preCallDiagnosticsResult.inCallDiagnostics;

const callConnected = inCallDiagnostics.connected; // boolean

const audioJitter = inCallDiagnostics.diagnostics.audio.jitter; // 'Bad' | 'Average' | 'Good' | 'Unknown';
const audioPacketLoss = inCallDiagnostics.diagnostics.audio.packetLoss; // 'Bad' | 'Average' | 'Good' | 'Unknown';
const audioRtt = inCallDiagnostics.diagnostics.audio.rtt; // 'Bad' | 'Average' | 'Good' | 'Unknown';

const videoJitter = inCallDiagnostics.diagnostics.video.jitter; // 'Bad' | 'Average' | 'Good' | 'Unknown';
const videoPacketLoss = inCallDiagnostics.diagnostics.video.packetLoss; // 'Bad' | 'Average' | 'Good' | 'Unknown';
const videoRtt = inCallDiagnostics.diagnostics.video.rtt; // 'Bad' | 'Average' | 'Good' | 'Unknown';

const brandWidth = inCallDiagnostics.bandWidth; // 'Bad' | 'Average' | 'Good' | 'Unknown';

const browserSupport =  await preCallDiagnosticsResult.browserSupport;
const browser = browserSupport.browser; // 'Supported' | 'NotSupported' | 'Unknown';
const os = browserSupport.os; // 'Supported' | 'NotSupported' | 'Unknown';

const collector = (await preCallDiagnosticsResult.callMediaStatistics).createCollector({
    aggregationInterval: 200,
    dataPointsPerAggregation: 1,
});
collector.on("summaryReported", (mediaStats) => {
    console.log(mediaStats); // Get mediaStats summary for the test call.
});

                `;

        const streamingSampleCode = `
/************************************************/
/*     Local Video and Local Screen-sharing     */
/************************************************/
// To start a video, you have to enumerate cameras using the getCameras()
// method on the deviceManager object. Then create a new instance of
// LocalVideoStream passing the desired camera into the startVideo() method as
// an argument
const cameraDevice = this.callClient.getDeviceManager().getCameras()[0];
const localVideoStream = new LocalVideoStream(cameraDevice);
await call.startVideo(localVideoStream);

// To stop local video, pass the localVideoStream instance available in the
// localVideoStreams collection
await this.currentCall.stopVideo(localVideoStream);

// You can use DeviceManager and Renderer to begin rendering streams from your local camera.
// This stream won't be sent to other participants; it's a local preview feed. This is an asynchronous action.
const renderer = new Renderer(localVideoStream);
const view = await renderer.createView();
document.getElementById('someDiv').appendChild(view.target);

// You can switch to a different camera device while video is being sent by invoking
// switchSource() on a localVideoStream instance
const cameraDevice1 = this.callClient.getDeviceManager().getCameras()[1];
localVideoStream.switchSource(cameraDeivce1);

// Handle 'localVideoStreamsUpdated' event
this.currentCall.on('localVideoStreamsUpdated', e => {
    e.added.forEach(addedLocalVideoStream => { this.handleAddedLocalVideoStream(addedLocalVideoStream) });
    e.removed.forEach(removedLocalVideoStream => { this.handleRemovedLocalVideoStream(removedLocalVideoStream) });
});

// To start sharing your screen
await this.currentCall.startScreenSharing();

// To stop sharing your screen
await this.currentCall.stopScreenSharing();

// Handle 'isScreenSharingOnChanged' event
this.currentCall.on('isScreenSharingOnChanged', this.handleIsScreenSharingOnChanged());




/**************************************************************************************/
/*     Handling Video streams and Screen-sharing streams from remote participants     */
/**************************************************************************************/
// Handle remote participant video and screen-sharing streams
remoteParticipant.videoStreams.forEach(videoStream => subscribeToRemoteVideoStream(videoStream))

// Handle remote participant 'videoStreamsUpdated' event. This is for videos and screen-shrings streams.
remoteParticipant.on('videoStreamsUpdated', videoStreams => {
    videoStreams.added.forEach(addedStream => {
        subscribeToRemoteVideoStream(addedStream)
    });

    videoStreams.removed.forEach(removedStream => {
        unsubscribeFromRemoteVideoStream(removedStream);
    });
});

// Render remote streams on UI. Do this logic in a UI component.
// Please refer to /src/MakeCall/StreamMedia.js of this app for an example of how to render streams on the UI:
const subscribeToRemoteVideoStream = (stream) => {
    let componentContainer = document.getElementById(this.componentId);
    componentContainer.hidden = true;

    let renderer = new VideoStreamRenderer(stream);
    let view;
    let videoContainer;

    const renderStream = async () => {
        if(!view) {
            view = await renderer.createView();
        }
        videoContainer = document.getElementById(this.videoContainerId);
        if(!videoContainer?.hasChildNodes()) { videoContainer.appendChild(view.target); }
    }

    stream.on('isAvailableChanged', async () => {
        if (stream.isAvailable) {
            componentContainer.hidden = false;
            await renderStream();
        } else {
            componentContainer.hidden = true;
        }
    });

    if (stream.isAvailable) {
        componentContainer.hidden = false;
        await renderStream();
    }
}

<div id={this.componentId}>
    <div id={this.videoContainerId}></div>
</div>

        `;

        const muteUnmuteSampleCode = `
// To mute your microphone
await this.currentCall.mute();

// To unmute your microphone
await this.currentCall.unmute();

// Handle remote participant isMutedChanged event
addedParticipant.on('isMutedChanged', () => {
    if(remoteParticipant.isMuted) {
        console.log('Remote participant is muted');
    } else {
        console.log('Remote participant is unmuted');
    }
});
        `;

        const holdUnholdSampleCode = `
/******************************/
/*      To hold the call      */
/******************************/
    // Call state changes when holding
    this.currentCall.on('stateChanged', () => {
        // Call state changes to 'LocalHold' or 'RemoteHold'
        console.log(this.currentCall.state);
    });

    // If you hold the Call, remote participant state changes to 'Hold'.
    // Handle remote participant stateChanged event
    addedParticipant.on('stateChanged', () => {
        console.log(addedParticipant.state); // 'Hold'
    });

    // If you want to hold the call use:
    await this.currentCall.hold();

/******************************/
/*     To unhold the call     */
/******************************/
    // The Call state changes when unholding
    this.currentCall.on('stateChanged', () => {
        // Call state changes back to 'Connected'
        console.log(this.currentCall.state);
    });

    // Remote participant state changes to 'Connected'
    addedParticipant.on('stateChanged', () => {
        console.log(addedParticipant.state); // 'Connected'
    });

    // If you want to unhold the call use:
    await this.currentCall.resume();
        `;

        const deviceManagerSampleCode = `
/*************************************/
/*           Device Manager          */
/*************************************/
// Get the Device Manager.
// The CallAgent must be initialized first in order to be able to access the DeviceManager.
this.deviceManager = this.callClient.getDeviceManager();

// Get list of devices
const cameraDevices = await this.deviceManager.getCameras();
const speakerDevices = await this.deviceManager.getSpeakers();
const microphoneDevices = await this.deviceManager.getMicrophones();

// Set microphone device and speaker device to use across the call stack.
await this.deviceManager.selectSpeaker(speakerDevices[0]);
await this.deviceManager.selectMicrophone(microphoneDevices[0]);
// NOTE: Setting of video camera device to use is specified on CallAgent.startCall() and Call.join() APIs
// by passing a LocalVideoStream into the options paramter.
// To switch video camera device to use during call, use the LocalVideoStream.switchSource() method.

// Get selected speaker and microphone
const selectedSpeaker = this.deviceManager.selectedSpeaker;
const selectedMicrophone = this.deviceManager.selectedMicrophone;

// Handle videoDevicesUpdated event
this.callClient.deviceManager.on('videoDevicesUpdated', e => {
    e.added.forEach(cameraDevice => { this.handleAddedCameraDevice(cameraDevice); });
    e.removed.forEach(removedCameraDevice => { this.handleRemovedCameraDevice(removeCameraDevice); });
});

// Handle audioDevicesUpdate event
this.callClient.deviceManager.on('audioDevicesUpdated', e => {
    e.added.forEach(audioDevice => { this.handleAddedAudioDevice(audioDevice); });
    e.removed.forEach(removedAudioDevice => { this.handleRemovedAudioDevice(removedAudioDevice); });
});

// Handle selectedMicrophoneChanged event
this.deviceManager.on('selectedMicrophoneChanged', () => { console.log(this.deviceManager.selectedMicrophone) });

// Handle selectedSpeakerChanged event
this.deviceManager.on('selectedSpeakerChanged', () => { console.log(this.deviceManager.selectedSpeaker) });
        `;

        const customContextSampleCode = `
/******************************/
/*       Placing a call       */
/******************************/
// Set up customContext
this.callOptions.customContext = {
    userToUser: <USER_TO_USER_VALUE>,
    xHeaders: [
        { key: <CUSTOM_HEADER_KEY>, value: <CUSTOM_HEADER_VALUE> },
    ]
};

// To place a 1:1 call to another ACS user
const userId = { communicationUserId: 'ACS_USER_ID');
this.currentCall = this.callAgent.startCall([userId], this.callOptions);

// Place a 1:1 call to an ACS phone number. PSTN calling is currently in private preview.
// When making PSTN calls, your Alternate Caller Id must be specified in the call options.
const phoneNumber = { phoneNumber: <ACS_PHONE_NUMBER>);
this.callOptions.alternateCallerId = { phoneNumber: <ALTERNATE_CALLER_ID>}
this.currentCall = this.callAgent.startCall([phoneNumber], this.callOptions);

// Place a 1:N call. Specify a multiple destinations
this.currentCall = this.callAgent.startCall([userId1, phoneNumber], this.callOptions);

/******************************/
/*      Receiving a call      */
/******************************/
this.callAgent.on('incomingCall', async (args) => {
    // receiving customContext
    const customContext = args.incomingCall.customContext;
    
    // accept the incoming call
    const call = await args.incomingCall.accept();

    // or reject the incoming call
    args.incomingCall.reject();
});
        `;

        // TODO: Create section component. Couldnt use the ExampleCard compoenent from uifabric because it is buggy,
        //       when toggling their show/hide code functionality, videos dissapear from DOM.

        return (
            <div>
                <Login onLoggedIn={this.handleLogIn} ref={this.logInComponentRef}/>
                {
                    this.state?.callSurvey &&
                    <CallSurvey
                        onSubmitted={() => this.handleCallSurveySubmitted()}
                        call={this.state.callSurvey}
                    />
                }
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <div className="ms-Grid-col ms-lg6 ms-sm6 mb-4">
                                <h2>Placing and receiving calls</h2>
                                <div>{`Permissions audio: ${this.state.permissions.audio} video: ${this.state.permissions.video}`}</div>
                            </div>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Download', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`Get Logs`}
                                    onClick={this.downloadLog}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Download', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`Get Debug Info Log Dump`}
                                    onClick={this.downloadDebugInfoLogDump}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'TransferCall', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showCallSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showCallSampleCode: !this.state.showCallSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        <div className="ms-Grid-row">
                            <div className="ms-Grid-col mb-2">Having provisioned an ACS Identity and initialized the SDK from the section above, you are now ready to place calls, join group calls, and receiving calls.</div>
                        </div>
                        {
                            this.state.showCallSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {callSampleCode}
                                </code>
                            </pre>
                        }
                        {
                            this.state.callError &&
                            <div>
                                <MessageBar
                                    messageBarType={MessageBarType.error}
                                    isMultiline={false}
                                    onDismiss={() => { this.setState({ callError: undefined }) }}
                                    dismissButtonAriaLabel="Close">
                                    <b>{this.state.callError}</b>
                                </MessageBar>

                            </div>
                        }
                        {
                            this.state.deviceManagerWarning &&
                            <MessageBar
                                messageBarType={MessageBarType.warning}
                                isMultiline={false}
                                onDismiss={() => { this.setState({ deviceManagerWarning: undefined }) }}
                                dismissButtonAriaLabel="Close">
                                <b>{this.state.deviceManagerWarning}</b>
                            </MessageBar>
                        }
                        {
                            this.state.ufdMessages.length > 0 &&
                            <MessageBar
                                messageBarType={MessageBarType.warning}
                                isMultiline={true}
                                onDismiss={() => { this.setState({ ufdMessages: [] }) }}
                                dismissButtonAriaLabel="Close">
                                {this.state.ufdMessages.map((msg, index) => <li key={index}>{msg}</li>)}
                            </MessageBar>
                        }
                        {
                            !this.state.incomingCall && !this.state.call && !this.state.callSurvey &&
                            <div>
                                <div className="ms-Grid-row mt-3">
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl6 ms-xxl3">
                                        <div className="ms-Grid-row">
                                            <div className="ms-Grid-col">
                                                <h2 className="mb-0">Place a call</h2>
                                            </div>
                                        </div>
                                        <div className="ms-Grid-row">
                                            <div className="md-Grid-col ml-2 mt-0 ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                <TextField
                                                    className="mt-0"
                                                    disabled={this.state.call || !this.state.loggedIn}
                                                    label={`Enter an Identity to make a call to. You can specify multiple Identities to call by using \",\" separated values.`}
                                                    placeholder="8:acs:<ACA resource ID>_<GUID>"
                                                    componentRef={(val) => this.destinationUserIds = val} />
                                                <TextField
                                                    disabled={this.state.call || !this.state.loggedIn}
                                                    label="Destination Phone Identity or Phone Identities"
                                                    placeholder="4:+18881231234"
                                                    componentRef={(val) => this.destinationPhoneIds = val} />
                                                <TextField
                                                    disabled={this.state.call || !this.state.loggedIn}
                                                    label="If calling a Phone Identity, your Alternate Caller Id must be specified."
                                                    placeholder="4:+18881231234"
                                                    componentRef={(val) => this.alternateCallerId = val} />
                                            </div>
                                        </div>
                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Phone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Place call"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(false)}>
                                        </PrimaryButton>
                                        <PrimaryButton
                                            className="primary-button"
                                            iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Place call with video"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.placeCall(true)}>
                                        </PrimaryButton>
                                        <PrimaryButton 
                                            className="primary-button"
                                            iconProps={{iconName: 'Settings', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                            text={this.state.showCustomContext ? 'Remove context' : 'Custom context'}
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.setState({showCustomContext: !this.state.showCustomContext})}>
                                        </PrimaryButton>
                                        <div className="ms-Grid-row" 
                                             style={{display: this.state.showCustomContext ? 'block' : 'none'}}>
                                            <div className="md-Grid-col ml-2 mt-0 ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                <TextField
                                                    className="mt-0"
                                                    disabled={this.state.call || !this.state.loggedIn}
                                                    label="Add user to user value"
                                                    placeholder=""
                                                    componentRef={(val) => this.userToUser = val} />
                                            </div>
                                        </div>
                                        {[...Array(this.state.xHeadersMaxCount)].map((_, i) =>
                                            <div className="ms-Grid-row" key={i}
                                                 style={{display: i < this.state.xHeadersCount && this.state.showCustomContext ? 'block' : 'none'}}>
                                                <div className="md-Grid-col inline-flex ml-2 mt-0 ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                    <TextField
                                                        className="mt-0 ms-sm6 ms-md6 ms-lg6 ms-xl6 ms-xxl6"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Custom header key"
                                                        placeholder=""
                                                        onChange={() => this.xHeadersChanged()}
                                                        componentRef={(val) => this.xHeaders[i].key = val} />
                                                    <TextField
                                                        className="mt-0 ml-2 ms-sm6 ms-md6 ms-lg6 ms-xl6 ms-xxl6"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Custom header value"
                                                        placeholder=""
                                                        onChange={() => this.xHeadersChanged()}
                                                        componentRef={(val) => this.xHeaders[i].value = val} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl1 ms-xxl1">
                                    </div>
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl6 ms-xxl3">
                                        <div className="ms-Grid-row">
                                            <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl12 ms-xxl12">
                                                <h2 className="mb-1">Join a Teams meeting</h2>
                                            </div>
                                        </div>
                                        <div className="ms-Grid-row">
                                            <div className="md-Grid-col ml-2 ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                <div className={this.state.call || !this.state.loggedIn ? "call-input-panel-input-label-disabled" : ""}>
                                                    Enter meeting link
                                                </div>
                                                <div className="ml-3">
                                                    <TextField
                                                        className="mb-3 mt-0"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Meeting link"
                                                        defaultValue={new URLSearchParams(window.location.search).get(URL_PARAM.MEETING_LINK) ?? ''}
                                                        componentRef={(val) => this.meetingLink = val} />
                                                </div>
                                                <div className={this.state.call || !this.state.loggedIn ? "call-input-panel-input-label-disabled" : ""}>
                                                    Or enter meeting id (and) passcode
                                                </div>
                                                <div className="ml-3">
                                                    <TextField
                                                        className="mb-3 mt-0"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Meeting id"
                                                        componentRef={(val) => this.meetingId = val} />
                                                    <TextField
                                                        className="mb-3"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Meeting passcode (optional)"
                                                        componentRef={(val) => this.passcode = val} />
                                                </div>
                                                <div className={this.state.call || !this.state.loggedIn ? "call-input-panel-input-label-disabled" : ""}>
                                                    Or enter meeting coordinates (Thread Id, Message Id, Organizer Id, and Tenant Id)
                                                </div>
                                                <div className="ml-3">
                                                    <TextField
                                                        className="mt-0"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Thread Id"
                                                        componentRef={(val) => this.threadId = val} />
                                                    <TextField
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Message Id"
                                                        componentRef={(val) => this.messageId = val} />
                                                    <TextField
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Organizer Id"
                                                        componentRef={(val) => this.organizerId = val} />
                                                    <TextField
                                                        className="mb-3"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Tenant Id"
                                                        componentRef={(val) => this.tenantId = val} />
                                                </div>
                                            </div>
                                        </div>
                                        <PrimaryButton className="primary-button"
                                            iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Join Teams meeting"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinTeamsMeeting(false)}>
                                        </PrimaryButton>
                                        <PrimaryButton className="primary-button"
                                            iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                            text="Join Teams meeting with video"
                                            disabled={this.state.call || !this.state.loggedIn}
                                            onClick={() => this.joinTeamsMeeting(true)}>
                                        </PrimaryButton>
                                    </div>
                                    <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl0 ms-xxl1">
                                    </div>
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl6 ms-xxl3">
                                        <div>
                                            <h2 className="mb-0">Join a group call</h2>
                                            <div className="ms-Grid-row">
                                                <div className="ms-Grid-col ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                    <TextField
                                                        className="mb-3 mt-0"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Group Id"
                                                        defaultValue="29228d3e-040e-4656-a70e-890ab4e173e5"
                                                        componentRef={(val) => this.destinationGroup = val} />
                                                </div>
                                            </div>
                                            <PrimaryButton
                                                className="primary-button"
                                                iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                                text="Join group call"
                                                disabled={this.state.call || !this.state.loggedIn}
                                                onClick={() => this.joinGroup(false)}>
                                            </PrimaryButton>
                                            <PrimaryButton
                                                className="primary-button"
                                                iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                                text="Join group call with video"
                                                disabled={this.state.call || !this.state.loggedIn}
                                                onClick={() => this.joinGroup(true)}>
                                            </PrimaryButton>
                                        </div>
                                        <div className="mt-5">
                                            <h2 className="mb-0">Join a Rooms call</h2>
                                            <div className="ms-Grid-row">
                                                <div className="md-Grid-col ml-2 ms-sm11 ms-md11 ms-lg9 ms-xl9 ms-xxl11">
                                                    <TextField className="mb-3 mt-0"
                                                        disabled={this.state.call || !this.state.loggedIn}
                                                        label="Rooms id"
                                                        placeholder="<GUID>"
                                                        componentRef={(val) => this.roomsId = val} />
                                                </div>
                                            </div>
                                            <PrimaryButton className="primary-button"
                                                iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                                text="Join Rooms call"
                                                disabled={this.state.call || !this.state.loggedIn}
                                                onClick={() => this.joinRooms(false)}>
                                            </PrimaryButton>
                                            <PrimaryButton className="primary-button"
                                                iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                                text="Join Rooms call with video"
                                                disabled={this.state.call || !this.state.loggedIn}
                                                onClick={() => this.joinRooms(true)}>
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                                <div className="ms-Grid-row mt-3">
                                    <div className="call-input-panel mb-5 ms-Grid-col ms-sm12 ms-lg12 ms-xl12 ms-xxl4">
                                        <h3 className="mb-1">Video Send Constraints</h3>
                                        <MediaConstraint
                                            onChange={this.handleMediaConstraint}
                                            disabled={this.state.call || !this.state.loggedIn}
                                        />
                                    </div>
                                </div>
                            </div>

                        }
                        {
                            this.state.call && this.state.isPreCallDiagnosticsCallInProgress &&
                            <div>
                                Pre Call Diagnostics call in progress...
                            </div>
                        }
                        {
                            this.state.call && !this.state.callSurvey && !this.state.isPreCallDiagnosticsCallInProgress &&
                            <CallCard
                                call={this.state.call}
                                deviceManager={this.deviceManager}
                                selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                                cameraDeviceOptions={this.state.cameraDeviceOptions}
                                speakerDeviceOptions={this.state.speakerDeviceOptions}
                                microphoneDeviceOptions={this.state.microphoneDeviceOptions}
                                identityMri={this.state.identityMri}
                                isTeamsUser={this.state.isTeamsUser}
                                onShowCameraNotFoundWarning={(show) => { this.setState({ showCameraNotFoundWarning: show }) }}
                                onShowSpeakerNotFoundWarning={(show) => { this.setState({ showSpeakerNotFoundWarning: show }) }}
                                onShowMicrophoneNotFoundWarning={(show) => { this.setState({ showMicrophoneNotFoundWarning: show }) }} />
                        }
                        {
                            this.state.incomingCall && !this.state.call &&
                            <IncomingCallCard
                                incomingCall={this.state.incomingCall}
                                acceptCallMicrophoneUnmutedVideoOff={async () => await this.getCallOptions({ video: false, micMuted: false })}
                                acceptCallMicrophoneUnmutedVideoOn={async () => await this.getCallOptions({ video: true, micMuted: false })}
                                acceptCallMicrophoneMutedVideoOn={async () => await this.getCallOptions({ video: true, micMuted: true })}
                                acceptCallMicrophoneMutedVideoOff={async () => await this.getCallOptions({ video: false, micMuted: true })}
                                onReject={() => { this.setState({ incomingCall: undefined }) }} />
                        }
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Pre Call Diagnostics</h2>
                            <div className="ms-Grid-col ms-lg6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'TestPlan', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`Run Pre Call Diagnostics`}
                                    disabled={this.state.call || !this.state.loggedIn}
                                    onClick={() => this.runPreCallDiagnostics()}>
                                </PrimaryButton>
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'TestPlan', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showPreCallDiagnosticsSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showPreCallDiagnosticsSampleCode: !this.state.showPreCallDiagnosticsSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.call && this.state.isPreCallDiagnosticsCallInProgress &&
                            <div>
                                Pre Call Diagnostics call in progress...
                                <div className="custom-row">
                                    <div className="ringing-loader mb-4"></div>
                                </div>
                            </div>
                        }
                        {
                            this.state.showPreCallDiagnostcisResults &&
                            <div>
                                {
                                    <div className="pre-call-grid-container">
                                        {
                                            this.state.preCallDiagnosticsResults.deviceAccess &&
                                            <div className="pre-call-grid">
                                                <span>Device Permission: </span>
                                                <div  >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Audio: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.deviceAccess.audio.toString()}</div>
                                                </div>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Video: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.deviceAccess.video.toString()}</div>
                                                </div>
                                            </div>
                                        }
                                        {
                                            this.state.preCallDiagnosticsResults.deviceEnumeration &&
                                            <div className="pre-call-grid">
                                                <span>Device Access: </span>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Microphone: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.deviceEnumeration.microphone}</div>
                                                </div>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Camera: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.deviceEnumeration.camera}</div>
                                                </div>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Speaker: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.deviceEnumeration.speaker}</div>
                                                </div>
                                            </div>
                                        }
                                        {
                                            this.state.preCallDiagnosticsResults.browserSupport &&
                                            <div className="pre-call-grid">
                                                <span>Browser Support: </span>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">OS: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.browserSupport.os}</div>
                                                </div>
                                                <div >
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Browser: </div>
                                                    <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.browserSupport.browser}</div>
                                                </div>
                                            </div>
                                        }
                                        {
                                            this.state.preCallDiagnosticsResults.inCallDiagnostics &&
                                            <div className="pre-call-grid">
                                                <span>Call Diagnostics: </span>
                                                <div className="pre-call-grid">
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Call Connected: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.connected.toString()}</div>
                                                    </div>
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">BandWidth: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.bandWidth}</div>
                                                    </div>

                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Audio Jitter: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.audio.jitter}</div>
                                                    </div>
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Audio PacketLoss: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.audio.packetLoss}</div>
                                                    </div>
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Audio Rtt: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.audio.rtt}</div>
                                                    </div>

                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Video Jitter: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.video.jitter}</div>
                                                    </div>
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Video PacketLoss: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.video.packetLoss}</div>
                                                    </div>
                                                    <div >
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">Video Rtt: </div>
                                                        <div className="ms-Grid-col ms-u-sm2 pre-call-grid-panel">{this.state.preCallDiagnosticsResults.inCallDiagnostics.diagnostics.video.rtt}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        }
                        {
                            this.state.showPreCallDiagnosticsSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {
                                        preCallDiagnosticsSampleCode
                                    }
                                </code>
                            </pre>
                        }
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Video, Screen sharing, and local video preview</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Video', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showStreamingSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showStreamingSampleCode: !this.state.showStreamingSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.showStreamingSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {streamingSampleCode}
                                </code>
                            </pre>
                        }
                        <h3>
                            Video - try it out.
                        </h3>
                        <div>
                            From your current call, toggle your video on and off by clicking on the <Icon className="icon-text-xlarge" iconName="Video" /> icon.
                            When you start your video, remote participants can see your video by receiving a stream and rendering it in an HTML element.
                        </div>
                        <br></br>
                        <h3>
                            Screen sharing - try it out.
                        </h3>
                        <div>
                            From your current call, toggle your screen sharing on and off by clicking on the <Icon className="icon-text-xlarge" iconName="TVMonitor" /> icon.
                            When you start sharing your screen, remote participants can see your screen by receiving a stream and rendering it in an HTML element.
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Mute / Unmute</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Microphone', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showMuteUnmuteSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showMuteUnmuteSampleCode: !this.state.showMuteUnmuteSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.showMuteUnmuteSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {muteUnmuteSampleCode}
                                </code>
                            </pre>
                        }
                        <h3>
                            Try it out.
                        </h3>
                        <div>
                            From your current call, toggle your microphone on and off by clicking on the <Icon className="icon-text-xlarge" iconName="Microphone" /> icon.
                            When you mute or unmute your microphone, remote participants can receive an event about wether your micrphone is muted or unmuted.
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Hold / Unhold</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Play', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showHoldUnholdSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showHoldUnholdSampleCode: !this.state.showHoldUnholdSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.showHoldUnholdSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {holdUnholdSampleCode}
                                </code>
                            </pre>
                        }
                        <h3>
                            Try it out.
                        </h3>
                        <div>
                            From your current call, toggle hold call and unhold call on by clicking on the <Icon className="icon-text-xlarge" iconName="Play" /> icon.
                            When you hold or unhold the call, remote participants can receive other participant state changed events. Also, the call state changes.
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Device Manager</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Settings', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showDeviceManagerSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showDeviceManagerSampleCode: !this.state.showDeviceManagerSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.showDeviceManagerSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {deviceManagerSampleCode}
                                </code>
                            </pre>
                        }
                        <h3>
                            Try it out.
                        </h3>
                        <div>
                            From your current call, click on the <Icon className="icon-text-xlarge" iconName="Settings" /> icon to open up the settings panel.
                            The DeviceManager is used to select the devices (camera, microphone, and speakers) to use across the call stack and to preview your camera.
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="ms-Grid">
                        <div className="ms-Grid-row">
                            <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">Custom Context</h2>
                            <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                <PrimaryButton
                                    className="secondary-button"
                                    iconProps={{ iconName: 'Settings', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                    text={`${this.state.showCustomContextSampleCode ? 'Hide' : 'Show'} code`}
                                    onClick={() => this.setState({ showCustomContextSampleCode: !this.state.showCustomContextSampleCode })}>
                                </PrimaryButton>
                            </div>
                        </div>
                        {
                            this.state.showCustomContextSampleCode &&
                            <pre>
                                <code style={{ color: '#b3b0ad' }}>
                                    {customContextSampleCode}
                                </code>
                            </pre>
                        }
                        <h3>
                            Try it out.
                        </h3>
                        <div>
                            Before starting the call, click on the <Icon className="icon-text-xlarge" iconName="Settings" /> Custom context button to open up the settings panel.
                            Then you can set your user to user value and up to five custom headers.
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
