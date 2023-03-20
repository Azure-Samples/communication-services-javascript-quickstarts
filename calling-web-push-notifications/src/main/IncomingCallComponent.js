import React from "react";
import { Button } from "@fluentui/react-components";


export default class IncomingCallComponent extends React.Component {
    constructor(props) {
        super(props);
        this.incomingCall = props.incomingCall;
        this.acceptCallOptions = props.acceptCallOptions;
        this.acceptCallWithVideoOptions = props.acceptCallWithVideoOptions;
    }

    async componentDidMount() {
        this.acceptCallOptions = { videoOptions: (await this.acceptCallOptions()).videoOptions };
        this.acceptCallWithVideoOptions = { videoOptions: (await this.acceptCallWithVideoOptions()).videoOptions };
    }

    render() {
        return (
            <div className="ms-Grid mt-2">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg6">
                        <h2>Incoming Call...</h2>
                    </div>
                    <div className="ms-Grid-col ms-lg6 text-right">
                        {
                            this.call &&
                            <h2>Call Id: {this.state.callId}</h2>
                        }
                    </div>
                </div>
                <div className="custom-row">
                    <div className="ringing-loader mb-4"></div>
                </div>
                <div className="ms-Grid-row text-center">
                    <Button className="incoming-call-button"
                        title={'Answer call with video off'}
                        onClick={() => this.incomingCall.accept(this.acceptCallOptions)}>
                        Answer incoming call with audio only
                    </Button>
                    <Button className="incoming-call-button"
                        title={'Answer call with video on'}
                        onClick={() => this.incomingCall.accept(this.acceptCallWithVideoOptions)}>
                        Answer incoming call with video
                    </Button>
                    <Button className="incoming-call-button"
                        title={'Reject call'}
                        onClick={() => { this.incomingCall.reject(); this.props.onReject(); }}>
                        Decline incoming call
                    </Button>
                </div>
            </div>
        );
    }
}