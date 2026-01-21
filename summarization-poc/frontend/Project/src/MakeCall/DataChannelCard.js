import React from "react";
import { ToastContainer, toast } from 'react-toastify';
import { Features } from '@azure/communication-calling';
import 'react-toastify/dist/ReactToastify.css';
import { PrimaryButton, TextField } from 'office-ui-fabric-react';
import { utils } from '../Utils/Utils';

const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
};

export default class DataChannelCard extends React.Component {
    constructor(props) {
        super(props);
		this.state = {
            inputMessage: ''
        }
        const call = props.call;
        if (!Features.DataChannel) {
            return;
        }
        const dataChannel = call.feature(Features.DataChannel);
        const getDisplayName = (participantId) => {
            const remoteParticipant = props.remoteParticipants.find(rp => rp.identifier.communicationUserId === participantId);
            if (remoteParticipant && remoteParticipant.displayName) {
                return remoteParticipant.displayName;
            }
            return undefined;
        }
        const textDecoder = new TextDecoder();
        const messageHandler = (message, remoteParticipantId) => {
            const displayName = getDisplayName(remoteParticipantId);
            const from = displayName ? displayName : remoteParticipantId;
            const text = textDecoder.decode(message.data);
            toast.info(`${from}: ${text}`, {
                position: "top-left",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        };
        dataChannel.on('dataChannelReceiverCreated', receiver => {
            const participantId = utils.getIdentifierText(receiver.senderParticipantIdentifier);
            const displayName = getDisplayName(participantId);
            const from = displayName ? `${participantId} (${displayName})` : participantId;
            toast.success(`data channel id = ${receiver.channelId} from ${from} is opened`, toastOptions);

            receiver.on('close', () => {
                toast.error(`data channel id = ${receiver.channelId} from ${from} is closed`, toastOptions);
            });
            if (receiver.channelId === 1000) {
                receiver.on('messageReady', () => {
                    const message = receiver.readMessage();
                    messageHandler(message, participantId);
                });
            }
        });

        try {
            this.messageSender = dataChannel.createDataChannelSender({
                channelId: 1000
            });
        } catch(e) {
            toast.error(`createDataChannelSender: ${e.message}`, toastOptions);
        }
    }

    setParticipants(participants) {
        try {
            this.messageSender.setParticipants(participants);
        } catch(e) {
            toast.error(`setParticipants: ${e.message}`, toastOptions);
        }
    }

    sendMessage() {
        if (this.state.inputMessage) {
            try {
                this.messageSender.sendMessage((new TextEncoder()).encode(this.state.inputMessage)).then(() => {
                    this.setState({
                        inputMessage: ''
                    });
                }).catch(e => {
                    toast.error(`sendMessage: ${e.message}`, toastOptions);
                });
            } catch(e) {
                toast.error(`sendMessage: ${e.message}`, toastOptions);
            }
        }
    }

    render() {
        return (
            <div className="ms-Grid">
                <div className="ms-Grid-row mb-6 mt-6">
                    <div>When no remote participant checkbox is selected, message will broadcast in the channel</div>
                    <div className="ms-Grid-col ms-lg6 ms-sm6">
                        <TextField
                            label="message"
                            onKeyDown ={ev => {
                                if (ev.key === 'Enter') {
                                    this.sendMessage();
                                    ev.preventDefault();
                                }
                            }}
                            onChange={ev => {
                                this.setState({
                                    inputMessage: ev.target.value
                                });
                            }}
                            value={this.state.inputMessage}
                        />
                        <PrimaryButton
                            className="secondary-button"
                            iconProps={{ iconName: 'Send', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                            text="Send"
                            onClick={() => this.sendMessage()}>
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        );
   }
}
