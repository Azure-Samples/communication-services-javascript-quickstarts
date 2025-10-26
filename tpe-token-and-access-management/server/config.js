/**
 * * Update these values according to your ACS setup
 */

const config = {
    // Azure Communication Services configuration
    // Format: https://your-acs-resource.communication.azure.com/
    acs: {
        acsEndpoint: '<YOUR-RESOURCE-ENDPOINT>',
        resourceKey: '<YOUR-RESOURCE-KEY>'
    },

    // API configuration
    api: {
        version: '2025-06-30',
        timeout: 30000 // 30 seconds
    },

    // Teams Extension User configuration
    teamsExtension: {
        userId: '<ENTRA-USER-ID>',        // Azure AD Object ID of the user
        tenantId: '<ENTRA-TENANT-ID>',    // Azure AD Tenant ID
        clientIds: [                        // Array of client IDs for Teams Extension access
            '<ENTRA-CLIENT-ID>'
        ]
    },

    // Server configuration
    server: {
        port: process.env.PORT || 3000
    }
};

module.exports = config;
