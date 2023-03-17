const oneSignalRegistrationTokens = new Map();

function getOneSignalRegistrationToken(communicationUserId) {
	return oneSignalRegistrationTokens.get(communicationUserId);
}

function setOneSignalRegistrationToken(communicationUserId, token) {
	oneSignalRegistrationTokens.set(communicationUserId, token);
}

module.exports = {
	getOneSignalRegistrationToken,
	setOneSignalRegistrationToken
};