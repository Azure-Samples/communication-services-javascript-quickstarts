require('dotenv').config({path: __dirname + '/.env' })
const { AzureCommunicationTokenCredential } = require('@azure/communication-common');    
const {InteractiveBrowserCredential} = require('@azure/identity');
const express = require("express");

// You will need to set environment variables in .env
const SERVER_PORT = process.env.PORT || 80;

// This code demonstrates how to fetch your Microsoft Entra client ID and tenant ID from environment variables.
const clientId = process.env['ENTRA_CLIENT_ID'];
const tenantId = process.env['ENTRA_TENANT_ID'];

// Initialize InteractiveBrowserCredential for use with AzureCommunicationTokenCredential.
const entraTokenCredential = new InteractiveBrowserCredential({
  tenantId: tenantId,
  clientId: clientId,
});

const app = express();

app.get('/', async (req, res) => {
    try {
        console.log("Azure Communication Services - Obtain Access Token for Entra ID User Quickstart");
        // This code demonstrates how to fetch your Azure Communication Services resource endpoint URI
        // from an environment variable.
        const resourceEndpoint = process.env['COMMUNICATION_SERVICES_RESOURCE_ENDPOINT'];
        
        // Set up AzureCommunicationTokenCredential to request a Communication Services access token for a Microsoft Entra ID user.
        const entraTokenCredentialOptions = {
            resourceEndpoint: resourceEndpoint,
            tokenCredential: entraTokenCredential,
            scopes: ["https://communication.azure.com/clients/VoIP"],
        };
        const entraCommunicationTokenCredential = new AzureCommunicationTokenCredential(
            entraTokenCredentialOptions
        );

        // To obtain a Communication Services access token for Microsoft Entra ID call getToken() function.
        let accessToken = await entraCommunicationTokenCredential.getToken();
        console.log("Token:", accessToken);
        
    } catch (err) {
        console.error("Error obtaining token:", err);
        res.status(500).send("Failed to obtain token");
    }
});
    
 app.listen(SERVER_PORT, () => console.log(`Obtain Communication access token for Entra ID user application started on ${SERVER_PORT}!`))