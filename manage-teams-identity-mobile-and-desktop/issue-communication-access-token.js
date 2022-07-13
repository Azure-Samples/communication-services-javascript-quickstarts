const { CommunicationIdentityClient } = require('@azure/communication-identity');    
const { PublicClientApplication, CryptoProvider } = require('@azure/msal-node');
const express = require("express");

// You will need to set environment variables and edit the following values
const SERVER_PORT = process.env.PORT || 80;
const REDIRECT_URI = `http://localhost:${SERVER_PORT}/redirect`;
const clientId = "<contoso_application_id>";
const tenantId = "<contoso_tenant_id>"; 

// Create configuration object that will be passed to MSAL instance on creation.
const msalConfig = {
    auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
    }
};

// Create an instance of PublicClientApplication
const pca = new PublicClientApplication(msalConfig);
const provider = new CryptoProvider();

const app = express();

let pkceVerifier = "";

app.get('/', async (req, res) => {
    // Generate PKCE Codes before starting the authorization flow
    const {verifier, challenge} = await provider.generatePkceCodes();
    pkceVerifier = verifier;
    
    const authCodeUrlParameters = {
        scopes: [
            "https://auth.msft.communication.azure.com/Teams.ManageCalls",
            "https://auth.msft.communication.azure.com/Teams.ManageChats"
        ],
        redirectUri: REDIRECT_URI,
        codeChallenge: challenge, 
        codeChallengeMethod: "S256"
    };
    // Get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', async (req, res) => {
    // Create request parameters object for acquiring the AAD token and object ID of a Teams user
    const tokenRequest = {
        code: req.query.code,
        scopes: [
            "https://auth.msft.communication.azure.com/Teams.ManageCalls",
            "https://auth.msft.communication.azure.com/Teams.ManageChats"
        ],
        redirectUri: REDIRECT_URI,
        codeVerifier: pkceVerifier,
    };

    // Retrieve the AAD token and object ID of a Teams user
    pca.acquireTokenByCode(tokenRequest).then(async(response) => {
        console.log("Response:", response);
        let teamsUserAadToken = response.accessToken;
        let userObjectId = response.uniqueId;
        
        // This code demonstrates how to fetch your connection string
        // from an environment variable.
        const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];

        // Instantiate the identity client
        const identityClient = new CommunicationIdentityClient(connectionString);
        
        //Exchange the Azure AD access token of the Teams User for a Communication Identity access token
        let accessToken = await identityClient.getTokenForTeamsUser({
            teamsUserAadToken: teamsUserAadToken,
            clientId: clientId,
            userObjectId: userObjectId,
        });
        console.log("Token:", accessToken);
        
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.listen(SERVER_PORT, () => console.log(`Communication access token application started on ${SERVER_PORT}!`))
