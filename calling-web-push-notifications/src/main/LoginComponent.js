import React from "react";
import { utils } from "../utils/common";
import { v4 as uuid } from 'uuid';
import OneSignal from "react-onesignal";
import * as config from '../../clientConfig.json';
import { Button, Label, Input, Checkbox, shorthands, makeStyles, useId } from "@fluentui/react-components";
import { Alert } from "@fluentui/react-components/unstable";
export class LoginComponent extends React.Component {
    constructor(props) {
        super(props);
        this.userDetailsResponse = undefined;
        this.displayName = undefined;
        this.clientTag = uuid();
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        this._callAgentInitPromise = undefined;
        this._callAgentInitPromiseResolve = undefined;
        this.state = {
            initializedOneSignal: false,
            subscribedForPushNotifications: false,
            initializeCallAgentAfterPushRegistration: true,
            showUserProvisioningAndSdkInitializationCode: false,
            showSpinner: false,
            loginWarningMessage: undefined,
            loginErrorMessage: undefined
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

    async logIn() {
        try {
            this.setState({ showSpinner: true });
            if (!this.state.token && !this.state.communicationUserId) {
                this.userDetailsResponse = await utils.getCommunicationUserToken();
            } else if (this.state.token && this.state.communicationUserId) {
                this.userDetailsResponse = await utils.getOneSignalRegistrationTokenForCommunicationUserToken(
                    this.state.token, this.state.communicationUserId
                );
            } else if (this.state.token && !this.state.communicationUserId) {
                throw new Error('You must specify the associated ACS identity for the provided ACS communication user token');
            } else if (!this.state.token && this.state.communicationUserId) {
                throw new Error('You must specify the ACS communication user token for the provided ACS identity');
            }
            this.setState({
                token: this.userDetailsResponse.communicationUserToken.token
            });
            this.setState({
                communicationUserId: utils.getIdentifierText(this.userDetailsResponse.communicationUserToken.user)
            });
            if (this.state.initializedOneSignal) {
                OneSignal.setExternalUserId(this.userDetailsResponse.oneSignalRegistrationToken);
            }
            if (!this.state.subscribedForPushNotifications ||
                (this.state.subscribedForPushNotifications && this.state.initializeCallAgentAfterPushRegistration)) {
                await this.props.onLoggedIn({ communicationUserId: this.userDetailsResponse.communicationUserToken.user.communicationUserId,
                    token: this.userDetailsResponse.communicationUserToken.token, displayName: this.displayName, clientTag:this.clientTag });
            }
            console.log('Login response: ', this.userDetailsResponse);
            this.setState({ loggedIn: true });
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
                        communicationUserId: utils.getIdentifierText(this.userDetailsResponse.communicationUserToken.user)
                    });
                }
                this.props.onLoggedIn({ communicationUserId: this.userDetailsResponse.communicationUserToken.user.communicationUserId,
                    token: this.userDetailsResponse.communicationUserToken.token, displayName: this.displayName, clientTag:this.clientTag });
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
        if (!!this._callAgentInitPromiseResolve) {
            this._callAgentInitPromiseResolve();
        }
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
        `;

        return (
            <div>
                <div className="login-title">
                    <h3>ACS User identity Provisioning and Calling SDK Initialization</h3>
                </div>
                <div className="login-alert">
                    {
                        this.state.loginWarningMessage &&
                        <Alert
                            intent="warning"
                            action="Dismiss">
                            <b>{this.state.loginWarningMessage}</b>
                        </Alert>
                    }
                    {
                        this.state.loginErrorMessage &&
                        <Alert
                            intent="error"
                            action="Dismiss">
                            <b>{this.state.loginErrorMessage}</b>
                        </Alert>
                    }
                </div>
                <div className="login-description">
                    <div>The ACS Identity SDK can be used to create a user access token which authenticates the calling clients. </div>
                    <div>The example code shows how to use the ACS Identity SDK from a backend service. A walkthrough of integrating the ACS Identity SDK can be found on <a className="sdk-docs-link" target="_blank" href="https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/access-tokens?pivots=programming-language-javascript">Microsoft Docs</a></div>
                </div>
                {
                    this.state.showSpinner &&
                    <div className="justify-content-left mt-4">
                        <div className="loader inline-block"> </div>
                        <div className="ml-2 inline-block">Fetching token from service and initializing SDK...</div>
                    </div>
                }
                {
                    this.state.loggedIn &&
                    <div>
                        <br></br>
                        <div>Congrats! You've provisioned an ACS user identity and initialized the ACS Calling Client Web SDK. You are ready to start making calls!</div>
                        <div>The Identity you've provisioned is: <span className="identity"><b>{this.state.communicationUserId}</b></span></div>
                        <div>Usage is tagged with: <span className="identity"><b>{this.clientTag}</b></span></div>
                    </div>
                }
                {
                    (!this.state.showSpinner && !this.state.loggedIn) && (
                        <div className="login-inputs">
                            <div className="row">
                                <div className="login-displayName-and-tag col-12 col-sm-12 col-md-6">
                                    <div>
                                        <div>
                                            <Label htmlFor={this.input} style={{fontSize: "12px"}}>
                                                Optional - Display name
                                            </Label>
                                        </div>
                                        <div>
                                            <Input id={this.input} style={{width:"80%"}} onChange={(e) => { this.displayName = e.target.value }}/>
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <Label htmlFor={'usageTagInput'} style={{fontSize: "12px"}}>
                                                Optinal - Usage tag for this session
                                            </Label>
                                        </div>
                                        <div>
                                            <Input id={'usageTagInput'} style={{width:"80%"}} onChange={(e) => { this.clientTag = e.target.value }}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="login-token-and-identity col-12 col-sm-12 col-md-6">
                                    <div>
                                        <div>
                                            <Label htmlFor={'userTokenInput'} style={{fontSize: "12px"}}>
                                                Optional - ACS communication user token. If no token is provided, then a random one will be generated
                                            </Label>
                                        </div>
                                        <div>
                                            <Input id={'userTokenInput'}  style={{width:"80%"}} onChange={(e) => { this.state.token = e.target.value }}/>
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <Label htmlFor={'communicationUserIdInput'} style={{fontSize: "12px"}}>
                                                "Optional - ACS Identity associated with the token above
                                            </Label>
                                        </div>
                                        <div>
                                            <Input id={'communicationUserIdInput'} style={{width:"80%"}} onChange={(e) => { this.state.communicationUserId = e.target.value }}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="login-push-notificaitons-options"
                                disabled={
                                    !this.state.initializedOneSignal ||
                                    !this.state.subscribedForPushNotifications ||
                                        this.isSafari
                                }>
                                <div>
                                    Push Notifications options
                                </div>
                                <div>
                                    <Checkbox className="mt-2 ml-3"
                                        label="Initialize Call Agent"
                                        disabled={
                                            !this.state.initializedOneSignal ||
                                            !this.state.subscribedForPushNotifications ||
                                            this.isSafari
                                        }
                                        checked={this.state.initializeCallAgentAfterPushRegistration}
                                        onChange={(e, isChecked) => { this.setState({ initializeCallAgentAfterPushRegistration: isChecked })}}/>
                                </div>
                            </div>
                            <div className="login-button">
                                <Button onClick={() => this.logIn()}>
                                    Provision user and initialize SDK
                                </Button>
                            </div>
                        </div>
                    )
                }
            </div>
        );
    }
}
