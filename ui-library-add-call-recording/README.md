# Azure Communication Services calling application with call recording

Currently just has boilerplate:

- `app/` contains a basic static React app
- `api/` contains the two Azure Functions APIs stubbed out

## Prerequisites

This sample uses the [local development server for Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/local-development).

Install the local development server by running

```
npm install -g @azure/static-web-apps-cli
```

## Install dependencies

- Install dependencies of Azure Static Web Apps
  `npm install`
- Install dependencies of front-end application
  `cd app && npm install`

## Local development

The setup allows you to debug each service separately, but requires some orchestration. You'll need three terminals:

- Start the azure functions backend:
  `cd api && func start`
- Start the static app server:
  `cd app && npm start`
- Start the Static Web Apps proxy (this assumes that default ports were used to run the servers in the previous steps):
  `npm run start:dev`

In either case, navigate to your app at `localhost:4280`.
