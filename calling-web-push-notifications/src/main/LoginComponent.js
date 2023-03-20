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
        this._callAgentInitPromise = undefined;
        this._callAgentInitPromiseResolve = undefined;
        this.state = {
            initializedOneSignal: false,
            subscribedForPushNotifications: false,
            isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
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
        return (
            <div className="login">
                <div className="login-title">
                    <div>ACS User identity Provisioning and Calling SDK Initialization</div>
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
                <div className="login-description mb-2 mt-2">
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
                                <div className="login-displayName-and-tag col-12 col-sm-12 col-md-5">
                                    <div>
                                        <div>
                                            <Label
                                                htmlFor={this.input}
                                                style={{fontSize: "12px"}}>
                                                Optional - Display name
                                            </Label>
                                        </div>
                                        <div>
                                            <Input
                                                id={this.input}
                                                style={{width: '100%'}} 
                                                onChange={(e) => { this.displayName = e.target.value }}/>
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <Label
                                                htmlFor={'usageTagInput'}
                                            style={{fontSize: "12px"}}>
                                                Optinal - Usage tag for this session
                                            </Label>
                                        </div>
                                        <div>
                                            <Input
                                                id={'usageTagInput'}
                                                style={{width: '100%'}}
                                                onChange={(e) => { this.clientTag = e.target.value }}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="login-token-and-identity col-12 col-sm-12 col-md-5 offset-md-1">
                                    <div>
                                        <div>
                                            <Label
                                                htmlFor={'userTokenInput'}
                                                style={{fontSize: "12px"}}>
                                                Optional - ACS communication user token. If no token is provided, then a random one will be generated
                                            </Label>
                                        </div>
                                        <div>
                                            <Input
                                                id={'userTokenInput'}
                                                style={{width: '100%'}}
                                                onChange={(e) => { this.state.token = e.target.value }}/>
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <Label
                                                htmlFor={'communicationUserIdInput'}
                                                style={{fontSize: "12px"}}>
                                                "Optional - ACS Identity associated with the token above
                                            </Label>
                                        </div>
                                        <div>
                                            <Input
                                                id={'communicationUserIdInput'}
                                                style={{width: '100%'}}
                                                onChange={(e) => { this.state.communicationUserId = e.target.value }}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="login-push-notificaitons-options mt-2 mb-2"
                                disabled={
                                    !this.state.initializedOneSignal ||
                                    !this.state.subscribedForPushNotifications ||
                                    !this.state.isSafari
                                }>
                                <div>
                                    Push Notifications options
                                </div>
                                <div>
                                    <Checkbox
                                        className="ml-3"
                                        label="Initialize Call Agent"
                                        disabled={
                                            !this.state.initializedOneSignal ||
                                            !this.state.subscribedForPushNotifications ||
                                            this.state.isSafari
                                        }
                                        checked={this.state.initializeCallAgentAfterPushRegistration}
                                        onChange={(e, data) => { this.setState({ initializeCallAgentAfterPushRegistration: data.checked })}}/>
                                </div>
                            </div>
                            <div
                                className="login-button">
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
