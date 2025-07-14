---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Teams Extension User Demo

A sample application demonstrating Teams Extension User management with Azure Communication Services and Entra ID authentication.

This sample demonstrates how to:
- Integrate Azure Communication Services Teams Extension User management APIs with Entra ID authentication
- Add and remove Teams Extension access for users through secure server-side operations
- Generate ACS tokens using Azure credentials


## Project Structure

```
tpe-token-and-access-management/
├── client/
│   └── client.js              # Client-side authentication and UI logic
├── server/
│   ├── add-teams-extension-access.js    # Server-side: Add Teams Extension access (real API calls)
│   ├── remove-teams-extension-access.js # Server-side: Remove Teams Extension access (real API calls)
│   ├── hmac-authenticator.js            # HMAC authentication for Azure APIs
│   └── server.js              # Express server with API endpoints
├── index.html                 # Main web interface
├── webpack.config.js          # Webpack configuration
├── package.json              # Node.js dependencies and scripts
└── README.md                 # This file
```

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- [Node.js](https://nodejs.org/en/) (version 14 or higher)
- An active Communication Services resource. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource).
- Entra ID application registration with appropriate permissions. [Create an Entra ID application](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app).

> **Note:** This demo uses the Azure Communication Services JavaScript Common SDK (version 2.4.0 or higher) for token generation.

## Before running sample code

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git
   cd tpe-token-and-access-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Entra ID application:**
   - Create an Entra ID app registration in the [Azure Portal](https://portal.azure.com)
   - Add redirect URI using **Single-page application** platform: `http://localhost:3000`
   - Add API permissions: `https://auth.msft.communication.azure.com/TeamsExtension.ManageCalls`
   - Note the Client ID and Tenant ID

4. **Create Azure Communication Services resource:**
   - Go to Azure Portal and create a new Communication Services resource
   - Note the connection string and endpoint URL

5. **Update configuration files:**
   - Edit `client/config.js` with your Entra ID configuration (Client ID, Tenant ID) and ACS endpoint
   - Edit `server/config.js` with your server configuration (ACS endpoint, ACS resource key, user ID, tenant ID, client IDs array)

## Run the code

```bash
npm start
```

This builds the application and starts the server at `http://localhost:3000`.

Open your browser and navigate to http://localhost:3000. You should see the Teams Extension User Demo interface.

## API Endpoints

When running the server, the following endpoints are available:

- `POST /api/teams-extension/add-access` - Add Teams Extension access (requires userId, tenantId, clientIds)
- `POST /api/teams-extension/remove-access` - Remove Teams Extension access (requires userId, tenantId)

## How It Works

### Workflow Order
1. **Teams Extension User Management** (Server-side, HMAC authentication)
   - Add or remove Teams Extension access for users via ACS Management APIs
   - Uses HMAC authentication
   - Requires userId, tenantId, and clientIds for access management
   
2. **Authentication & Token Exchange** (Client-side, token generation)
   - User signs in with Azure credentials using `InteractiveBrowserCredential`
   - Obtains user identity and Azure tokens
   - Automatically generates and displays ACS access token using the ACS Common SDK



