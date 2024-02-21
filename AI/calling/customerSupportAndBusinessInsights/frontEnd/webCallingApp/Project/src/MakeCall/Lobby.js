import React, { useEffect, useState } from "react";
import { PrimaryButton } from 'office-ui-fabric-react';

// Lobby react function component
const Lobby = ({ call }) => {
    const [lobby, setLobby] = useState(call.lobby);
    const [lobbyParticipantsCount, setLobbyParticipantsCount] = useState(lobby.participants.length);

    useEffect(() => {
        return () => {
            lobby?.off('lobbyParticipantsUpdated', lobbyParticipantsUpdatedHandler);
        }
    }, []);

    useEffect(() => {
        lobby?.on('lobbyParticipantsUpdated', lobbyParticipantsUpdatedHandler);
    }, [lobby]);

    const lobbyParticipantsUpdatedHandler = (event) => {
        console.log(`lobbyParticipantsUpdated, added=${event.added}, removed=${event.removed}`);
        setLobbyParticipantsCount(lobby.participants.length);
        if(event.added.length > 0) {
            event.added.forEach(participant => {
                console.log('lobbyParticipantAdded', participant);
            });
        }
        if(event.removed.length > 0) {
            event.removed.forEach(participant => {
                console.log('lobbyParticipantRemoved', participant);
            });
        }
    };

    const admitAllParticipants = async () => {
        console.log('admitAllParticipants');
        try {
            await lobby.admitAll();
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="ms-Grid-row">
            <div className="ml-2 inline-block">
                <p><strong>In-Lobby participants number: {lobbyParticipantsCount}</strong></p>
            </div>      
            <div className="ml-4 inline-block">
            {
                (lobbyParticipantsCount > 0) &&
                <PrimaryButton className="primary-button"
                                iconProps={{ iconName: 'Group', style: { verticalAlign: 'middle', fontSize: 'large' } }}
                                text="Admit All Participants"
                                onClick={admitAllParticipants}>
                </PrimaryButton>
            }
            </div>
        </div>
    );
};

export default Lobby;
