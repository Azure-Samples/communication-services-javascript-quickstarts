import React from "react";
import { PrimaryButton } from 'office-ui-fabric-react'

export default class CustomVideoEffects extends React.Component {

    constructor(props) {
        super(props);
        this.call = props.call;
        this.stream = props.stream;
        this.isLocal = props.isLocal;
        this.bwStream = undefined;
        this.bwVideoelem = undefined;
        this.bwTimeout = undefined;
        this.bwCtx = undefined;
        this.dummyTimeout = undefined;
        this.remoteParticipantId = props.remoteParticipantId;

        this.state = {
            buttons: props.buttons ? props.buttons : undefined,
            videoContainerId: props.videoContainerId
        };
    }

    componentWillUnmount() {
        if (this.dummyTimeout) {
            clearTimeout(this.dummyTimeout);
        }

        if (this.bwVideoElem) {
            this.bwCtx.clearRect(0, 0, this.bwVideoElem.width, this.bwVideoElem.height);
            clearTimeout(this.bwTimeout);
            this.bwVideoElem.srcObject.getVideoTracks().forEach((track) => { track.stop(); });
            this.bwVideoElem.srcObject = null;
        }
    }

    setRemoteVideoElementSourceObject(mediaStream) {
        const target = document.getElementById(this.state.videoContainerId)
        const video = target.querySelector("video");
        if(video) {
            try {
                video.srcObject = mediaStream;
                video.load();
            } catch(err) {
                console.error('There was an issue setting the source', err);
            }   
        }
    }

    async addEffect(e) {
        switch (e.currentTarget.children[0].textContent) {
            case this.isLocal && this.state.buttons?.add?.label: {
                //add filters to outgoing video  
                const localVideoStreamRawStream = await this.stream.getMediaStream();
                const { bwStream, bwVideoElem } = this.bwVideoStream(localVideoStreamRawStream);
                this.bwStream = bwStream;
                this.bwVideoElem = bwVideoElem;
                if(bwStream) {
                    this.stream.setMediaStream(bwStream);
                }
                break;
            }
            case this.isLocal && this.state.buttons?.sendDummy?.label: {
                // send a dummy video
                const dummyStream = this.dummyStream();
                if(dummyStream) {
                    this.stream.setMediaStream(dummyStream);
                }
                break;
            }
            case !this.isLocal && this.state.buttons?.add?.label: {
                const remoteVideoStreamRawStream = await this.stream.getMediaStream();
                const { bwStream, bwVideoElem } = this.bwVideoStream(remoteVideoStreamRawStream);
                if (bwStream) {
                    this.setRemoteVideoElementSourceObject(bwStream);
                }
                break;
            }
            case !this.isLocal && this.state.buttons?.remove?.label:{
                const originalRemoteVideoStream = await this.stream.getMediaStream();
                if(originalRemoteVideoStream) {
                    //render original unfiltered video
                    this.setRemoteVideoElementSourceObject(originalRemoteVideoStream);
                }
                break;
            }
        }

        if (this.isLocal) {
            this.setState({ buttons: {
                add: {
                    label: "Set B/W effect",
                    disabled: true
                },
                sendDummy: {
                    label: "Set dummy effect", 
                    disabled: true
                }
            }});
        }
    }

    bwVideoStream(stream) {
        let width = 1280, height = 720;
        const bwVideoElem = document.createElement("video");
        bwVideoElem.srcObject = stream;
        bwVideoElem.height = height;
        bwVideoElem.width = width;
        bwVideoElem.play();
        const canvas = document.createElement('canvas');
        this.bwCtx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = width;
        canvas.height = height;

        const FPS = 30;
        const processVideo = function () {
            try {
                let begin = Date.now();
                // start processing.
                this.bwCtx.filter = "grayscale(1)";
                this.bwCtx.drawImage(bwVideoElem, 0, 0, width, height);
                const imageData = this.bwCtx.getImageData(0, 0, width, height);
                this.bwCtx.putImageData(imageData, 0, 0);
                // schedule the next one.
                let delay = Math.abs(1000/FPS - (Date.now() - begin));
                this.bwTimeout = setTimeout(processVideo, delay);
            } catch (err) {
                console.error(err);
            }
        }.bind(this);

        // schedule the first one.
        this.bwTimeout = setTimeout(processVideo, 0);
        const bwStream = canvas.captureStream(FPS);
        return { bwStream, bwVideoElem };
    }

    dummyStream() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        canvas.width = 1280;
        canvas.height = 720;
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const colors = ['red', 'yellow', 'green'];
        const FPS = 30;
        function createShapes() {
            try {
                let begin = Date.now();
                // start processing.
                if (ctx) {
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    const x = Math.floor(Math.random() * canvas.width);
                    const y = Math.floor(Math.random() * canvas.height);
                    const size = 100;
                    ctx.fillRect(x, y, size, size);
                }            
                // schedule the next one.
                let delay = Math.abs(1000/FPS - (Date.now() - begin));
                this.dummyTimeout = setTimeout(createShapes, delay);
            } catch (err) {
                console.error(err);
            }
        };

        // schedule the first one.
        this.dummyTimeout = setTimeout(createShapes, 0);
        return canvas.captureStream(FPS);
    }

    render() {
        return(
            <div className={`custom-video-effects-buttons ${this.isLocal ? 'outgoing' : 'incoming'} inline-block`}>
                {
                    this.state.buttons &&
                    Object.keys(this.state.buttons).map((obj, idx) => {
                        return <div>
                            <PrimaryButton 
                                key={`${idx}-abcd`} 
                                className="secondary-button" 
                                onClick={async (e) => this.addEffect(e)}
                                disabled={this.state.buttons[obj].disabled}>
                                    {this.state.buttons[obj].label}
                            </PrimaryButton>
                        </div>
                    })
                }
            </div>
        )
        
    }

}