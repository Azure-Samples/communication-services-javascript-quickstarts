# Azure Communication Network Traversal sample

### Prerequisites
- You need Node.js
- Firefox, Edge or Chrome
- Computer with video camera
- A Communication Services resource to get the Connection String.

### Installing

- In an Administrator Powershell go to the sample dir and install the following

npm install

## Setup
- Create a Communication Services resource using your personal subscription. See here for details:
https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/create-communication-resource?tabs=windows&pivots=platform-azp
- Go to the .env (rename sample.env to .env) file of the sample and change the value of COMMUNICATION_CONNECTION_STRING to your connection string (from the Communication Services resource)

## Usage

- Execute: node .\index.js
- Open your browser, if you are using Mozilla, in the search bar type about:config and search for relay and change it's value to true
- Open two tabs and go to http://localhost:3000/ in both of them
- Click get video on both tabs and allow the browser to use your camera and audio
- Click call and you should see the stream (two videos on the same tab)


SDK code: https://github.com/Azure/azure-sdk-for-js/tree/master/sdk/communication/communication-network-traversal