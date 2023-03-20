const { getOneSignalRegistrationToken } = require('../Shared/OneSignalRegistrationTokens.js');

module.exports = async function (context, eventGridEvent) {
    try {
        const communicationUserId = eventGridEvent.data.to.rawId;
        const calleesOneSignalRegistrationToken = getOneSignalRegistrationToken(communicationUserId);
        context.log.info('Attempting to signal user ', communicationUserId, 'with registration token', calleesOneSignalRegistrationToken);
        if (!!calleesOneSignalRegistrationToken) {
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic <Your OneSignal REST API Key>',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "app_id": "<Your OneSignal app Id>",
                    "contents": {
                        "en": "Incoming call"
                    },
                    "data": {
                        "incomingCallContext": (JSON.parse(Buffer.from(eventGridEvent.data.incomingCallContext.split('.')[1], 'base64').toString())).cc
                    },
                    "include_external_user_ids": [calleesOneSignalRegistrationToken],
                    "url": "<Your website URL origin>"
                })
            });
            context.log.info(`Response from OneSignal Create Notification Request: `, await response.json());
        } else {
            context.log.warn(`OneSignalRegistrationToken not found for communicationUserId: ${communicationUserId}`);
        }
    } catch(e) {
        context.log.error(e);
        throw e;
    }
};