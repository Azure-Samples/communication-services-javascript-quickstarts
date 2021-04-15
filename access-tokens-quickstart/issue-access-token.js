const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { AzureKeyCredential } = require('@azure/core-auth');
const { DefaultAzureCredential } = require('@azure/identity');

const main = async () => {
    console.log("Azure Communication Services - Access Tokens Quickstart");

    // This code demonstrates how to fetch your connection string
    // from an environment variable.
    /*const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
    // Instantiate the identity client
    //const identityClient = new CommunicationIdentityClient(connectionString);*/

    // This code demonstrates how to fetch your endpoint and access key
    // from an environment variable.
    /*const endpoint = process.env["COMMUNICATION_SERVICES_ENDPOINT"];
    const accessKey = process.env["COMMUNICATION_SERVICES_ACCESSKEY"];
    const tokenCredential = new AzureKeyCredential(accessKey);
    // Instantiate the identity client
    const identityClient = new CommunicationIdentityClient(endpoint, tokenCredential);*/

    // Authenticate with managed identity
    const endpoint = process.env["COMMUNICATION_SERVICES_ENDPOINT"];
    const tokenCredential = new DefaultAzureCredential();
    const identityClient = new CommunicationIdentityClient(endpoint, tokenCredential);

    // Create an identity
    let identityResponse = await identityClient.createUser();
    console.log(`\nCreated an identity with ID: ${identityResponse.communicationUserId}`);

    // Issue an access token with the "voip" scope for an identity
    let tokenResponse = await identityClient.getToken(identityResponse, ["voip"]);
    const { token, expiresOn } = tokenResponse;
    console.log(`\nIssued an access token with 'voip' scope that expires at ${expiresOn}:`);
    console.log(token);

    //Refresh access tokens
    // Value of identityResponse represents the Azure Communication Services identity stored during identity creation and then used to issue the tokens being refreshed
    let refreshedTokenResponse = await identityClient.getToken(identityResponse, ["voip"]);

    // Revoke access tokens
    await identityClient.revokeTokens(identityResponse);
    console.log(`\nSuccessfully revoked all access tokens for identity with ID: ${identityResponse.communicationUserId}`);

    // Delete an identity
    await identityClient.deleteUser(identityResponse);
    console.log(`\nDeleted the identity with ID: ${identityResponse.communicationUserId}`);
};

main().catch((error) => {
    console.log("Encountered an error");
    console.log(error);
})