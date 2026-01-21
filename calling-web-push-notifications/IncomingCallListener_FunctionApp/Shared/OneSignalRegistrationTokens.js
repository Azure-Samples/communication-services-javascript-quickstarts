const oneSignalRegistrationTokens = new Map();

function getOneSignalRegistrationInfo(communicationUserId) {
	return oneSignalRegistrationTokens.get(communicationUserId);
}

function setOneSignalRegistrationInfo(communicationUserId, token) {
	oneSignalRegistrationTokens.set(communicationUserId, token);
}

module.exports = {
	getOneSignalRegistrationToken,
	setOneSignalRegistrationToken
};
