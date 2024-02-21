import React, { useState } from "react";
import { PrimaryButton, TextField } from 'office-ui-fabric-react';
import { CallKind } from "@azure/communication-calling";
import { createIdentifierFromRawId } from '@azure/communication-common';

export default function AddParticipantPopover({call}) {
    const [userId, setUserId] = useState('');
    const [threadId, setThreadId] = useState('');
    const [alternateCallerId, setAlternateCallerId] = useState('');

    function handleAddParticipant() {
        console.log('handleAddParticipant', userId);
        try {
            let participantId = createIdentifierFromRawId(userId);
            call._kind === CallKind.TeamsCall ? 
                call.addParticipant(participantId, {threadId}) :
                call.addParticipant(participantId);
        } catch (e) {
            console.error(e);
        }
    }

    function handleAddPhoneNumber() {
        console.log('handleAddPhoneNumber', userId);
        try {
            call.addParticipant({ phoneNumber: userId }, { alternateCallerId: { phoneNumber: alternateCallerId }});
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="ms-Grid">
            <div className="ms-Grid-row">
                <div className="ms-Grid-col ms-lg12">
                    <div className="add-participant-panel">
                        <h3 className="add-participant-panel-header">Add a participant</h3>
                        <div className="add-participant-panel-header">
                            <TextField className="text-left" label="Identifier" onChange={e => setUserId(e.target.value)} />
                            { 
                                call._kind === CallKind.TeamsCall && 
                                <TextField className="text-left" label="Thread Id (Needed if SDK is initialized for Teams User )" onChange={e => setThreadId(e.target.value)} />
                            }
                            {
                                call._kind === CallKind.Call && 
                                <TextField className="text-left" label="Alternate Caller Id (For adding phone number only)" onChange={e => setAlternateCallerId(e.target.value)} />
                            }
                                <PrimaryButton className="secondary-button mt-3" onClick={handleAddParticipant}>Add Participant</PrimaryButton>
                            {
                                call._kind === CallKind.Call && 
                            <   PrimaryButton className="secondary-button mt-1" onClick={handleAddPhoneNumber}>Add Phone Number</PrimaryButton>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}