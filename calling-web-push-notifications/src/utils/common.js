import {
    isCommunicationUserIdentifier,
    isPhoneNumberIdentifier,
    isMicrosoftTeamsUserIdentifier,
    isUnknownIdentifier
} from '@azure/communication-common';
import axios from 'axios';

function generateGuid() {
    function s4() {
        return Math.floor((Math.random() + 1) * 0x10000).toString(16).substring(1);
    }
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

async function getCommunicationUserToken() {
    let response = await axios({
        url: 'getCommunicationUserToken',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    if (response.status === 200) {
        return response.data;
    }
    throw new Error('Failed to get ACS User Access token');
}

async function getCommunicationUserTokenForOneSignalRegistrationToken(oneSignalRegistrationToken) {
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
}

async function getOneSignalRegistrationTokenForCommunicationUserToken(token, communicationUserId) {
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
}

function getIdentifierText(identifier) {
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
}


export const utils = {
    generateGuid,
    getCommunicationUserToken,
    getCommunicationUserTokenForOneSignalRegistrationToken,
    getOneSignalRegistrationTokenForCommunicationUserToken,
    getIdentifierText
};