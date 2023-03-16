# ACS Web Calling SDK - Web push notifications architecture quickstart

This quickstart will showcase how to set up a web push notification architecture for the ACS Web Calling SDK. We will walk through the set up steps necessary to set up the architecture. For this architecture, we will be sending the web push notifications via OneSignal, a web push service provider.

Main components of this web push notification architecture are:
- Back-end:
    - OneSignal service app - You will use OneSignal to easily send web push notifications to callees.
    - ACS IncomingCall Event listener Function App - You will create an Azure Function App to listen to IncomingCall events from ACS EventGrid, and call your OneSignal app via REST to send the Incoming Call web push notification to the callee.
    - `webpack.config.js` - Backend server for this application. From this server you will generate ACS tokens so the front end user can log into the ACS Web Calling SDK. We will also generate OneSignal Registration Tokens to map them to ACS communication User Id. We will keep this mapping here on our backend server.
- Front-end:
    - `./src` - Contains files for the front end application to demo web push notifications. This front-end application will use the ACS Web Calling SDK for web calling functionality.


### Create your OneSignal service app
OneSignal is one of many web push providers. It is a tool that you can use to send push notifications to your web clients so that they will see the native browser notification window pop up with information about the notification. Create your account at OneSignal.com
- Once you create your account, navigate to your Apps dashboard and click on "New App/Website" to create your OneSignal service app:
<img src="./assets/createOneSignalApp1.png" style="width: 2000px;"/>

- Give your OneSignal app a name, select "Web", then click on "Next: Configure Your Platform" button:
<img src="./assets/createOneSignalApp2.png" style="width: 2000px;"/>
- You will now be at the "Web Configurtion" page:
    - For "1. Choose Integration". select "Custom Code".
    - For "SITE NAME", it can be anything you want.
    - For "SITE URL", you must use the <b style='color: red'>exact url origin</b> of where you will be deploying this quickstart application to, for example something like "https://webpushnotificationsquickstart.azurewebsites.net". We will show you how to deploy to azure app service later. Web push notifications only work in trusted https protocol hence you will have to run this quickstart application in https. <i>For this quickstart we'll refer to "https://webpushnotificationsquickstart.azurewebsites.net" as the origin url where we'll deploy this application to later on. Obviously we wouldnt be able to use this URL if someone else in the world is already using it and youll use your own URL that you want to use.</i>
    - Click the "Save" button to create your OneSignal service app.
<img src="./assets/createOneSignalApp3.png" style="width: 2000px;"/>
- You will then see your OneSignal app's settings. Take note of the `appId` and `safari_web_id`. We will use these later in the front-end and back-end. Click on the "Finish" button:
<img src="./assets/createOneSignalApp4.png" style="width: 2000px;"/>
- Navigate to your "Settings" -> "Keys & IDs" menu, take note of you "Rest API Key" because we will use it later in our backend. <b style='color:red'><i>Keep this key safe in the backend only, do not share with anyone and do not send it to your client apps</i></b>:
<img src="./assets/createOneSignalApp5.png" style="width: 2000px;"/>

### Create your IncomingCall event listener Function App
We will set up an azure function app to subscribe to our ACS EventGrid IncomingCall event and then call OneSignal's "Create Notification" REST API to send the Incoming Call web push notification to the callee. In our function app will also keep a static mapping of our OneSignalRegistrationTokens to ACS communication user Ids. For the purposes of this quickstart demo and easier explanation, we will create a function app. <b><i>It is best to use a function app for this so we can call OneSignal directly from Azure so that the callee can receive the web push notification as fast as possible. Do not do this logic from a backend server or performance wont be at its best.</i></b>
- From the Azure portal, search for "function app" and click on the "+" button to create a new Function App:
<img src="./assets/createFunctionApp1.png" style="width: 1200px;"/>
- Basics options
    - Choose your ACS subscription.
    - Choose your ACS resoruce group. This is the resource that we will be subscribing to for IncomingCall events. When a user in this ACS resource makes an outgoing call or adds a participant to a call, an IncomingCall event will be emitted to our function app.
    - Give your Function App a name. Give it any name you want. <i>For this quickstart, we'll use the name "IncomingCallListener" to refer to our Function App. Obviously we wouldnt be able to use this name if someone else in the world is already using it and youll use your own name that you want to use.</i>
    - <b style='color:red'><i>For "Runtime stack" and "Version", make sure to choose NodeJS version 16LTS as we will be using Javascript in our Function app.</i></b> 
    - Choose the region where you want this function app to be deployed.
    - <b><i>For plan type, choose "App Service plan" and choose your plan. Make sure the plan is at least Basic B1. It is necessary to have this for the purpose of this quickstart because we will be setting our function app to always be on for long running testing purposes. If your function app is not running continuously, then its static OneSignalRegistrationToken to commnunicationUserId mapping will get reset every 20 minutes, and users will have to get a new one signal registration token. Hence we will set our function to always be on so that our mapping doesnt reset for testing purposes. We'll set this setting in the following step below once the function app is created.</i></b>
<img src="./assets/createFunctionApp2.png" style="width: 1000px;"/>
- Hosting options
    - Choose your azure storage account.
- Click on "Review + create" button to crete our function app. Youll be redirected to a page that will show you that your function app deployment is in progress. Wait for it it finish, it should take less than a minute. Once its completed, you can click on "Go to resource" to navigate to the function app's dashboard. The dashboard will look like so:
<img src="./assets/createFunctionApp3.png" style="width: 2000px;"/>
- Navigate to Settings Configuration menu from the left side panel, then "General settings" tab, and set "Always on" option to "On". <b><i>It is necessary to set this option to "On" this for the purpose of this quickstart so that we can do long running testing. If your function app is not running continuously, then its static OneSignalRegistrationToken to commnunicationUserId mapping will get reset every 20 minutes, and users will have to get a new one signal registration token. Hence we will set our function to always be on so that our mapping doesnt reset for testing purposes.</i></b>:
<img src="./assets/createFunctionApp4.png" style="width: 1000px;"/>
- From the left side panel under "Development tools", open "Advanced Tools". The click on "Go ->":
<img src="./assets/createFunctionApp5.png" style="width: 1000px;"/>
- A new tab will open with the Kudu tool. Go to the "Tools" -> "Zip Push Deploy" menu:
 <img src="./assets/createFunctionApp6.png" style="width: 1500px;"/>
- Then from the file explorer, drag and drop the "IncomingCallListener_FunctionApp.zip" file from this project, into the Kudu "Zip Push Deploy" UI. It will load for few seconds and then the /wwwroot folder structure should look like this:
 <img src="./assets/createFunctionApp7.png" style="width: 2000px;"/>
- The structure of the IncomingCallListener Function App is like so:
    - /HandleIncomingCallEvent (sub function)
        - function.json - config file.
        - index.js - This is the logic that will listen for the IncomingCall event from ACS EventGrid, and will then call OneSignal's "Create Notification" Rest API to deliver the Incoming Call web push notification to the callee. It will use the callee's OneSignalRegistrationToken to signal the callee's devices. We are storing the OneSignalRegistrationTokens for our users in /Shared/OneSignalRegistrationTokens.js
    - /setOneSignalRegistrationTokenForUser (sub function)
        - function.json - config file.
        - index.js - This is a REST api end point to receive OneSignalRegistrationTokens for our users. Our application server in webpack.config.js of this project, will generate the OneSignalRegistrationToken for a communicationUserId and send it here to this rest api end point which we will then store it in our mapping which is in /Shared/OneSignalRegistrationTokens.js
    - /Shared/OneSignalRegistrationTokens.js - Contains the static mapping of OneSignalRegistrationTokens to communicationUserIds. <b><i>Make sure your function app is set to "Always on" during testing purposes of this quickstart or this mapping will be reset every 20 minutes. You can set this option in "Settings Configuration" menu of the function app, then "General settings" tab. We have also explained above with a screenshot of where to set this option.</i></b>
    - <b style='color:red'><i>Important: The reason to use randomly generated OneSignal registration tokens for our communication users, is for security purposes. Do not use communication user ids to identify the end user devices for signaling. You must use randomly generated OneSignalRegistrationTokens to signal the end users. Each end user will only know about their own OneSignalRegistrationToken. Users will not know about other users' OneSignalRegistrationTokens. These tokens will be generated in our webpack.config server when creating user tokens.</i></b>
    - Edit the /HandleIncomingCallEvent/index.json file by clicking on the pencil icon:
     <img src="./assets/createFunctionApp8.png" style="width: 2000px;"/>
     - Replace the following as shown in the screenshot below:
        - Replace \<Your OneSignal REST API Key>\ with your OneSignal Rest API key which you noted down, use "Basic " before the key as shown in the screenshot.
        - Replace \<Your OneSignal app Id>\ with your OneSignal app Id which you noted down.
        - If you dont have and dont remember your rest api key and app id, you can get both of these from your OneSignal app's dashboard in the "Settings" -> "Keys & IDs" menu if you forget them.
        - Replace \<Your website's URL\> with the URL origin where you will be deploying this quickstart's front-end client and webpack.config server. The url must start with "https://". For the purposes of this quickstart demo, we are using "https://webpushnotificationsquickstart.azurewebsites.net", obviously this url doesnt belong to you, so you will enter your own, same one you specified in your OneSignal app's settings from the beginning of this quickstart.
        - Click on the "Save" button to save the changes:
    <img src="./assets/createFunctionApp9.png" style="width: 2000px;"/>
- Go to the HandleIncomingCallEvent function under your functions menu:
<img src="./assets/createFunctionApp10.png" style="width: 1200px;"/>
- Go to the integration menu:
<img src="./assets/createFunctionApp11.png" style="width: 1100px;"/>
- Under the “Trigger” box, click on “Event Grid Trigger”, then click on “Create Event Grid subscription”:
<img src="./assets/createFunctionApp12.png" style="width: 2300px;"/>
- The "Create Event Subscription" window will open and fill it out as shown below:
    - Give it any name youd like
    - For Topic Types choose “Azure Communication Services”
    - For subscription, select your Azure Communication Services subscription
    - Select your Resource Group and your Resource.
    - For “Filter to Event Types”, choose “Incoming Call”.
    - Then click create button.
<img src="./assets/createFunctionApp13.png" style="width: 800px;"/>

### Set up webpack.config.js backend web server
- Open the serverConfig.json file and fill in the required fields:
    - "connectionString" - This is your Azure Communication Services resource connecting string which will be used for generating ACS CommunicationUserTokens. You can find this connection string by going to your ACS resrouce in the azure portal and navigating to the "Settings" -> "Keys" menu:
    <img src="./assets/connectionString.png" style="width: 800px;"/>
    - "functionAppOneSignalTokenRegistrationUrl" - The format of this url is "https://\<Your function app name\>.azurewebsites.net/api/setOneSignalRegistrationTokenForUser?code=\<api key\>". You can find this url in your setOneSignalRegistrationTokenForUser sub function. Click on the "Get funtion Url" button and copy and paste it into the functionAppOneSignalTokenRegistrationUrl key in the serverConfig.json file:
    <img src="./assets/functionAppOneSignalTokenRegistrationUrl.png" style="width: 1500px;"/>
- Ensure the code line for port is like so: `const port = process.env.port || 8080;`
- Ensure `devServer` includes these options: `contentBase:'./public'` and `allowedHosts:['.azurewebsites.net']`
    - If your going to deploy the client app and webpack server app to somewhere else other than ".azurewebsites.net", you may have to adjust this setting.

### Set up client side fron-end app config
- Open the clientConfig.json file and fill in the required fields:
    - "oneSignalAppId" - Your OneSignal app id which you created earlier.
    - "oneSignalSafariWebId": Your OneSignal safari web id which you created earlier.
    - You can find both of these ids in you OneSignal dashboard under "Settings" -> "Keys & IDs" menu or you also noted them down from ealier during this step:
    <img src="./assets/createOneSignalApp4.png" style="width: 2000px;"/>
- Ensure the OneSignalSDKUpdaterWorker.js and OneSignalSDKWorker.js files are in the ./public folder.
    - Ensure they both have just this one line of code: `importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');`
- Ensure this line is commented out in ./src/index.js: `// serviceWorker.unregister();`

### Deploying the client web app and web server to Azure App Service (azurewebsites.net)
<b><i>Note: This section shows how to deploy this application to Azure App Service (azurewebsites.net). If you want to deploy to a different deployment environment other than Azure App Service, then the following steps dont apply to you and you may need to change the ./webpack.config.js and ./package.json configurations according to your deployment environment specifications.</i></b>

- This web app has been setup to be easily deployed to Azure App Service
    - ./webpack.config.js.
        - allowedHosts: Specifies that it allows this app to be hosted in "https://\<appname\>.azurewebsites.net" which is how Azure App Service hosts web apps.
        - contentBase: The folder where public assets can be served from. For example, a request to your app like GET https://\<appname\>.azurewebsites.org/file.txt, will serve the file.txt that resides in the contentBase folder. This app has this field set to the './public' folder.
    - ./package.json
        - "start-local" script. This will start the server on local machine at port 5000.
        - "build-local" script. This will build the the application in development mode
        - "start" script. Used by Azure App Service when deploying. This will start server in port 8080. Port 8080 is specified in webpack.config.js. Do not change this port when deploying to Azrue App Service becaue this is the port that Azure App Service uses.
        - "build" script. Used by Azure App Service when deploying to build the application.

- Navigate to "App Services" in your Azrue portal and create a new app service:
<img src="./assets/azureAppServiceCreate.png" style="width: 800px;"/>
- Fill in the required details:
    - For Subscription and Resrouce Group, use the same as for the ones used when you created the Function App earlier.
    - For name, use the url where you will be deploying this web app. For the purpose of this quickstart demo, we are showing "https://webpushnotificationsquickstart.azurewebsites.net". You will use your own URL which would be the same exact URL that you had used for "SITE URL" option when we created the OneSignal app from erlier.
    - For "Publish", choose "Code".
    - For "Runtime stack" choose "Node 16 LTS"
    - Choose you plan.
    <img src="./assets/azureAppServiceCreateDetails.png" style="width: 900px;"/>
- Click on "Create" button then click on "Review + create" button. The app service will start to be created. After about less than a minute, it will be created and you can click on the "Go to resource" button to navigate to the app service dashboard.
- You can go ahead and click on the "Start" button if it is not started already to start the app service:
<img src="./assets/azureAppServiceStart.png" style="width: 900px;"/>
- If the service starts successfully, you'll see a start success notification on the upper right hand side of Azure portal:
<img src="./assets/azureAppServiceStartSuccess.png" style="width: 900px;"/>
- Install the "Azure tools" and "Azure App Service" extensions for Visual Studio Code if you have not done so already:
<img src="./assets/azureExtensions.png" style="width: 800px;"/>
- Once installed, click on the Azure icon on the left side panel, and then click on "Sign in to Azure..." to log in with you same Azure account that you use for Azure Communication Services. This should be the same account that you use to provision you Azure Communication Service resource. This account should also be the acount that you had logged into the Azure portal for when we created the Azure App Service and even also the "IncomingCallListener" Function App from earlier.
- Once logged in, you should see your subscriptions. Under your subscription and under "App services", you'll find your app service you just created, in our case "webpushnotificationsquickstart". Right click on it, and select "Deploy to Web App...":
<img src="./assets/azureAppServiceDeployToWebApp.png" style="width: 600px;"/>
- On the top of the Visual Studio Code window, youll be prompted to choose a folder, select the "calling-web-push-notifications" folder, or browse to it and select it if you dont see it listed:
<img src="./assets/azureAppServiceChooseFolder.png" style="width: 600px;"/>
- If prompted to override deployment, select "Deploy":
<img src="./assets/azureAppServiceOverwritePrompt.png" style="width: 600px;"/>
- Youll see a small notification window on the bottom right side of the Visual Studio code window. Click on the blue "output window":
<img src="./assets/azureAppServiceDeployingNotification.png" style="width: 600px;"/>
- The Visual Studio Code output window will open up and you can see the current deployment status. Once deplyoment finishes successfully, youll see a final "Deployment to \<app name\> completed" message at the end of the output:
<img src="./assets/azureAppServiceDeploymentCompleted.png" style="width: 2000px;"/>
- Navigate to the app URL, in our case https://webpushnotificationsquickstart.azurewebsites.net. If you dont see the app or see errors, try restarting and redeploying the app service.










