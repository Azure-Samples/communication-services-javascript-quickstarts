const { CommunicationIdentityClient } = require('@azure/communication-administration');

const connectionString = 'ADD_YOUR_CONNECTION_STRING';

module.exports = async function (context) {
    let tokenClient = new CommunicationIdentityClient(connectionString);

    const user = await tokenClient.createUser();

    const userToken = await tokenClient.issueToken(user, ["voip"]);

    context.res = {
        body: userToken
    };
}
