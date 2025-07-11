import { InteractiveBrowserCredential } from '@azure/identity';
import { ACSTokenManager } from './acs-token-manager.js';
import { config } from './config.js';

class TeamsExtensionDemo {
    constructor() {
        this.credential = null;
        this.user = null;
        this.acsTokenManager = new ACSTokenManager(config.acsResourceEndpoint);
        this.initializeEventListeners();
        this.log('Teams Extension Demo initialized');
        
        // Set up the ACS token manager logger
        this.acsTokenManager.setLogger((message, type) => this.log(message, type));
    }

    initializeEventListeners() {
        document.getElementById('signInBtn').addEventListener('click', () => this.signIn());
        document.getElementById('signOutBtn').addEventListener('click', () => this.signOut());
        document.getElementById('addAccessBtn').addEventListener('click', () => this.addTeamsExtensionAccess());
        document.getElementById('removeAccessBtn').addEventListener('click', () => this.removeTeamsExtensionAccess());
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        const consoleOutput = document.getElementById('consoleOutput');
        const currentContent = consoleOutput.textContent;
        consoleOutput.textContent = currentContent + logMessage + '\n';
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    async signIn() {
        try {
            this.log('Starting sign-in...');
            
            // Configure the credential for browser-based authentication
            this.credential = new InteractiveBrowserCredential({
                clientId: config.azureAD.clientId,
                tenantId: config.azureAD.tenantId,
                redirectUri: window.location.origin,
                loginHint: undefined,
                scopes: config.acsScopes
            });

            this.log('Authentication credential created');
            this.updateUIAfterSignIn();
            
            // Generate ACS token
            await this.generateAndDisplayACSToken();
            
        } catch (error) {
            this.log(`Sign-in failed: ${error.message}`);

            if (error.message.includes('Cross-origin token redemption')) {
                this.displayError('Azure AD app must be configured as Single-Page Application.');
            } else if (error.message.includes('no_token_request_cache_error')) {
                this.displayError('Authentication cache error. Please try again or clear browser cache.');
            } else if (error.message.includes('AADSTS')) {
                this.displayError(`Azure AD error: ${error.message}`);
            } else {
                this.displayError(`Authentication failed: ${error.message}`);
            }
            
            console.error('Authentication error:', error);
        }
    }

    signOut() {
        this.credential = null;
        this.user = null;
        this.acsTokenManager.clearCredential();
        this.updateUIAfterSignOut();
        this.log('Signed out');
    }

    updateUIAfterSignIn() {
        document.getElementById('signInBtn').disabled = true;
        document.getElementById('signOutBtn').disabled = false;
    }

    updateUIAfterSignOut() {
        document.getElementById('signInBtn').disabled = false;
        document.getElementById('signOutBtn').disabled = true;
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('tokenOutput').style.display = 'none';
    }

    displayUserInfo() {
        const userInfoDiv = document.getElementById('userInfo');
        userInfoDiv.innerHTML = `
            <strong>Signed in as:</strong><br>
            Name: ${this.user.name}<br>
            Email: ${this.user.email}<br>
            ID: ${this.user.id}
        `;
        userInfoDiv.style.display = 'block';
        
        this.log(`User authenticated: ${this.user.email} (${this.user.name})`);
    }

    displayError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.style.padding = '1rem';
        errorDiv.style.marginTop = '1rem';
        errorDiv.textContent = message;
        
        const managementOutput = document.getElementById('managementOutput');
        managementOutput.innerHTML = '';
        managementOutput.appendChild(errorDiv);
    }

    displaySuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.style.padding = '1rem';
        successDiv.style.marginTop = '1rem';
        successDiv.textContent = message;
        
        const managementOutput = document.getElementById('managementOutput');
        managementOutput.innerHTML = '';
        managementOutput.appendChild(successDiv);
    }

    async addTeamsExtensionAccess() {
        try {
            this.log('Adding Teams Extension access...');
            
            await this.callServerAPI('/api/teams-extension/add-access', {});
            
            this.displaySuccess('Teams Extension access added successfully');
            this.log('Teams Extension access granted');
            
        } catch (error) {
            this.log(`Failed to add Teams Extension access: ${error.message}`, 'error');
            this.displayError(`Failed to add Teams Extension access: ${error.message}`);
        }
    }

    async removeTeamsExtensionAccess() {
        try {
            this.log('Removing Teams Extension access...');
            
            await this.callServerAPI('/api/teams-extension/remove-access', {});
            
            this.displaySuccess('Teams Extension access removed successfully');
            this.log('Teams Extension access revoked');
            
        } catch (error) {
            this.log(`Failed to remove Teams Extension access: ${error.message}`, 'error');
            this.displayError(`Failed to remove Teams Extension access: ${error.message}`);
        }
    }

    async callServerAPI(endpoint, data) {
        try {
            this.log(`API call: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.log(`API call successful: ${endpoint}`);
            return result;
            
        } catch (error) {
            this.log(`API call failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateAndDisplayACSToken() {
        try {
            if (!this.credential) {
                this.displayError('Please sign in first');
                return;
            }

            this.log('Generating ACS token...');

            const tokenInfo = await this.acsTokenManager.generateAndDisplayACSToken(this.credential);

            const tokenOutput = document.getElementById('tokenOutput');
            tokenOutput.innerHTML = `<div class="token-info"><h4>🔐 ACS Communication Credential</h4>${this.acsTokenManager.generateTokenDisplayHTML(tokenInfo)}</div>`;
            tokenOutput.style.display = 'block';

        } catch (error) {
            this.log(`ACS token generation failed: ${error.message}`, 'error');
            
            this.displayError(this.acsTokenManager.generateErrorDisplayHTML(error));
            
            console.error('ACS token generation error:', error);
            
            const tokenOutput = document.getElementById('tokenOutput');
            tokenOutput.textContent = this.acsTokenManager.generateErrorDisplayHTML(error);
            tokenOutput.style.display = 'block';
        }
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.teamsExtensionDemo) {
        console.log('Teams Extension Demo already initialized, skipping...');
        return;
    }
    
    window.teamsExtensionDemo = new TeamsExtensionDemo();
});
