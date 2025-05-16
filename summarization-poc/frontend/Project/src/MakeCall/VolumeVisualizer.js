import React, { useEffect, useState } from "react";
import { LocalAudioStream } from '@azure/communication-calling';

const VolumeVisualizer = ({ deviceManager, call }) => {
    const [localStream, setLocalStream] = useState(new LocalAudioStream(deviceManager.selectedMicrophone));
    const [remoteStream, setRemoteStream] = useState(call?.remoteAudioStreams[0]);

    useEffect(() => {
        deviceManager.on('selectedSpeakerChanged', () => {
            setRemoteStream(call?.remoteAudioStreams[0])
        });

        deviceManager.on('selectedMicrophoneChanged', () => {
            setLocalStream(new LocalAudioStream(deviceManager.selectedMicrophone));
        });

        return () => {
            deviceManager.off('selectedSpeakerChanged', () => {});
            deviceManager.off('selectedMicrophoneChanged', () => {});
        }
    }, []);

    return (
        <div className="volume-indicatordiv">
            <VolumeIndicator title="Remote Volume Visualizer" audioStream={remoteStream} />
            <VolumeIndicator title="Selected Microphone Volume Visualizer" audioStream={localStream} />
        </div>
    );
};

const VolumeIndicator = ({ title, audioStream }) => {
    const [volumeLevel, setVolumeLevel] = useState(0);
    const [volume, setVolume] = useState();

    useEffect(() => {
        const setUpVolume = async() => {
            const volume = await audioStream?.getVolume();
            setVolume(volume);
            volume?.on('levelChanged', () => {
                setVolumeLevel(volume.level);
            });
            setVolumeLevel(volume.level);
        };
        setUpVolume();
    }, [audioStream]);
    
    useEffect(() => {
        return () => {
            volume?.off('levelChanged', () => {});
        };
    }, [volume])

    return (
        <div className="elements">
            <label>{title}</label>
            <div className="volumeVisualizer" style={{ "--volume": 2 * volumeLevel + "%" }}></div>
        </div>
    );
};

export default VolumeVisualizer;
