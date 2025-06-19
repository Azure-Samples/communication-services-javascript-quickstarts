import React, { useState } from "react";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";    
import { InteractiveBrowserCredential } from "@azure/identity";

function App() {
    // Set your Microsoft Entra client ID and tenant ID, Azure Communication Services resource endpoint URI.
    const clientId = 'YOUR_ENTRA_CLIENT_ID';
    const tenantId = 'YOUR_ENTRA_TENANT_ID';
    const resourceEndpoint = 'YOUR_COMMUNICATION_SERVICES_RESOURCE_ENDPOINT';
    
    const [accessToken, setAccessToken] = useState("");
    const [error, setError] = useState("");
    
    const handleLogin = async () => {
        try {
            // Initialize InteractiveBrowserCredential for use with AzureCommunicationTokenCredential.
            const entraTokenCredential = new InteractiveBrowserCredential({
                tenantId: tenantId,
                clientId: clientId,
                authorityHost: "https://login.microsoftonline.com/organizations",
            });
            
            // Set up AzureCommunicationTokenCredential to request a Communication Services access token for a Microsoft Entra ID user.
            const entraCommunicationTokenCredential = new AzureCommunicationTokenCredential({
                resourceEndpoint: resourceEndpoint,
                tokenCredential: entraTokenCredential,
            });

            // To obtain a Communication Services access token for Microsoft Entra ID call getToken() function.
            let accessToken = await entraCommunicationTokenCredential.getToken();
            setAccessToken(accessToken.token);
            setError("");
        } catch (err) {
            console.error("Error obtaining token:", err);
            setError("Failed to obtain token: " + err.message);
        }
    };

    return (
        <div>
            <h2>Obtain Access Token for Entra ID User</h2>
            <button onClick={handleLogin}>Login and Get Access Token</button>
            {accessToken && (
                <div>
                <h4>Access Token:</h4>
                <textarea value={accessToken} readOnly rows={6} cols={60} />
                </div>
            )}
            {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
    );
}

export default App;