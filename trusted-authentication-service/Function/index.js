const { CommunicationIdentityClient } = require('@azure/communication-identity');

const connectionString = 'ADD_YOUR_CONNECTION_STRING';

module.exports = async function (context) {
    let tokenClient = new CommunicationIdentityClient(connectionString);

    const user = await tokenClient.createUser();

    const userToken = await tokenClient.getToken(user, ["voip"]);

    context.res = {
        body: userToken
    };
}
