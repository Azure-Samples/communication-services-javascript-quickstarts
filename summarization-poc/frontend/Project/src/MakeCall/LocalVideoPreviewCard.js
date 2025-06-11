import React from "react";
import { VideoStreamRenderer} from '@azure/communication-calling';
import { utils } from '../Utils/Utils';
import VideoSendStats from './VideoSendStats';

export default class LocalVideoPreviewCard extends React.Component {
    constructor(props) {
        super(props);
        this.identifier = props.identifier;
        this.stream = props.stream;
        this.type = this.stream.mediaStreamType;
        this.view = undefined;
        this.componentId = `${utils.getIdentifierText(this.identifier)}-local${this.type}Renderer`;
        this.state = {
            videoStats: undefined
        };
    }

    async componentDidMount() {
        try {
            this.renderer = new VideoStreamRenderer(this.stream);
            this.view = await this.renderer.createView();
            const targetContainer = document.getElementById(this.componentId);
            if (this.type === 'ScreenSharing' || this.type === 'RawMedia') {
                this.view.target.querySelector('video').style.width = targetContainer.style.width;
            }
            targetContainer.appendChild(this.view.target);
        } catch (error) {
            console.error('Failed to render preview', error);
        }
    }

    async componentWillUnmount() {
        this.view.dispose();
        this.view = undefined;
    }

    render() {
        return (
            <div style={{ width: '100%' }} id={this.componentId}>
                {
                    this.state.videoStats &&
                    <h4 className="video-stats">
                        <VideoSendStats videoStats={this.state.videoStats} />
                    </h4>
                }
            </div>
        );
    }

    updateSendStats(videoStats) {
        if (this.state.videoStats !== videoStats) {
            this.setState({ videoStats });
        }
    }
}
