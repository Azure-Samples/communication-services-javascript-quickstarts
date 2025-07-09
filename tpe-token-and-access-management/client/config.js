/**
 * Update these values according to your Azure setup
 */

export const config = {
    // Azure Communication Services resource endpoint
    // Format: https://your-acs-resource.communication.azure.com/
    acsResourceEndpoint: 'https://ops-demo-test-1.unitedstates.communication.azure.com/',
    
    // Azure AD application configuration
    azureAD: {
        clientId: '7df5ab42-bf69-40f1-8734-41f010af88bb',
        tenantId: 'be5c2424-1562-4d62-8d98-815720d06e4a'
    },
    
    // Azure Communication Services scopes
    acsScopes: ['https://auth.msft.communication.azure.com/TeamsExtension.ManageCalls']
};
