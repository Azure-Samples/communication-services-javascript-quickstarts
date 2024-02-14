import React from "react";

export default class VideoReceiveStats extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (!this.props.videoStats) {
            return null;
        }
        return (
            <table>
                <tbody>
                    <tr>
                        <td>codec:</td>
                        <td>{this.props.videoStats.codecName}</td>
                    </tr>
                    <tr>
                        <td>bitrate:</td>
                        <td>{(this.props.videoStats.bitrate/1000).toFixed(1)} kbps</td>
                    </tr>
                    <tr>
                        <td>jitter:</td>
                        <td>{this.props.videoStats.jitterInMs} ms</td>
                    </tr>
                    <tr>
                        <td>rtt:</td>
                        <td>{this.props.videoStats.pairRttInMs} ms</td>
                    </tr>
                    <tr>
                        <td>packetsPerSecond:</td>
                        <td>{this.props.videoStats.packetsPerSecond}</td>
                    </tr>
                    <tr>
                        <td>frameWidthReceived:</td>
                        <td>{this.props.videoStats.frameWidthReceived} px</td>
                    </tr>
                    <tr>
                        <td>frameHeightReceived:</td>
                        <td>{this.props.videoStats.frameHeightReceived} px</td>
                    </tr>
                    <tr>
                        <td>frameRateDecoded:</td>
                        <td>{this.props.videoStats.frameRateDecoded} fps</td>
                    </tr>
                    <tr>
                        <td>frameRateReceived:</td>
                        <td>{this.props.videoStats.frameRateReceived} fps</td>
                    </tr>
                    <tr>
                        <td>framesReceived:</td>
                        <td>{this.props.videoStats.framesReceived}</td>
                    </tr>
                    <tr>
                        <td>framesDropped:</td>
                        <td>{this.props.videoStats.framesDropped}</td>
                    </tr>
                    <tr>
                        <td>framesDecoded:</td>
                        <td>{this.props.videoStats.framesDecoded}</td>
                    </tr>
                </tbody>
            </table>
        );
    }
}
