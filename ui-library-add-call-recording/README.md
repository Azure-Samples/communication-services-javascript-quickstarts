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


## Local development

- Build the static app:
  ```cd app && npm run build```

- Serve the backend API as well as the static app:
  ```swa --api-location ./api ./app/build```