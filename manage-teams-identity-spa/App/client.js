import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { welcomeUser, renderToken, initUI } from './ui.js';
import { msalConfig } from './authConfig.js';
import jwt_decode from "jwt-decode";

// Create the main myMSALObj instance
// The configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

let accountId = "";

const setAccount = function (account) {
  accountId = account.homeAccountId;
  welcomeUser(account.username);
}

const selectAccount = function () {
  /**
   * See here for more info on account retrieval: 
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
   */

  const currentAccounts = myMSALObj.getAllAccounts();

  if (currentAccounts.length < 1) {
    return;
  } else if (currentAccounts.length > 1) {

    /**
     * Due to the way MSAL caches account objects, the auth response from initiating a user-flow
     * is cached as a new account, which results in more than one account in the cache. Here we make
     * sure we are selecting the account with homeAccountId that contains the sign-up/sign-in user-flow, 
     * as this is the default flow the user initially signed-in with.
     */
    const accounts = currentAccounts.filter(account =>

      account.idTokenClaims.aud === msalConfig.auth.clientId
    );

    if (accounts.length > 1) {
      // localAccountId identifies the entity for which the token asserts information.
      if (accounts.every(account => account.localAccountId === accounts[0].localAccountId)) {
        // All accounts belong to the same user
        setAccount(accounts[0]);
      } else {
        // Multiple users detected. Logout all to be safe.
        signOut();
      };
    } else if (accounts.length === 1) {
      setAccount(accounts[0]);
    }

  } else if (currentAccounts.length === 1) {
    setAccount(currentAccounts[0]);
  }
}

const handleResponse = function (response) {
  /**
   * To see the full list of response object properties, visit:
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
   */

  if (response !== null) {
    setAccount(response.account);
  } else {
    selectAccount();
  }
}

const signIn = function () {

  /**
   * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
   */

  myMSALObj.loginPopup({
    scopes: ["openid"], // By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
    prompt: 'select_account'
  })
    .then(handleResponse)
    .catch(error => {
      console.log(error);
    });
}

const signOut = function () {

  /**
   * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
   * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
   */

  const logoutRequest = {
    postLogoutRedirectUri: msalConfig.auth.redirectUri,
    mainWindowRedirectUri: msalConfig.auth.redirectUri
  };

  myMSALObj.logoutPopup(logoutRequest);
}


const acquireAadToken = function (request) {
  /**
  * See here for more information on account retrieval: 
  * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
  */
  request.account = myMSALObj.getAccountByHomeId(accountId);
  request.forceRefresh = false; // set to true to skip the cache

  return myMSALObj.acquireTokenSilent(request).then(function (accessTokenResponse) {
    if (!accessTokenResponse.accessToken || accessTokenResponse.accessToken === "") {
      throw new msal.InteractionRequiredAuthError;
    }
    // Acquire token silent success  
    return accessTokenResponse.accessToken;
  }).catch(function (error) {
    console.log("Silent token acquisition fails. Acquiring token using popup. \n", error);
    // Acquire token silent failure, and send an interactive request
    if (error instanceof msal.InteractionRequiredAuthError) {
      myMSALObj.acquireTokenPopup(request).then(function (accessTokenResponse) {
        // Acquire token interactive success   
        console.log(accessTokenResponse);
        return accessTokenResponse.accessToken;
      }).catch(function (interactiveError) {
        // Acquire token interactive failure
        console.log(interactiveError);
      });
    }
    console.log(error);
  });
}


const getCommunicationTokenForTeamsUser = async function () {
  /** 
  * Acquire a token with a scope of Contoso's Azure AD app
  * For the simplicity of this sample, we are using the .default scope. In a real-world scenario, this would be a custom scope.
  * To do that, follow the tutorial at https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-expose-web-apis
  */
  let apiAccessToken = await acquireAadToken({ scopes: [`${msalConfig.auth.clientId}/.default`] })

  // Acquire a token with delegated permissions Teams.ManageCalls and Teams.ManageChats
  let teamsUserAccessToken = await acquireAadToken({
    scopes:
      [
        "https://auth.msft.communication.azure.com/Teams.ManageCalls",
        "https://auth.msft.communication.azure.com/Teams.ManageChats"
      ]
  });

  // Call the backend API for token exchange
  if (apiAccessToken !== null && teamsUserAccessToken !== null) {
    try {
      const response = await fetch("/exchange", {
        method: "POST",
        // Use API access token for authentication
        headers: [["Authorization", `Bearer ${apiAccessToken}`], ["Content-Type", "application/json"]],
        // Use Teams user access token as payload
        body: JSON.stringify({ accessToken: teamsUserAccessToken })
      });
      const json = await response.json();
      if (json) {
        return json.token;
      }
    }
    catch (error) {
      console.log(error);
    }
  }
}

const displayToken = async function () {
  // Initialize a credential object that can be used for Calling (to create a callAgent)
  const tokenCredential = new AzureCommunicationTokenCredential(
    {
      tokenRefresher: async () => getCommunicationTokenForTeamsUser(),
      refreshProactively: true,
    });
  const token = await tokenCredential.getToken();
  const decoded = jwt_decode(token.token);
  renderToken(decoded);
}

// Start the app
initUI(signIn, signOut, displayToken);
// in case of page refresh
selectAccount();