# UI Library Sample - File Sharing using UI Components

Please follow the below steps to run the project locally.
- Run `npm install`
- Follow the steps inside `api/README.md` to configure and start the azure function.
- Follow the steps inside `app/README.md` to configure and start the react app.
- Run `npm run start:dev` which starts serving both the azure function and react app through a proxy server. This allows the react app to access the azure function using relative links. It also prevents CORS and HTTPS errors.

The project can then be accessed on `localhost:4280`