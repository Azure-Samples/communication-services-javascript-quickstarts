| page_type | languages                                    | products                                                                    |
| --------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Sample    | <table><tr><td>Java Script</tr></td></table> | <table><tr><td>azure</td><td>azure-communication-services</td></tr></table> |

# Call Automation - Lobby Call Support Client Sample

This sample demonstrates how to use Azure Communication Services (ACS) to establish a call between two ACS users and manage lobby call participants. The client allows a target call user to accept or reject lobby users who request to join an ongoing call. Communication with the server is handled via WebSocket.

## Features

- Initiate a call between two ACS users.
- Receive lobby join requests and accept or reject them in real time.
- Communicate with a backend server using WebSocket for lobby notifications.
- Integrates with the [DotNet-LobbyCallSupportSample server](https://github.com/Azure-Samples/communication-services-dotnet-quickstarts/tree/users/v-kuppu/LobbyCallSupportSample/LobbyCallSupportSample).

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- An Azure Communication Services resource
- Access to the [DotNet-LobbyCallSupportSample server](https://github.com/Azure-Samples/communication-services-dotnet-quickstarts/tree/users/v-kuppu/LobbyCallSupportSample/LobbyCallSupportSample)

## Getting Started

### 1. Clone the Repository
`git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git`.

### 2. Install Dependencies
```bash
   npm install
   ```

### 3. Configure Environment Variables

- Copy `.env.example` to `.env`:
```bash
   cp .env.example .env
   ```
- Edit `.env` and set the following:
  - `WEBSOCKET_URL`: The WebSocket server URL for lobby notifications.
```
WEBSOCKET_URL=ws://your-websocket-server-url/ws
```

### 5. Usage

1. Run the application with `npx webpack serve --config webpack.config.js`.
2. Open the url shown(http://localhost:<port-number>) in browser.
3. Enter the target call sender's token and the receiver's user ID.
4. Click **Start Call** to initiate a call.
5. To simulate a lobby call, use another ACS test client (e.g., [ACS Sample App](https://acssampleapp.azurewebsites.net/)) and enter the receiver's user ID.
6. When a lobby user requests to join, a confirmation dialog will appear. Accept or reject the request.
7. The client communicates your decision to the server via WebSocket.

> **Tip:** Keep the browser's Developer Console open to view WebSocket alerts, debug messages and to not suppress alerts.
