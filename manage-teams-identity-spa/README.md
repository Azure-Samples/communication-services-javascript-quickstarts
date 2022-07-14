---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Create and manage Communication access tokens for Teams users in a single-page application (SPA)

This code sample walks you through the process of acquiring a Communication Token Credential by exchanging an Azure AD token of a user with a Teams license for a valid Communication access token.

The client part of this sample utilizes the [MSAL.js v2.0](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) (`msal-browser`) package for authentication against the Azure AD and acquisition of a token with delegated permissions.
The initialization of a Communication credential object that can be used for Calling is achieved by the `@azure/communication-common` package.

The server part of the sample is based on [Express.js](https://expressjs.com/) and relies on widely used libraries such as `express-jwt` and `jwks-rsa` for Azure AD token validation. The token exchange itself is then facilitated by the `@azure/communication-identity` package.

## Prerequisites

- An Azure account with an active subscription. Create an account for free.
- Node.js [Active LTS version](https://nodejs.org/en/about/releases/)
- An active Communication Services resource and connection string. Create a Communication Services resource.
- Azure Active Directory tenant with users that have a Teams license.

## Before running sample code

1. Complete the [Administrator actions](https://docs.microsoft.com/azure/communication-services/quickstarts/manage-teams-identity?pivots=programming-language-javascript#administrator-actions) from the [Manage access tokens for Teams users quickstart](https://docs.microsoft.com/azure/communication-services/quickstarts/manage-teams-identity).
   - Take a not of Fabrikam's Azure AD Tenant ID and Contoso's Azure AD App Client ID. You'll need the values in the following steps.
1. On the Authentication pane of your Azure AD App, add a new platform of the SPA (single-page application) type with the Redirect URI of `http://localhost:3000/spa`.
1. Open an instance of Windows Terminal, PowerShell, or an equivalent command line and navigate to the directory that you'd like to clone the sample to.
1. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
1. Navigate to the `manage-teams-identity-spa` directory.
1. Run `mv .env.example .env` to initialize a `.env` configuration file from a template.
1. With the Communication Services procured in pre-requisites and Azure AD Tenant and App Registration procured as part of the Administrator actions, you can now add the connection string, tenant ID and app client ID to the `.env` file.

    ```ini
    # Azure Communication Services Connection String
    COMMUNICATION_SERVICES_CONNECTION_STRING="endpoint=https://<acs-resource>.communication.azure.com/;accesskey=<access-key>"

    # Azure AD MULTI-TENANT configuration
    AAD_CLIENT_ID="<contoso-azure-ad-app-client-id>"
    AAD_TENANT_ID="<fabrikam-azure-ad-tenant-id>"
    ```

## Run the code

From a console prompt, navigate to the directory containing the `server.js` file, then execute the following node commands to run the app.

1. `npm i` to install the dependencies
2. `npm start`

Open your browser and navigate to [http://localhost:3000/](http://localhost:3000/). You should be presented with the following screen:

![Create Communication token for Teams users](https://user-images.githubusercontent.com/9810625/178840056-0e387f72-c0ee-4b65-95b2-2eff9c1f5ee6.gif)

## Next steps

### Extending the sample with a custom scope validation

For the simplicity of this sample, only the `.default` scope is required while acquiring the Azure AD token. It is possible to extend this app with a custom scope validation logic by following the steps below:

1. Add a custom scope by following [this tutorial](https://docs.microsoft.com//azure/active-directory/develop/quickstart-configure-app-expose-web-apis#add-a-scope)
1. Run 'npm install express-jwt-authz' from the console in the root folder of the project
1. Uncomment the following lines in `server.js` and adjust the scope name to match your custom scope name

    ```js
    const jwtAuthz = require('express-jwt-authz');
    ...
    jwtAuthz([ '<custom-scope-name>' ], {}),
    ```

1. Change the scope name in `client.js` from `${msalConfig.auth.clientId}/.default` to your custom scope `api://<application-client-id>/<custom-scope-name>`

    ```js
    let apiAccessToken = await acquireAadToken({ scopes: [`${msalConfig.auth.clientId}/.default`] })
    ```
