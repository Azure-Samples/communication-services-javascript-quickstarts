import { AzureCommunicationTokenCredential } from '@azure/communication-common';

/**
 * Manages Azure Communication Services token generation
 */
export class ACSTokenManager {
    constructor(resourceEndpoint) {
        this.communicationCredential = null;
        this.logger = null;
        this.resourceEndpoint = resourceEndpoint;
    }

    /**
     * Set the logger function for this token manager
     * @param {Function} loggerFn - Function to call for logging (message, type)
     */
    setLogger(loggerFn) {
        this.logger = loggerFn;
    }

    /**
     * Log a message using the provided logger or console
     * @param {string} message - Message to log
     * @param {string} type - Type of message (info, error, warning, success)
     */
    log(message, type = 'info') {
        if (this.logger) {
            this.logger(message, type);
        } else {
            console.log(`[ACSTokenManager] ${message}`);
        }
    }

    /**
     * Generate and display ACS token using the provided Azure AD credential
     * @param {InteractiveBrowserCredential} credential - Azure AD credential
     * @returns {Promise<Object>} Token information object
     */
    async generateAndDisplayACSToken(credential) {
        try {
            if (!credential) {
                throw new Error('Please sign in first');
            }

            this.log('Creating ACS credential...');

            // Create the ACS credential - this will trigger authentication if not already done
            this.communicationCredential = new AzureCommunicationTokenCredential({
                resourceEndpoint: this.resourceEndpoint,
                tokenCredential: credential,
                scopes: ['https://auth.msft.communication.azure.com/TeamsExtension.ManageCalls']
            });

            this.log('ACS credential created', 'success');

            // Generate ACS token
            const acsToken = await this.generateACSToken();

            // Get token information for display
            const tokenInfo = await this.getTokenDisplayInfo(acsToken);
            
            return tokenInfo;

        } catch (error) {
            this.log(`ACS credential failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate ACS token
     * @returns {Promise<Object|null>} ACS token object or null if failed
     */
    async generateACSToken() {
        try {
            const acsToken = await this.communicationCredential.getToken();
            this.log(`Token generation: ${acsToken ? 'Success' : 'Failed'}`);
            return acsToken;
        } catch (acsError) {
            this.log(`Token generation failed: ${acsError.message}`, 'warning');

            // Handle 403 errors specifically
            if (acsError.message.includes('Status: 403')) {
                this.log(`⚠️ Teams Extension access required - use "Add Teams Extension Access" first`, 'warning');
            }
            return null;
        }
    }

    /**
     * Get token information for display purposes
     * @param {Object|null} acsToken - ACS token object from generateACSToken
     * @returns {Promise<Object>} Token display information
     */
    async getTokenDisplayInfo(acsToken) {
        let tokenInfo = {
            success: false,
            skypeId: 'Not found',
            token: null,
            expiresOn: null,
            error: null
        };

        try {
            if (acsToken) {
                tokenInfo.success = true;
                tokenInfo.token = acsToken.token;
                tokenInfo.expiresOn = acsToken.expiresOnTimestamp ? new Date(acsToken.expiresOnTimestamp).toISOString() : null;
                
                // Extract skypeid from the ACS token
                tokenInfo.skypeId = this.extractSkypeIdFromToken(acsToken.token);
            } else {
                tokenInfo.error = 'No token available';
            }
        } catch (tokenError) {
            tokenInfo.error = tokenError.message;
        }

        return tokenInfo;
    }

    /**
     * Extract skypeid from ACS token payload
     * @param {string} token - The ACS token
     * @returns {string} The extracted skypeid or error message
     */
    extractSkypeIdFromToken(token) {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                // Decode the payload with proper base64 padding
                let base64Payload = tokenParts[1];
                base64Payload += '='.repeat((4 - base64Payload.length % 4) % 4);
                
                const payload = JSON.parse(atob(base64Payload));
                const skypeId = payload.skypeid || payload.sub || payload.oid || 'Not found in token';
                
                return skypeId;
            }
        } catch (decodeError) {
            return 'Failed to decode';
        }
        
        return 'Invalid token format';
    }

    /**
     * Generate HTML for displaying token information
     * @param {Object} tokenInfo - Token information object
     * @returns {string} HTML string for display
     */
    generateTokenDisplayHTML(tokenInfo) {
        if (!tokenInfo.success) {
            return `<div class="token-details">
                <p><strong>Token Status:</strong> <span style="color: #d32f2f;">Failed to retrieve - ${tokenInfo.error || 'Unknown error'}</span></p>
            </div>`;
        }

        return `<div class="token-details">
            <h5>Communication User ID (skypeid):</h5>
            <div style="background-color: #e7f3ff; border: 1px solid #0078d4; padding: 15px; margin: 5px 0; border-radius: 5px; font-family: monospace; word-break: break-all; line-height: 1.4;">
                <code style="font-size: 14px; color: #0078d4; font-weight: bold;">${tokenInfo.skypeId}</code>
            </div>
            <h5>Full ACS Token:</h5>
            <textarea readonly style="width: 100%; height: 120px; font-family: monospace; font-size: 12px; background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; margin: 5px 0;">${tokenInfo.token}</textarea>
            <p><strong>Expires:</strong> ${tokenInfo.expiresOn || 'No expiry'}</p>
        </div>`;
    }

    /**
     * Generate error display HTML for 403 errors
     * @param {Error} error - The error object
     * @returns {string} HTML string for error display
     */
    generateErrorDisplayHTML(error) {
        if (error.message.includes('Status: 403')) {
            return `❌ 403 Forbidden Error: Teams Extension Access Required`;
        }

        return `❌ Error: ${error.message}`;
    }

    /**
     * Clear the communication credential
     */
    clearCredential() {
        this.communicationCredential = null;
    }
}
