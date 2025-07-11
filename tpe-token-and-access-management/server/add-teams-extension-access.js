/**
 * Demonstrates how to grant access to a user via the assignment management APIs
 */

const APIClient = require('./api-client');
const config = require('./config');

class TeamsExtensionAccessManager extends APIClient {
    constructor() {
        super();
    }

    /**
     * Add Teams Extension access for a user
     * @param {string} userId - The user's Azure AD object ID (objectId)
     * @param {string} tenantId - The tenant ID
     * @param {string[]} clientIds - Array of client IDs
     * @returns {Promise<object>} Response from the API
     */
    async addTeamsExtensionAccess(userId, tenantId, clientIds) {
        try {
            console.log(`[${new Date().toISOString()}] Adding Teams Extension access for user: ${userId}`);

            // Validate required parameters
            if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
                throw new Error('userId is required and must be a non-empty string');
            }
            
            if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
                throw new Error('tenantId is required and must be a non-empty string');
            }
            
            if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
                throw new Error('clientIds is required and must be a non-empty array');
            }

            const assignmentRequest = {
                principalType: 'User',
                clientIds: clientIds
            };

            const endpoint = `access/teamsExtension/tenants/${tenantId}/assignments/${userId}?api-version=${config.api.version}`;
            
            const response = await this.makeAPICall('PUT', endpoint, assignmentRequest);

            console.log(`[${new Date().toISOString()}] Successfully created Teams Extension assignment for user: ${userId}`);

            return {
                success: true,
                userId: userId,
                tenantId: tenantId,
                principalType: 'User',
                clientIds: clientIds,
                assignmentCreated: true,
                timestamp: new Date().toISOString(),
                apiResponse: response
            };

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error creating Teams Extension assignment:`, error.message);
            throw error;
        }
    }
}

// Export for use as a module
module.exports = TeamsExtensionAccessManager;
