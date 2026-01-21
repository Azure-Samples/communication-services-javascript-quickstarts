---
page_type: sample
languages:
- javascript
- nodejs
products:
- azure
- azure-communication-services
---

# ACS Calling Tutorial

## Prerequisites
- An Azure account with an active subscription. [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F). 
- A deployed Communication Services resource. [Create a Communication Services resource](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource?tabs=windows&pivots=platform-azp).
- [NPM](https://www.npmjs.com/get-npm)
- You need to have [Node.js 18](https://nodejs.org/dist/v18.18.0/). You can use the msi installer to install it.

## Code structure
* ./Project/src: client side source code
* ./Project/webpack.config.js: Project bundler. Has a simple local server for user token provisioning.
* ./Project/serverConfig.json: configuration file for specifying the connection strings.

## Cloning the repo
1. Open a terminal or command prompt, and `cd` into a folder where you would like to clone this repo. The run:
   - `git clone https://github.com/Azure-Samples/communication-services-web-calling-tutorial`
   - `cd communication-services-web-calling-tutorial/Project`
## Running the app locally
1. Get your Azure Communication Services resource connection string from the Azure portal, and put it as the value for `connectionString` in serverConfig.json file.
2. From the terminal/command prompt, Run:
   - `npm install`
   - `npm run build-local`
   - `npm run start-local`
3. Open localhost:5000 in a browser. (Supported browsers are Chrome, Edge, and Safari)

## Deploying to Azure App Service
- This app has been setup to be easily deployed to Azure App Service
   - webpack.config.js.
      - allowedHosts: Specifies that it allows this app to be hosted in \<appname\>.azurewebsites.org which is how Azure App Service hosts web apps.
      - contentBase: The folder where public assets can be served from. For example, a request to your app like GET https://\<appname\>.azurewebsites.org/file.txt, will serve the file.txt that resides in the contentBase folder. This app has this field set to the './public' folder.
   - package.json. Azure app service will run these scripts when deploying.
      - "build" script. Used by Azure App Service when deploying to build the application.
      - "start" script. Used by Azure App Service when deploying. This will start server in port 8080. Port 8080 is specified in webpack.config.js. Do not change this port when deploying to Azrue App Service becaue this is the port that Azure App Service uses. 
[Tutorial on how to deploy a NodeJs app to Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs?tabs=windows&pivots=development-environment-vscode)
Note: If you want to deploy this application with a different deployment environment other than Azure App Service, you may need to change these configurations according to your deployment environment specifications.

## Troubleshooting
   - Make sure your ACS connecting string is specified in serverConfig.json or you wont be able to provision ACS User Access tokens for the app.
   - If any errors occur, check the browser console logs for errors. Also, check the webpack server side console logs for errors.
   - Web Push Notifications - In order to test web push notifications, we must run the app in HTTPS, hence you will need to deploy this app to a secured server that will serve the application with HTTPS. You will need to specify value in ./clientConfig.json for the key "oneSignalAppId". And you will need to specify value for "functionAppOneSignalTokenRegistrationUrl" in ./serverConfig.json. To learn how to set up a web push notification architecture for the ACS Web Calling SDK, please follow our [ACS Web Calling SDK - Web push notifications tutorial](https://github.com/Azure-Samples/communication-services-javascript-quickstarts/tree/main/calling-web-push-notifications):

## Resources
1. Documentation on how to use the ACS Calling SDK for Javascript can be found on https://docs.microsoft.com/en-gb/azure/communication-services/quickstarts/voice-video-calling/calling-client-samples?pivots=platform-web
2. ACS Calling SDK for Javascript API reference documentation can be found on https://docs.microsoft.com/en-us/javascript/api/azure-communication-services/@azure/communication-calling/?view=azure-communication-services-js
3. Documentation on Communications Calling SDK with Teams identity can be found on https://learn.microsoft.com/en-us/azure/communication-services/concepts/teams-interop
4. Documentation on how to setup and get access tokens for teams User can be found on https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/manage-teams-identity?pivots=programming-language-javascript