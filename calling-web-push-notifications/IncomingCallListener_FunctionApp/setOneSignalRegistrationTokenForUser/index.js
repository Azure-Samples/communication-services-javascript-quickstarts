const { getOneSignalRegistrationToken, setOneSignalRegistrationToken } = require('../Shared/OneSignalRegistrationTokens.js');

module.exports = async function (context, req) {
    let responseMessage = 'Success';
    let responseStatus = 200;
    const communicationUserId = req.body.communicationUserId;
    const oneSignalRegistrationToken = req.body.oneSignalRegistrationToken;
    setOneSignalRegistrationToken(communicationUserId, oneSignalRegistrationToken);
    if (getOneSignalRegistrationToken(communicationUserId) !== oneSignalRegistrationToken) {
         responseMessage = 'Failed to add to map userId ' + communicationUserId + ', with token ' + oneSignalRegistrationToken;
         responseStatus = 500;
    }
    context.log('Registered OneSignalRegistrationToken: ', oneSignalRegistrationToken, ', for communicationUserId: ', communicationUserId);
    context.res = {
        body: responseMessage,
        status: responseStatus
    };  
}