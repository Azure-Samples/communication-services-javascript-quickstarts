import {
    isCommunicationUserIdentifier,
    isPhoneNumberIdentifier,
    isMicrosoftTeamsUserIdentifier,
    isUnknownIdentifier,
    createIdentifierFromRawId
} from '@azure/communication-common';
import { PublicClientApplication } from "@azure/msal-browser";
import { authConfig, authScopes } from "../../oAuthConfig"
import axios from 'axios';

export const utils = {
    getAppServiceUrl: () => {
        return window.location.origin;
    },
    getCommunicationUserToken: async (communicationUserId) => {
        let response = await axios({
            url: 'getCommunicationUserToken',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: communicationUserId ? JSON.stringify({communicationUserId}) : undefined
        })
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to get ACS User Access token');
    },
    getCommunicationUserTokenForOneSignalRegistrationToken: async (oneSignalRegistrationToken) => {
        let response = await axios({
            url: 'getCommunicationUserTokenForOneSignalRegistrationToken',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({oneSignalRegistrationToken})
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to get ACS User Acccess token for the given OneSignal Registration Token');
    },
    getOneSignalRegistrationTokenForCommunicationUserToken: async (token, communicationUserId) => {
        let response = await axios({
            url: 'getOneSignalRegistrationTokenForCommunicationUserToken',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({token, communicationUserId})
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to get ACS User Acccess token for the given OneSignal Registration Token');
    },
    teamsPopupLogin: async () => {
        const oAuthObj = new PublicClientApplication(authConfig);
        const popupLoginRespoonse = await oAuthObj.loginPopup({scopes: authScopes.popUpLogin});
        const response = await axios({
            url: 'teamsPopupLogin',
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-type': 'application/json'
            },
            data: JSON.stringify({
                aadToken: popupLoginRespoonse.accessToken,
                userObjectId: popupLoginRespoonse.uniqueId
            })
        });
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to get Teams User Acccess token');
    },
    teamsM365Login: async (email, password) => {
        const response = await axios({
            url: 'teamsM365Login',
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-type': 'application/json'
            },
            data: JSON.stringify({email, password })
        })
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to get Teams User Acccess token');
    },
    getIdentifierText: (identifier) => {
        if (isCommunicationUserIdentifier(identifier)) {
            return identifier.communicationUserId;
        } else if (isPhoneNumberIdentifier(identifier)) {
            return identifier.phoneNumber;
        } else if (isMicrosoftTeamsUserIdentifier(identifier)) {
            return identifier.microsoftTeamsUserId;
        } else if (isUnknownIdentifier(identifier) && identifier.id === '8:echo123'){
            return 'Echo Bot';
        } else {
            return 'Unknown Identifier';
        }
    },
    getSizeInBytes(str) {
        return new Blob([str]).size;
    },
    getRemoteParticipantObjFromIdentifier(call, identifier) {
        switch(identifier.kind) {
            case 'communicationUser': {
                return call.remoteParticipants.find(rm => {
                    return rm.identifier.communicationUserId === identifier.communicationUserId
                });
            }
            case 'microsoftTeamsUser': {
                return call.remoteParticipants.find(rm => {
                    return rm.identifier.microsoftTeamsUserId === identifier.microsoftTeamsUserId
                });
            }
            case 'phoneNumber': {
                return call.remoteParticipants.find(rm => {
                    return rm.identifier.phoneNumber === identifier.phoneNumber
                });
            }
            case 'unknown': {
                return call.remoteParticipants.find(rm => {
                    return rm.identifier.id === identifier.id
                });
            }
        }
    },
    isParticipantSpotlighted(participantId, spotlightState) {
        if (!participantId || !spotlightState) { return false }
        let rtn = spotlightState.find(element => this.getIdentifierText(element.identifier) === this.getIdentifierText(participantId));
        return !!rtn
        
    },
    isParticipantHandRaised(participantId, raisedHandState) {
        if (!participantId || !raisedHandState) { return false }
        let rtn = raisedHandState.find(element => this.getIdentifierText(element.identifier) === this.getIdentifierText(participantId));
        return !!rtn
    },
    getParticipantPublishStates(participantId, publishedStates) {
        let states = {isSpotlighted: false, isHandRaised: false}
        states.isSpotlighted = this.isParticipantSpotlighted(participantId, publishedStates.spotlight)
        states.isHandRaised = this.isParticipantHandRaised(participantId, publishedStates.raiseHand)
        return states
    }
}
