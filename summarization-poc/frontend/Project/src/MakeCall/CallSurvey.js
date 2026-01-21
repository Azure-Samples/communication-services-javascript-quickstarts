import React from "react";
import {
    PrimaryButton
} from 'office-ui-fabric-react'
import StarRating from '../MakeCall/StarRating';
import { Features } from '@azure/communication-calling';
import config from '../../clientConfig.json';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { TextField } from 'office-ui-fabric-react';

export default class CallSurvey extends React.Component {
    constructor(props) {
        super(props);
        this.call = props.call;
        this.state = {
            overallIssue: '',
            overallRating: 0,
            audioIssue: '',
            audioRating: 0,
            videoIssue: '',
            videoRating: 0,
            screenShareIssue: '',
            screenShareRating: 0,
            surveyError: '',
            improvementSuggestion: ''
        };
        
        if (config.appInsightsConnectionString) {
            // Typical application will have the app insights already initialized, so that can be used here.
            this.appInsights = new ApplicationInsights({
                config: {
                    // Use atob function to decode only if the connection string is base64. To encode: btoa("connection string")
                    connectionString: atob(config.appInsightsConnectionString)
                }
            });
            this.appInsights.loadAppInsights();
        }

    }

    componentWillUnmount() {

    }

    componentDidMount() {

    }

    captureRating(category, score) {
        if (category == 'overall') {
            this.setState({ overallRating: score });
        } else if (category == 'audio') {
            this.setState({ audioRating: score });
        } else if (category == 'video') {
            this.setState({ videoRating: score });
        } else if (category == 'screenShare') {
            this.setState({ screenShareRating: score });
        }
    }

    captureIssue(category, issue) {
        if (category == 'overall') {
            this.setState({ overallIssue: issue });
        } else if (category == 'audio') {
            this.setState({ audioIssue: issue });
        } else if (category == 'video') {
            this.setState({ videoIssue: issue });
        } else if (category == 'screenShare') {
            this.setState({ screenShareIssue: issue });
        }

    }

    submitRating() {
        const rating = {};
        rating.overallRating = { score: this.state.overallRating };
        if (this.state.overallIssue) rating.overallRating.issues = [this.state.overallIssue];

        if (this.state.audioRating !== 0) rating.audioRating = { score: this.state.audioRating };
        if (this.state.audioIssue) rating.audioRating.issues = [this.state.audioIssue];

        if (this.state.videoRating !== 0) rating.videoRating = { score: this.state.videoRating };
        if (this.state.videoIssue) rating.videoRating.issues = [this.state.videoIssue];

        if (this.state.screenShareRating !== 0) rating.screenshareRating = { score: this.state.screenShareRating };
        if (this.state.screenShareIssue) rating.screenshareRating.issues = [this.state.screenShareIssue];
        
        this.call.feature(Features.CallSurvey).submitSurvey(rating).then((res) => {
            if (this.appInsights && this.state.improvementSuggestion !== '') {
                this.appInsights.trackEvent({
                    name: "CallSurvey", properties: {
                        // Survey ID to correlate the survey
                        id: res.id,
                        // Other custom properties as key value pair
                        improvementSuggestion: this.state.improvementSuggestion
                    }
                });
                this.appInsights.flush();
            }
            this.props.onSubmitted();
        }).catch((e) => {
            console.error('Failed to submit survey', e);
            this.setState({ surveyError: 'Failed to submit survey' + e });
        });
    }

    render() {
        return (
            <div className="card">
                <div className="ms-Grid-row">
                    <div className="ms-Grid-col ms-lg6 ms-sm6 mb-4">
                        <h2>Rate your recent call!</h2>
                        {
                            this.state.surveyError !== '' && <h3 className="alert alert-danger">{this.state.surveyError}</h3>
                        }
                    </div>
                    <div className="ms-Grid-col ms-lg6 ms-sm6 text-right">
                        <PrimaryButton
                            className="primary-button"
                            iconProps={{ iconName: 'FavoriteStar', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                            text={`Submit rating!`}
                            onClick={() => this.submitRating()}>
                        </PrimaryButton>
                    </div>
                </div>
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-sm4 ms-md4 ms-lg2"><h3 className="m-0">Rate your overall call experience </h3></div>
                        <div className="ms-Grid-col ms-sm4 ms-md8 ms-lg10">
                            <StarRating
                                category='overall'
                                issues={['CallCannotJoin', 'CallCannotInvite', 'HadToRejoin', 'CallEndedUnexpectedly', 'OtherIssues']}
                                onIssueSelected={(category, issue) => this.captureIssue(category, issue)}
                                onRate={(category, score) => this.captureRating(category, score)}
                            /></div>
                    </div>
                </div>
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-sm4 ms-md4 ms-lg2"><h3 className="m-0">Rate your audio experience <span>(optional)</span></h3></div>
                        <div className="ms-Grid-col ms-sm4 ms-md8 ms-lg10">
                            <StarRating
                                category='audio'
                                issues={['NoLocalAudio', 'NoRemoteAudio', 'Echo', 'AudioNoise', 'LowVolume', 'AudioStoppedUnexpectedly', 'DistortedSpeech', 'AudioInterruption', 'OtherIssues']}
                                onIssueSelected={(category, issue) => this.captureIssue(category, issue)}
                                onRate={(category, score) => this.captureRating(category, score)}
                            /></div>
                    </div>
                </div>
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-sm4 ms-md4 ms-lg2"><h3 className="m-0">Rate your video experience <span>(optional)</span></h3></div>
                        <div className="ms-Grid-col ms-sm4 ms-md8 ms-lg10">
                            <StarRating
                                category='video'
                                issues={['NoVideoReceived', 'NoVideoSent', 'LowQuality', 'Freezes', 'StoppedUnexpectedly', 'DarkVideoReceived', 'AudioVideoOutOfSync', 'OtherIssues']}
                                onIssueSelected={(category, issue) => this.captureIssue(category, issue)}
                                onRate={(category, score) => this.captureRating(category, score)}
                            />
                        </div>
                    </div>
                </div>
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-sm4 ms-md4 ms-lg2"><h3 className="m-0">Rate your screen share experience <span>(optional)</span></h3></div>
                        <div className="ms-Grid-col ms-sm4 ms-md8 ms-lg10">
                            <StarRating
                                category='screenShare'
                                issues={['NoContentLocal', 'NoContentRemote', 'CannotPresent', 'LowQuality', 'Freezes', 'StoppedUnexpectedly', 'LargeDelay', 'OtherIssues']}
                                onIssueSelected={(category, issue) => this.captureIssue(category, issue)}
                                onRate={(category, score) => this.captureRating(category, score)}
                            /></div>
                    </div>
                </div>
                <div className="ms-Grid">
                    <div className="ms-Grid-row">
                        <div className="ms-Grid-col ms-sm4 ms-md4 ms-lg2"><h3 className="m-0">How can we improve? <span>(optional)</span></h3></div>
                        <div className="ms-Grid-col ms-sm4 ms-md8 ms-lg10">
                            <TextField
                                defaultValue={undefined}
                                placeholder="Improvement suggestion"
                                label="Improvement suggestion (optional)"
                                onChange={(e) => { this.state.improvementSuggestion = e.target.value }}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
