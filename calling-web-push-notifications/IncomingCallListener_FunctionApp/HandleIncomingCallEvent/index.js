const { getOneSignalRegistrationInfo } = require('../Shared/OneSignalRegistrationTokens.js');
const axios = require('axios');
// Your OneSignal app info
const app1_oneSignalAppId = '<Your OneSignal app Id>';
const app1_oneSignalRestApiKey = 'Basic <Your OneSignal REST API Key>';
const app1_url = '<Your website URL origin>'

module.exports = async function (context, eventGridEvent) {
    try {
        const calleesOneSignalRegistrationInfo = getOneSignalRegistrationInfo(eventGridEvent.data.to.rawId);
        if (calleesOneSignalRegistrationInfo) {
            context.log('Attempting to signal user: ', eventGridEvent.data.to.rawId, ', for OneSignal appId: ', calleesOneSignalRegistrationInfo.oneSignalAppId, ', with registration token: ', calleesOneSignalRegistrationInfo.oneSignalRegistrationToken);
            let oneSignalAppId = '';
            let oneSignalRestApiKey = '';
            let url = ''; 
            switch(calleesOneSignalRegistrationInfo.oneSignalAppId) {
                case app1_oneSignalAppId: {
                    oneSignalAppId = app1_oneSignalAppId;
                    oneSignalRestApiKey = app1_oneSignalRestApiKey;
                    url = app1_url; 
                    break;
                }
            }
            
            fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': oneSignalRestApiKey ,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "app_id": oneSignalAppId,
                    "contents": {
                        "en": "Incoming call"
                    },
                    "data": {
                        "incomingCallContext": (JSON.parse(Buffer.from(eventGridEvent.data.incomingCallContext.split('.')[1], 'base64').toString())).cc
                    },
                    "include_external_user_ids": [calleesOneSignalRegistrationInfo.oneSignalRegistrationToken],
                    "url": url
                })
            }).then(async (response) => {
                context.log('Response from OneSignal Create Notification Rest Service: ', await response.json());
            });
        }
    } catch(e) {
        context.error(e);
        throw e;
    }
};
