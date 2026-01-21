const authConfig = {
    auth: {
        clientId: 'ENTER_CLIENT_ID',
        authority: 'https://login.microsoftonline.com/ENTER_TENANT_ID'
    }
};
 // Add here scopes for id token to be used at MS Identity Platform endpoints.
const authScopes = {
    popUpLogin: [],
    m365Login: []
};

module.exports = {authConfig, authScopes }