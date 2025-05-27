import React from "react";
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

export default class MediaConstraint extends React.Component {
    constructor(props) {
        super(props);
        this.videoSendHeightMax = [
            { key: 0, text: 'None' },
            { key: 180, text: '180' },
            { key: 240, text: '240' },
            { key: 360, text: '360' },
            { key: 540, text: '540' },
            { key: 720, text: '720' }
        ];
        this.videoSendBitRateConstraint = [
            { key: 0, text: 'None' },
            { key: 15000, text: '15000 (< 180p bitrate)' },
            { key: 175000, text: '175000 (~180 bitrate)' },
            { key: 400000, text: '400000 (~240p bitrate)' },
            { key: 450000, text: '800000 (<360p bitrate)' },
            { key: 575000, text: '575000 (~360p bitrate)' },
            { key: 1125000, text: '1125000 (~540p bitrate)' },
            { key: 2500000, text: '2500000 (~720p bitrate)' },
            { key: 100000000, text: '100000000 (max range for 1080p)' }
        ];
        this.videoSendFrameRateConstraint = [
            { key: 0, text: 'None' },
            { key: 5, text: '5' },
            { key: 10, text: '10' },
            { key: 15, text: '15' },
            { key: 20, text: '20' },
            { key: 25, text: '25' },
            { key: 30, text: '30' }
        ];
        this.state = {
            videoSendHeightMax: 0,
            videoSendBitRate: 0,
            videoSendFrameRate: 0
        }
    }

    handleChange = async(event, item) => {
        const videoConstraints  = {
            video: {
                send: {
                    frameHeight: {
                        max: this.state.videoSendHeightMax
                    },
                    bitrate: {
                        max: this.state.videoSendBitRate
                    },
                    frameRate: {
                        max: this.state.videoSendFrameRate
                    }
                }
            }
        };

        if(event.target.id === 'videoSendHeightMaxDropdown') {
            videoConstraints.video.send.frameHeight.max = item.key;
            this.setState({
                videoSendHeightMax: item.key
            });
        } else if(event.target.id === 'videoSendBitRateDropdown') {
            videoConstraints.video.send.bitrate.max = item.key;
            this.setState({
                videoSendBitRate: item.key
            });
        } else if(event.target.id === 'videoSendFrameRateDropdown') {
            videoConstraints.video.send.frameRate.max = item.key;
            this.setState({
                videoSendFrameRate: item.key
            });
        }

        if (this.props.onChange) {
            this.props.onChange(videoConstraints);
        }
    }

    render() {
        return (
            <div>
                <Dropdown
                    id='videoSendHeightMaxDropdown'
                    selectedKey={this.state.videoSendHeightMax}
                    onChange={this.handleChange}
                    label={'Send Max Height Resolution'}
                    options={this.videoSendHeightMax}
                    styles={{ dropdown: { width: 200 }, label: { color: '#FFF'} }}
                    disabled={this.props.disabled}
                />
                <Dropdown
                    id='videoSendBitRateDropdown'
                    selectedKey={this.state.videoSendBitRate}
                    onChange={this.handleChange}
                    label={'Send Bit Rate'}
                    options={this.videoSendBitRateConstraint}
                    styles={{ dropdown: { width: 200 }, label: { color: '#FFF'} }}
                    disabled={this.props.disabled}
                />
                <Dropdown
                    id='videoSendFrameRateDropdown'
                    selectedKey={this.state.videoSendFrameRate}
                    onChange={this.handleChange}
                    label={'Send Frame Rate'}
                    options={this.videoSendFrameRateConstraint}
                    styles={{ dropdown: { width: 200 }, label: { color: '#FFF'} }}
                    disabled={this.props.disabled}
                />
            </div>
        );
    }
}
