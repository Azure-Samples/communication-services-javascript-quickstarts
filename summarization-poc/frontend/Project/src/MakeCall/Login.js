import React from "react";
import {
    TextField, PrimaryButton, Checkbox,
    MessageBar, MessageBarType
} from 'office-ui-fabric-react'
import { Features } from "@azure/communication-calling";
import { utils } from "../Utils/Utils";
import { v4 as uuid } from 'uuid';
import OneSignal from "react-onesignal";
import config from '../../clientConfig.json';
import { TurnConfiguration } from './NetworkConfiguration/TurnConfiguration';
import { ProxyConfiguration } from './NetworkConfiguration/ProxyConfiguration';
import { URL_PARAM } from "../Constants";

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.callAgent = undefined;
        this.callClient = undefined;
        this.userDetailsResponse = undefined;
        
        // Set display name from the URL
        const params = new URLSearchParams(window.location.search);
        this.displayName = params.get(URL_PARAM.DISPLAY_NAME) === null ? undefined : params.get(URL_PARAM.DISPLAY_NAME);
        this.clientTag = uuid();
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        this._callAgentInitPromise = undefined;
        this._callAgentInitPromiseResolve = undefined;
        this.currentCustomTurnConfig = undefined;
        this.teamsUserEmail= '';
        this.teamsUserPassword= '';
        this.state = {
            isCallClientActiveInAnotherTab: false,
            environmentInfo: undefined,
            showCallClientOptions: false,
            initializedOneSignal: false,
            subscribedForPushNotifications: false,
            initializeCallAgentAfterPushRegistration: true,
            showUserProvisioningAndSdkInitializationCode: false,
            showSpinner: false,
            loginWarningMessage: undefined,
            loginErrorMessage: undefined,
            proxy: {
                useProxy: false,
                url: ''
            },
            customTurn: {
                useCustomTurn: false,
                turn: null
            },
            isTeamsUser: false,
            isJoinOnlyToken: false
        }
    }

    async componentDidMount() {
        try {
            if (config.oneSignalAppId) {
                if (location.protocol !== 'https:') {
                    throw new Error('Web push notifications can only be tested on trusted HTTPS.');
                }

                await OneSignal.init({
                    appId: config.oneSignalAppId,
                    safari_web_id: config.oneSignalSafariWebId,
                    notifyButton: {
                        enable: true,
                        colors: {
                            'circle.background': '#ca5010'
                        }
                    },
                });

                OneSignal.addListenerForNotificationOpened(async function (event) {
                    console.log('Push notification clicked and app will open if it is currently closed');
                    await this.handlePushNotification(event);
                }.bind(this));

                OneSignal.on('notificationDisplay', async function (event) {
                    console.log('Push notification displayed');
                    await this.handlePushNotification(event);
                }.bind(this));

                OneSignal.on('subscriptionChange', async function(isSubscribed) {
                    console.log("Push notification subscription state is now: ", isSubscribed);
                    this.setState({ subscribedForPushNotifications:
                        (await OneSignal.isPushNotificationsEnabled()) && (await OneSignal.getSubscription())
                    });
                }.bind(this));

                this.setState({ initializedOneSignal: true});
                this.setState({ subscribedForPushNotifications:
                    (await OneSignal.isPushNotificationsEnabled()) && (await OneSignal.getSubscription())
                });

                await OneSignal.registerForPushNotifications();
            }
        } catch (error) {
            this.setState({
                loginWarningMessage: error.message
            });
            console.warn(error);
        }
    }

    async setupLoginStates() {
        this.setState({
            token: this.userDetailsResponse.communicationUserToken.token
        });
        this.setState({
            communicationUserId: utils.getIdentifierText(this.userDetailsResponse.userId)
        });
        
        if (!this.state.subscribedForPushNotifications ||
            (this.state.subscribedForPushNotifications && this.state.initializeCallAgentAfterPushRegistration)) {
            await this.props.onLoggedIn({ 
                communicationUserId: this.userDetailsResponse.userId.communicationUserId,
                token: this.userDetailsResponse.communicationUserToken.token,
                displayName: this.displayName,
                clientTag:this.clientTag,
                proxy: this.state.proxy,
                customTurn: this.state.customTurn,
                isTeamsUser: this.state.isTeamsUser
            });
        }
        console.log('Login response: ', this.userDetailsResponse);
        this.setState({ loggedIn: true });
    }

    async logIn() {
        try {
            this.setState({ isTeamsUser: false });
            this.setState({ showSpinner: true });
            if (!this.state.token && !this.state.communicationUserId) {
                this.userDetailsResponse = await utils.getCommunicationUserToken(undefined, this.state.isJoinOnlyToken);
            } else if (this.state.token && this.state.communicationUserId) {
                this.userDetailsResponse = await utils.getOneSignalRegistrationTokenForCommunicationUserToken(
                    this.state.token, this.state.communicationUserId
                );
            } else if (!this.state.token && this.state.communicationUserId) {
                this.userDetailsResponse = await utils.getCommunicationUserToken(this.state.communicationUserId, this.state.isJoinOnlyToken);
            } else if (this.state.token && !this.state.communicationUserId) {
                throw new Error('You must specify the associated ACS identity for the provided ACS communication user token');
            }
            if (this.state.initializedOneSignal) {
                OneSignal.setExternalUserId(this.userDetailsResponse.oneSignalRegistrationToken);
            }
            await this.setupLoginStates()
        } catch (error) {
            this.setState({
                loginErrorMessage: error.message
            });
            console.log(error);
        } finally {
            this.setState({ showSpinner: false });
        }
    }

    async teamsUserOAuthLogin() {
        try {
            this.setState({ isTeamsUser: true });
            this.setState({ showSpinner: true });
            this.userDetailsResponse  = this.teamsUserEmail && this.teamsUserPassword ?
                await utils.teamsM365Login(this.teamsUserEmail, this.teamsUserPassword ):
                await utils.teamsPopupLogin();
            this.teamsUserEmail = this.teamsUserPassword = '';
            await this.setupLoginStates();
        } catch (error) {
            this.setState({
                loginErrorMessage: error.message
            });
            console.log(error);
        } finally {
            this.setState({ showSpinner: false });
        }
    }

    async handlePushNotification(event) {
        try {
            if (!this.callAgent && !!event.data.incomingCallContext) {
                if (!this.state.token) {
                    const oneSignalRegistrationToken = await OneSignal.getExternalUserId();
                    this.userDetailsResponse = await utils.getCommunicationUserTokenForOneSignalRegistrationToken(oneSignalRegistrationToken);
                    this.setState({
                        token: this.userDetailsResponse.communicationUserToken.token
                    });
                    this.setState({
                        communicationUserId: utils.getIdentifierText(this.userDetailsResponse.userId.communicationUserId)
                    });
                }
                this.props.onLoggedIn({ 
                    communicationUserId: this.userDetailsResponse.communicationUserToken.user.communicationUserId,
                    token: this.userDetailsResponse.communicationUserToken.token,
                    displayName: this.displayName,
                    clientTag:this.clientTag,
                    proxy: this.state.proxy,
                    customTurn: this.state.customTurn
                });
                this._callAgentInitPromise = new Promise((resolve) => { this._callAgentInitPromiseResolve = resolve });
                await this._callAgentInitPromise;
                console.log('Login response: ', this.userDetailsResponse);
                this.setState({ loggedIn: true })
                if (!this.callAgent.handlePushNotification) {
                    throw new Error('Handle push notification feature is not implemented in ACS Web Calling SDK yet.');
                }
                await this.callAgent.handlePushNotification(event.data);
            }
        } catch (error) {
            this.setState({
                loginErrorMessage: error.message
            });
            console.log(error);
        }
    }

    setCallAgent(callAgent) {
        this.callAgent = callAgent;
        this.callAgent.on('connectionStateChanged', (args) => {
            console.log('Call agent connection state changed from', args.oldValue, 'to', args.newValue);
            this.setState({callAgentConnectionState: args.newValue});
            if(args.reason === 'tokenExpired') {
                this.setState({ loggedIn: false });
                alert('Your token has expired. Please log in again.');
            }
        });
        this.setState({callAgentConnectionState: this.callAgent.connectionState});

        if (!!this._callAgentInitPromiseResolve) {
            this._callAgentInitPromiseResolve();
        }
    }

    async setCallClient(callClient) {
        this.callClient = callClient;
        const environmentInfo = await this.callClient.getEnvironmentInfoInternal();
        this.setState({ environmentInfo });
        const debugInfoFeature = await this.callClient.feature(Features.DebugInfo);
        this.setState({ isCallClientActiveInAnotherTab: debugInfoFeature.isCallClientActiveInAnotherTab });
        debugInfoFeature.on('isCallClientActiveInAnotherTabChanged', () => {
            this.setState({ isCallClientActiveInAnotherTab: debugInfoFeature.isCallClientActiveInAnotherTab });
        });
    }

    handleProxyChecked = (e, isChecked) => {
        this.setState({
            ...this.state,
            proxy: {
                ...this.state.proxy,
                useProxy: isChecked
            }
        });
    };

    handleAddProxyUrl = (input) => {
        if (input) {
            this.setState({
                ...this.state,
                proxy: {
                    ...this.state.proxy,
                    url: input
                }
            });
        }
    };

    handleProxyUrlReset = () => {
        this.setState({
            ...this.state,
            proxy: {
                ...this.state.proxy,
                url: ''
            }
        });
    };

    handleAddTurnConfig = (iceServer) => {
        const turnConfig = this.state.customTurn.turn ?? {
            iceServers: []
        };
        turnConfig.iceServers.push(iceServer);

        this.setState({
            ...this.state,
            customTurn: {
                ...this.state.customTurn,
                turn: turnConfig
            }
        });
    }

    handleCustomTurnChecked = (e, isChecked) => {
        if (isChecked) {
            this.setState({
                ...this.state,
                customTurn: {
                    ...this.state.customTurn,
                    useCustomTurn: true
                }
            });
        } else {
            this.setState({
                ...this.state,
                customTurn: {
                    ...this.state.customTurn,
                    useCustomTurn: false,
                    turn: null
                }
            });
        }
    }

    getOrCreateCustomTurnConfiguration = async () => {
        const iceServers = this.state.customTurn.turn.iceServers.map(iceServer => {
            return {
                urls: [...iceServer.urls],
                username: iceServer.username,
                credential: iceServer.credential
            };
        });

        return { iceServers };
    }

    handleTurnUrlResetToDefault = () => {
        this.setState({
            ...this.state,
            customTurn: {
                ...this.state.customTurn
            }
        });

        this.getOrCreateCustomTurnConfiguration().then(res => {
            this.setState({
                ...this.state,
                customTurn: {
                    ...this.state.customTurn,
                    turn: res
                }
            });
        }).catch(error => {
            console.error(`Not able to fetch custom TURN: ${error}`);
            this.setState({
                ...this.state,
                customTurn: {
                    ...this.state.customTurn,
                    useCustomTurn: false,
                    turn: null
                }
            });
        });
    }

    handleTurnUrlReset = () => {
        this.setState({
            ...this.state,
            customTurn: {
                ...this.state.customTurn,
                turn: null
            }
        });
    }

    render() {
        const userProvisioningAndSdkInitializationCode = `
/**************************************************************************************
 *   User token provisioning service should be set up in a trusted backend service.   *
 *   Client applications will make requests to this service for gettings tokens.      *
 **************************************************************************************/
import  { CommunicationIdentityClient } from @azure/communication-administration;
const communicationIdentityClient = new CommunicationIdentityClient(<RESOURCE CONNECTION STRING>);
app.get('/getAcsUserAccessToken', async (request, response) => {
    try {
        const communicationUserId = await communicationIdentityClient.createUser();
        const tokenResponse = await communicationIdentityClient.issueToken({ communicationUserId }, ['voip']);
        response.json(tokenResponse);
    } catch(error) {
        console.log(error);
    }
});

/********************************************************************************************************
 *   Client application initializing the ACS Calling Client Web SDK after receiving token from service   *
 *********************************************************************************************************/
import { CallClient, Features } from '@azure/communication-calling';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { AzureLogger, setLogLevel } from '@azure/logger';

export class MyCallingApp {
    constructor() {
        this.callClient = undefined;
        this.callAgent = undefined;
        this.deviceManager = undefined;
        this.currentCall = undefined;
    }

    public async initCallClient() {
        const response = (await fetch('/getAcsUserAccessToken')).json();
        const token = response.token;
        const tokenCredential = new AzureCommunicationTokenCredential(token);

        // Set log level for the logger
        setLogLevel('verbose');
        // Redirect logger output to wherever desired
        AzureLogger.log = (...args) => { console.log(...args); };
        // CallClient is the entrypoint for the SDK. Use it to
        // to instantiate a CallClient and to access the DeviceManager
        this.callClient = new CallClient();
        this.callAgent = await this.callClient.createCallAgent(tokenCredential, { displayName: 'Optional ACS user name'});
        this.deviceManager = await this.callClient.getDeviceManager();

        // Handle Calls and RemoteParticipants
        // Subscribe to 'callsUpdated' event to be when a a call is added or removed
        this.callAgent.on('callsUpdated', calls => {
            calls.added.foreach(addedCall => {
                // Get the state of the call
                addedCall.state;

                //Subscribe to call state changed event
                addedCall.on('stateChanged', callStateChangedHandler);

                // Get the unique Id for this Call
                addedCall.id;

                // Subscribe to call id changed event
                addedCall.on('idChanged', callIdChangedHandler);

                // Wether microphone is muted or not
                addedCall.isMuted;

                // Subscribe to isMuted changed event
                addedCall.on('isMutedChanged', isMutedChangedHandler);

                // Subscribe to current remote participants in the call
                addedCall.remoteParticipants.forEach(participant => {
                    subscribeToRemoteParticipant(participant)
                });

                // Subscribe to new added remote participants in the call
                addedCall.on('remoteParticipantsUpdated', participants => {
                    participants.added.forEach(addedParticipant => {
                        subscribeToRemoteParticipant(addedParticipant)
                    });

                    participants.removed.forEach(removedParticipant => {
                        unsubscribeFromRemoteParticipant(removedParticipant);
                    });
                });
            });

            calls.removed.foreach(removedCall => {
                removedCallHandler(removedCall);
            });
        });
    }

    private subscribeToRemoteParticipant(remoteParticipant) {
        // Get state of this remote participant
        remoteParticipant.state;

        // Subscribe to participant state changed event.
        remoteParticipant.on('stateChanged', participantStateChangedHandler);

        // Whether this remote participant is muted or not
        remoteParticipant.isMuted;

        // Subscribe to is muted changed event.
        remoteParticipant.on('isMutedChanged', isMutedChangedHandler);

        // Get participant's display name, if it was set
        remoteParticipant.displayName;

        // Subscribe to display name changed event
        remoteParticipant.on('displayNameChanged', dispalyNameChangedHandler);

        // Weather the participant is speaking or not
        remoteParticipant.isSpeaking;

        // Subscribe to participant is speaking changed event
        remoteParticipant.on('isSpeakingChanged', isSpeakingChangedHandler);

        // Handle remote participant's current video streams
        remoteParticipant.videoStreams.forEach(videoStream => { subscribeToRemoteVideoStream(videoStream) });

        // Handle remote participants new added video streams and screen-sharing streams
        remoteParticipant.on('videoStreamsUpdated', videoStreams => {
            videoStream.added.forEach(addedStream => {
                subscribeToRemoteVideoStream(addedStream);
            });
            videoStream.removed.forEach(removedStream => {
                unsubscribeFromRemoteVideoStream(removedStream);
            });
        });
    }
}

/**************************************************************************************/
/*     Environment Information     */
/**************************************************************************************/
// Get current environment information with details if supported by ACS
this.environmentInfo = await this.callClient.getEnvironmentInfo();

// The returned value is an object of type EnvironmentInfo
type EnvironmentInfo = {
    environment: Environment;
    isSupportedPlatform: boolean;
    isSupportedBrowser: boolean;
    isSupportedBrowserVersion: boolean;
    isSupportedEnvironment: boolean;
};

// The Environment type in the EnvironmentInfo type is defined as:
type Environment = {
    platform: string;
    browser: string;
    browserVersion: string;
};

// The following code snippet shows how to get the current environment details
const currentOperatingSystem = this.environmentInfo.environment.platform;
const currentBrowser = this.environmentInfo.environment.browser;
const currentBrowserVersion = this.environmentInfo.environment.browserVersion;

// The following code snippet shows how to check if environment details are supported by ACS
const isSupportedOperatingSystem = this.environmentInfo.isSupportedPlatform;
const isSupportedBrowser = this.environmentInfo.isSupportedBrowser;
const isSupportedBrowserVersion = this.environmentInfo.isSupportedBrowserVersion;
const isSupportedEnvironment = this.environmentInfo.isSupportedEnvironment;
        `;

        return (
                    <div className="card">
                        <div className="ms-Grid">
                            <div className="ms-Grid-row">
                                <h2 className="ms-Grid-col ms-lg6 ms-sm6 mb-4">User Identity Provisioning and Calling SDK Initialization</h2>
                                <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                                    <PrimaryButton className="secondary-button"
                                        iconProps={{iconName: 'Settings', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                        text={`${this.state.showCallClientOptions ? 'Hide' : 'Show'} options`}
                                        onClick={() => this.setState({showCallClientOptions: !this.state.showCallClientOptions})}>
                                    </PrimaryButton>
                                    <PrimaryButton className="secondary-button"
                                        iconProps={{iconName: 'ReleaseGate', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                        text={`${this.state.showUserProvisioningAndSdkInitializationCode ? 'Hide' : 'Show'} code`}
                                        onClick={() => this.setState({showUserProvisioningAndSdkInitializationCode: !this.state.showUserProvisioningAndSdkInitializationCode})}>
                                    </PrimaryButton>
                                </div>
                            </div>
                            <div className="ms-Grid-row">
                            {
                                this.state.loginWarningMessage &&
                                <MessageBar
                                    className="mb-2"
                                    messageBarType={MessageBarType.warning}
                                    isMultiline={true}
                                    onDismiss={() => { this.setState({ loginWarningMessage: undefined })}}
                                    dismissButtonAriaLabel="Close">
                                    <b>{this.state.loginWarningMessage}</b>
                                </MessageBar>
                            }
                            </div>
                            <div className="ms-Grid-row">
                            {
                                this.state.loginErrorMessage &&
                                <MessageBar
                                    className="mb-2"
                                    messageBarType={MessageBarType.error}
                                    isMultiline={true}
                                    onDismiss={() => { this.setState({ loginErrorMessage: undefined })}}
                                    dismissButtonAriaLabel="Close">
                                    <b>{this.state.loginErrorMessage}</b>
                                </MessageBar>
                            }
                            </div>
                            {
                                this.state.showUserProvisioningAndSdkInitializationCode &&
                                <pre>
                                    <code style={{color: '#b3b0ad'}}>
                                        {userProvisioningAndSdkInitializationCode}
                                    </code>
                                </pre>
                            }
                            {
                                this.state.showSpinner &&
                                <div className="justify-content-left mt-4">
                                    <div className="loader inline-block"> </div>
                                    <div className="ml-2 inline-block">Initializing SDK...</div>
                                </div>
                            }
                            {
                                this.state.showCallClientOptions &&
                                <div>
                                    <div className="ms-Grid-row mt-4">
                                        <h3 className="ms-Grid-col ms-sm12 ms-md12 ms-lg12">Options</h3>
                                    </div>
                                    <div className="ms-Grid-row mt-1">
                                        <div className="ms-Grid-col ms-sm12 ms-md4 ms-lg4"
                                            disabled={
                                                !this.state.initializedOneSignal ||
                                                !this.state.subscribedForPushNotifications ||
                                                this.isSafari
                                            }>
                                            Push Notifications options
                                            <Checkbox
                                                className="mt-2"
                                                label="Initialize Call Agent"
                                                disabled={
                                                    !this.state.initializedOneSignal ||
                                                    !this.state.subscribedForPushNotifications ||
                                                    this.isSafari
                                                }
                                                checked={this.state.initializeCallAgentAfterPushRegistration}
                                                onChange={(e, isChecked) => { this.setState({ initializeCallAgentAfterPushRegistration: isChecked })}}/>
                                        </div>
                                        <div className='ms-Grid-col ms-sm12 ms-md4 ms-lg4'>
                                            <TurnConfiguration
                                                customTurn={this.state.customTurn}
                                                handleCustomTurnChecked={this.handleCustomTurnChecked}
                                                handleAddTurnConfig={this.handleAddTurnConfig}
                                                handleTurnUrlResetToDefault={this.handleTurnUrlResetToDefault}
                                                handleTurnUrlReset={this.handleTurnUrlReset}
                                            />
                                        </div>
                                        <div className='ms-Grid-col ms-sm12 ms-md4 ms-lg4'>
                                            <ProxyConfiguration 
                                                proxy={this.state.proxy}
                                                handleProxyChecked={this.handleProxyChecked}
                                                handleAddProxyUrl={this.handleAddProxyUrl}
                                                handleProxyUrlReset={this.handleProxyUrlReset}
                                            />
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                this.state.loggedIn && !this.state.isTeamsUser &&
                                    <div>
                                        <br></br>
                                        <div>Congrats! You've provisioned an ACS user identity and initialized the ACS Calling Client Web SDK. You are ready to start making calls!</div>
                                        <div>The Identity you've provisioned is: <span className="identity fontweight-700">{this.state.communicationUserId}</span></div>
                                        <div>Usage is tagged with: <span className="identity fontweight-700">{this.clientTag}</span></div>
                                        <div>Connection status: <span className="identity fontweight-700">{this.state.callAgentConnectionState}</span></div>
                                    </div>  
                            }
                            {
                                !this.state.showSpinner && !this.state.loggedIn &&
                                <div>
                                    <div className="ms-Grid-row">
                                        <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl6 ms-xxl6">
                                            <div className="login-pannel">
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                        <h2>ACS User Identity</h2>
                                                    </div>
                                                </div>
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                        <div>The ACS Identity SDK can be used to create a user access token which authenticates the calling clients. </div>
                                                        <div>The example code shows how to use the ACS Identity SDK from a backend service. A walkthrough of integrating the ACS Identity SDK can be found on <a className="sdk-docs-link" target="_blank" href="https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript">Microsoft Docs</a></div>
                                                    </div>
                                                </div>
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg9 ms-xl9 ms-xxl9">
                                                        <TextField
                                                                defaultValue={this.displayName}
                                                                placeholder="Display Name"
                                                                label="Optional - Display name"
                                                                onChange={(e) => { this.displayName = e.target.value }}/>
                                                        <TextField
                                                                defaultValue={this.clientTag}
                                                                label="Optinal - Usage tag for this session"
                                                                onChange={(e) => { this.clientTag = e.target.value }}/>
                                                        <TextField
                                                            placeholder="JWT Token"
                                                            label="Optional - ACS token. If no token is entered, then a random one will be generated"
                                                            onChange={(e) => { this.state.token = e.target.value }}/>
                                                        <TextField
                                                                placeholder="8:acs:<ACS Resource ID>_<GUID>"
                                                                label="Optional - ACS Identity"
                                                                onChange={(e) => { this.state.communicationUserId = e.target.value }}/>
                                                    </div>
                                                </div>
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                    <Checkbox 
                                                        className='mt-3'
                                                        label='Join only token'
                                                        checked={this.state.isJoinOnlyToken}
                                                        onChange={(e, isChecked) => this.setState({isJoinOnlyToken: isChecked})} />    
                                                    </div>
                                                </div>
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                        <PrimaryButton className="primary-button mt-3"
                                                            iconProps={{iconName: 'ReleaseGate', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                                            label="Provision an user" 
                                                            onClick={() => this.logIn()}>
                                                                Login ACS user and initialize SDK
                                                        </PrimaryButton>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg12 ms-xl6 ms-xxl6">
                                            <div className="login-pannel teams">
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                        <h2>Teams User Identity</h2>
                                                    </div>
                                                </div>
                                                <div className="ms-Grid-row">
                                                    <div className="ms-Grid-col">
                                                        <div>Microsoft Authentication Library (MSAL) is used to retrieve user token which is then exchanged to get an access
                                                            to get an access token from the communication service. The access token is then used to initialize the ACS SDK</div>
                                                        <div>Information and steps on how to generate access token for a Teams user can be found in the  <a className="sdk-docs-link" target="_blank" href="https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/manage-teams-identity?pivots=programming-language-javascript">Microsoft Docs</a></div>
                                                        <div>On clicking the Login Teams User and Initialize SDK, if the Teams user email or password is not provided, Microsoft signin pop-up will be used </div>
                                                    </div>
                                                </div>
                                                {
                                                    (!this.state.showSpinner && !this.state.loggedIn) &&
                                                    <div>
                                                        <div className="ms-Grid-row">
                                                            <div className="ms-Grid-col ms-sm12 ms-md12 ms-lg9 ms-xl9 ms-xxl9">
                                                                <TextField 
                                                                    className="mt-3"
                                                                    placeholder="Teams User Email" 
                                                                    onBlur={(e) => { this.teamsUserEmail = e.target.value }} />
                                                                <TextField
                                                                    type="password"
                                                                    className="mt-3"
                                                                    placeholder="Teams User Password" 
                                                                    onBlur={(e) => { this.teamsUserPassword = e.target.value }} />
                                                            </div>
                                                        </div>
                                                        <div className="ms-Grid-row">
                                                            <div className="ms-Grid-col">
                                                            <PrimaryButton className="primary-button mt-3"
                                                                iconProps={{iconName: 'ReleaseGate', style: {verticalAlign: 'middle', fontSize: 'large'}}}
                                                                onClick={() => this.teamsUserOAuthLogin()}>
                                                                    Login Teams user and Initialize SDK
                                                            </PrimaryButton>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                this.state.loggedIn && this.state.isTeamsUser &&
                                    <div>
                                        <br></br>
                                        <div>Congrats! Teams User was successfully logged in. You are ready to start making calls!</div>
                                        <div>Teams User logged in identity is: <span className="identity"><b>{this.state.communicationUserId}</b></span></div>
                                        {<div>Usage is tagged with: <span className="identity"><b>{this.clientTag}</b></span></div>}
                                    </div>
                            }
                            {
                                this.state.loggedIn &&
                                <div>
                                    <div className="ms-Grid-row mt-4">
                                        <h3 className="ms-Grid-col ms-sm12 ms-md12 ms-lg12">Environment information</h3>
                                    </div>
                                    <div className="ms-Grid-row ml-1">
                                        <div className="ms-Grid-col ms-sm12 ms-md6 ms-lg3">
                                            <h4>Current environment details</h4>
                                            <div>{`Operating system:   ${this.state.environmentInfo?.environment?.platform}.`}</div>
                                            <div>{`Browser:  ${this.state.environmentInfo?.environment?.browser}.`}</div>
                                            <div>{`Browser's version:  ${this.state.environmentInfo?.environment?.browserVersion}.`}</div>
                                            <div>{`Is the application loaded in many tabs:  ${this.state.isCallClientActiveInAnotherTab}.`}</div>
                                        </div>
                                        <div className="ms-Grid-col ms-sm12 ms-md6 ms-lg9">
                                            <h4>Environment support verification</h4>
                                            <div>{`Operating system supported:  ${this.state.environmentInfo?.isSupportedPlatform}.`}</div>
                                            <div>{`Browser supported:  ${this.state.environmentInfo?.isSupportedBrowser}.`}</div>
                                            <div>{`Browser's version supported:  ${this.state.environmentInfo?.isSupportedBrowserVersion}.`}</div>
                                            <div>{`Current environment supported:  ${this.state.environmentInfo?.isSupportedEnvironment}.`}</div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
        );
    }
}
