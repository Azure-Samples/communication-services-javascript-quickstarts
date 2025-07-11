/**
 * Demonstrates how to revoke access from a user via the assignment management APIs
 */

const APIClient = require('./api-client');
const config = require('./config');

class TeamsExtensionAccessRemover extends APIClient {
    constructor() {
        super();
    }

    /**
     * Remove Teams Extension access for a user
     * @param {string} userId - The user's Azure AD object ID
     * @param {string} tenantId - The tenant ID
     * @returns {Promise<object>} Response from the API
     */
    async removeTeamsExtensionAccess(userId, tenantId) {
        try {
            console.log(`[${new Date().toISOString()}] Removing Teams Extension access for user: ${userId}`);

            // Validate required parameters
            if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
                throw new Error('userId is required and must be a non-empty string');
            }
            
            if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
                throw new Error('tenantId is required and must be a non-empty string');
            }

            const endpoint = `access/teamsExtension/tenants/${tenantId}/assignments/${userId}?api-version=${config.api.version}`;
            
            const response = await this.makeAPICall('DELETE', endpoint, null);

            console.log(`[${new Date().toISOString()}] Successfully removed Teams Extension access for user: ${userId}`);

            return {
                success: true,
                userId: userId,
                tenantId: tenantId,
                accessRevoked: true,
                timestamp: new Date().toISOString(),
                apiResponse: response
            };

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error removing Teams Extension access:`, error.message);
            throw error;
        }
    }

    /**
     * Check current access status for a user
     * @param {string} userId - The user's Azure AD object ID
     * @param {string} tenantId - The tenant ID (required)
     * @returns {Promise<object>} Current access status
     */
    async checkAccessStatus(userId, tenantId) {
        try {
            console.log(`[${new Date().toISOString()}] Checking Teams Extension access status for user: ${userId}`);

            // Validate required parameters
            if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
                throw new Error('userId is required and must be a non-empty string');
            }
            
            if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
                throw new Error('tenantId is required and must be a non-empty string');
            }

            const response = await this.makeAPICall('GET', `access/teamsExtension/tenants/${tenantId}/assignments/${userId}?api-version=${config.api.version}`, null);

            return response;

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error checking access status:`, error.message);
            throw error;
        }
    }
}

// Export for use as a module
module.exports = TeamsExtensionAccessRemover;

