/**
 * Update these values according to your Azure setup
 */

export const config = {
    // Azure Communication Services resource endpoint
    // Format: https://your-acs-resource.communication.azure.com/
    acsResourceEndpoint: '<YOUR-RESOURCE-ENDPOINT>',
    
    // Azure AD application configuration
    azureAD: {
        clientId: '<ENTRA-CLIENT-ID>',
        tenantId: '<ENTRA-TENANT-ID>'
    },
    
    // Azure Communication Services scopes
    acsScopes: ['https://auth.msft.communication.azure.com/TeamsExtension.ManageCalls']
};
