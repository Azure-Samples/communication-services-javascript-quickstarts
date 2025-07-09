/**
 * * Update these values according to your ACS setup
 */

const config = {
    // Azure Communication Services configuration
    acs: {
        acsEndpoint: 'https://ops-demo-test-1.unitedstates.communication.azure.com',
        resourceKey: '9JC7zMuvnrlh5C4QAgMza5qG0IcmVWED4ZyQo7Xe5NSULg94BpQNJQQJ99BGACULyCpq7uOMAAAAAZCSpb8l'
    },

    // API configuration
    api: {
        version: '2025-06-30',
        timeout: 30000 // 30 seconds
    },

    // Teams Extension User configuration
    teamsExtension: {
        userId: 'fa4b6b3f-0357-41de-a258-729bd11602c4',        // Azure AD Object ID of the user
        tenantId: 'be5c2424-1562-4d62-8d98-815720d06e4a',    // Azure AD Tenant ID
        clientIds: [                        // Array of client IDs for Teams Extension access
            '7df5ab42-bf69-40f1-8734-41f010af88bb'
        ]
    },

    // Server configuration
    server: {
        port: process.env.PORT || 3000
    }
};

module.exports = config;
