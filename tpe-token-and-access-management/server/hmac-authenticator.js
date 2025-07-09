/**
 * HMAC HTTP Authenticator for Teams Extension API
 */

const crypto = require('crypto');

class HmacHttpAuthenticator {
    constructor(secret) {
        if (!secret) {
            throw new Error('HMAC secret is required');
        }
        this._secret = Buffer.from(secret, 'base64');
    }

    /**
     * Add HMAC authentication headers to an HTTP request
     * @param {object} requestOptions - HTTP request options (method, url, body, headers)
     * @returns {object} Updated request options with authentication headers
     */
    addAuthentication(requestOptions) {
        const { method, url, body = '' } = requestOptions;
        
        const urlObj = new URL(url);
        const date = this.getDate();
        const authority = this.getAuthority(urlObj);
        const content = body === null || body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
        
        const contentHash = this.computeContentHash(content);
        const hmacHeader = this.getAuthorizationHeader(method, urlObj, authority, contentHash, date);
        
        const headers = { ...(requestOptions.headers || {}) };
        
        headers['x-ms-content-sha256'] = contentHash;
        headers['date'] = date;
        headers['host'] = authority;
        headers['authorization'] = hmacHeader;
        
        return {
            ...requestOptions,
            headers
        };
    }

    /**
     * Get current date in RFC 2822 format
     * @returns {string} Formatted date string
     */
    getDate() {
        return new Date().toUTCString();
    }

    /**
     * Get authority from URL
     * @param {URL} urlObj - URL object
     * @returns {string} Authority (host:port)
     */
    getAuthority(urlObj) {
        return urlObj.host;
    }

    /**
     * Generate HMAC authorization header
     * @param {string} method - HTTP method
     * @param {URL} urlObj - URL object
     * @param {string} authority - Authority string
     * @param {string} contentHash - Content hash
     * @param {string} authDate - Authentication date
     * @returns {string} Authorization header value
     */
    getAuthorizationHeader(method, urlObj, authority, contentHash, authDate) {
        const pathAndQuery = urlObj.pathname + urlObj.search;
        const phrase = `${method}\n${pathAndQuery}\n${authDate};${authority};${contentHash}`;
        const hash = this.computeSignature(phrase);
        
        return `HMAC-SHA256 SignedHeaders=date;host;x-ms-content-sha256&Signature=${hash}`;
    }

    /**
     * Compute HMAC-SHA256 signature
     * @param {string} phrase - String to sign
     * @returns {string} Base64 encoded signature
     */
    computeSignature(phrase) {
        const hmac = crypto.createHmac('sha256', this._secret);
        hmac.update(phrase, 'ascii');
        return hmac.digest('base64');
    }

    /**
     * Compute SHA256 hash of content
     * @param {string} rawData - Raw content data
     * @returns {string} Base64 encoded hash
     */
    computeContentHash(rawData) {
        const hash = crypto.createHash('sha256');
        hash.update(rawData, 'utf8');
        return hash.digest('base64');
    }
}

module.exports = HmacHttpAuthenticator;
