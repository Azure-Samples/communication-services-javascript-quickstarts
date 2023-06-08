const { getOneSignalRegistrationInfo, setOneSignalRegistrationInfo } = require('../Shared/OneSignalRegistrationTokens.js');

module.exports = async function (context, req) {
    let responseMessage = 'Success';
    let responseStatus = 200;
    const communicationUserId = req.body.communicationUserId;
    const oneSignalRegistrationToken = req.body.oneSignalRegistrationToken;
    const oneSignalAppId = req.body.oneSignalAppId;
    setOneSignalRegistrationInfo(communicationUserId, { oneSignalRegistrationToken, oneSignalAppId });
    if (getOneSignalRegistrationInfo(communicationUserId).oneSignalRegistrationToken !== oneSignalRegistrationToken &&
        getOneSignalRegistrationInfo(communicationUserId).oneSignalAppId !== oneSignalAppId) {
        responseMessage = 'Failed to register ' + communicationUserId + ', with token ' + oneSignalRegistrationToken + ', and OneSignal appId ' + oneSignalAppId;
        responseStatus = 500;
        context.log(responseMessage)
    } else {
        context.log('Successfully registered communication user: ', communicationUserId, ', for OneSignal appId: ', oneSignalAppId, ', with registration token: ', oneSignalRegistrationToken);
    }
    context.res = {
        body: responseMessage,
        status: responseStatus
    };  
}