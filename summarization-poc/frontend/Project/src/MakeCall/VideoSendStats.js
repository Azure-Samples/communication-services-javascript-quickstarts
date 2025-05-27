import React from "react";

export default class VideoSendStats extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <table>
                {
                    this.props.videoStats &&
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
                            <td>{this.props.videoStats.rttInMs} ms</td>
                        </tr>
                        <tr>
                            <td>packetsPerSecond:</td>
                            <td>{this.props.videoStats.packetsPerSecond}</td>
                        </tr>
                        <tr>
                            <td>frameWidthSent:</td>
                            <td>{this.props.videoStats.frameWidthSent} px</td>
                        </tr>
                        <tr>
                            <td>frameHeightSent:</td>
                            <td>{this.props.videoStats.frameHeightSent} px</td>
                        </tr>
                        <tr>
                            <td>frameRateInput:</td>
                            <td>{this.props.videoStats.frameRateInput} fps</td>
                        </tr>
                        <tr>
                            <td>frameRateEncoded:</td>
                            <td>{this.props.videoStats.frameRateEncoded} fps</td>
                        </tr>
                        {
                            this.props.videoStats.altLayouts?.length > 0 &&
                            <tr>
                                <td>simulcast:</td>
                                <td>{this.props.videoStats.altLayouts[0].frameWidthSent}x{this.props.videoStats.altLayouts[0].frameHeightSent}</td>
                            </tr>
                        }
                    </tbody>
                }
            </table>
        );
    }
}
