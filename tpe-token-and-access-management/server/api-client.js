const axios = require('axios');
const HMACAuthenticator = require('./hmac-authenticator');
const config = require('./config');

/**
 * Shared API client utility for ACS Auth service calls with HMAC authentication
 */
class APIClient {
    constructor() {
        this.baseUrl = config.acs.acsEndpoint;
        this.hmacAuthenticator = new HMACAuthenticator(config.acs.resourceKey);
    }

    /**
     * Make an API call to the ACS Auth service using HMAC authentication
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {object} payload - Request payload (null for GET requests)
     * @returns {Promise<object>} API response
     */
    async makeAPICall(method, endpoint, payload) {
        const fullUrl = `${this.baseUrl}${endpoint}`;
        const body = payload ? JSON.stringify(payload) : '';
        
        const requestOptions = {
            method: method,
            url: fullUrl,
            body: body,
            headers: {
                'api-version': config.api.version
            }
        };

        // Only add Content-Type if there's a body
        if (body && body.length > 0) {
            requestOptions.headers['Content-Type'] = 'application/json';
        }

        const authenticatedRequest = this.hmacAuthenticator.addAuthentication(requestOptions);

        console.log(`[${new Date().toISOString()}] Making ${method} request to: ${fullUrl}`);
        console.log(`[${new Date().toISOString()}] HMAC Authorization: ${authenticatedRequest.headers.authorization}`);

        try {
            const response = await axios({
                method: method,
                url: fullUrl,
                data: payload,
                headers: authenticatedRequest.headers,
                timeout: config.api.timeout
            });

            console.log(`[${new Date().toISOString()}] API call successful - Status: ${response.status}`);
            console.log(`[${new Date().toISOString()}] Response ms-cv header: ${response.headers['ms-cv'] || 'Not present'}`);
            return response.data;

        } catch (error) {
            console.error(`[${new Date().toISOString()}] API call failed:`, error.message);
            
            if (error.response) {
                console.error(`[${new Date().toISOString()}] Response status: ${error.response.status}`);
                console.error(`[${new Date().toISOString()}] Response ms-cv header: ${error.response.headers['ms-cv'] || 'Not present'}`);
                throw new Error(`API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new Error(`No response received from API: ${error.message}`);
            } else {
                throw new Error(`Request setup failed: ${error.message}`);
            }
        }
    }
}

module.exports = APIClient;
