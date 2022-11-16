---
page_type: sample
languages:
- javascript
products:
- azure
- azure-communication-services
---

# Create and manage Communication access tokens for Teams users in mobile and desktop applications

This code sample walks you through the process of acquiring a Communication Token Credential by exchanging an Azure AD token of a user with a Teams license for a valid Communication access token.

This sample application utilizes the [MSAL.js v2.0](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) (`msal-node`) package for authentication against the Azure AD and acquisition of a token with delegated permissions and [Express.js](https://expressjs.com/). The token exchange itself is facilitated by the `@azure/communication-identity` package.

To be able to use the token for Calling, use it to initialize the `AzureCommunicationTokenCredential` from the `@azure/communication-common` package.

## Prerequisites

- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- Node.js [Active LTS version](https://nodejs.org/en/about/releases/).
- An active Communication Services resource and connection string. [Create a Communication Services resource](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource/).
- Azure Active Directory tenant with users that have a Teams license.

## Before running sample code

1. Complete the [Administrator actions](https://docs.microsoft.com/azure/communication-services/quickstarts/manage-teams-identity?pivots=programming-language-javascript#administrator-actions) from the [Manage access tokens for Teams users quickstart](https://docs.microsoft.com/azure/communication-services/quickstarts/manage-teams-identity).
   - Take a note of Fabrikam's Azure AD Tenant ID and Contoso's Azure AD App Client ID. You'll need the values in the following steps.
1. On the Authentication pane of your Azure AD App, add a new platform of the mobile and desktop application type with the Redirect URI of `http://localhost:<PORT>/redirect`.
1. Open an instance of Windows Terminal, PowerShell, or an equivalent command line and navigate to the directory that you'd like to clone the sample to.
1. `git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`
1. Navigate to the `manage-teams-identity-mobile-and-desktop` directory.
1. Run `mv .env.example .env` to initialize a `.env` configuration file from a template.
1. With the Communication Services procured in pre-requisites and Azure AD Tenant and App Registration procured as part of the Administrator actions, you can now add the connection string, the server port, tenant ID and app client ID to the `.env` file.

    ```ini
    # Azure Communication Services Connection String
    COMMUNICATION_SERVICES_CONNECTION_STRING="endpoint=https://<acs-resource>.communication.azure.com/;accesskey=<access-key>"

    # Azure AD MULTI-TENANT configuration
    AAD_CLIENT_ID="<contoso-azure-ad-app-client-id>"
    AAD_TENANT_ID="<fabrikam-azure-ad-tenant-id>"

    # Server port
    SERVER_PORT="<server-port>"
    ```

## Run the code

From a console prompt, navigate to the directory containing the `issue-communication-access-token.js` file, then execute the following node commands to run the app.

1. `npm i` to install the dependencies
2. `node ./issue-communication-access-token.js`

Open your browser and navigate to `http://localhost:<PORT>/`. You will be presented with the Azure AD login form. If the authentication is successful, the application receives an Azure AD access token through a callback URI `http://localhost:<PORT>/redirect`, where the exchange for a Communication access token will also take place.
