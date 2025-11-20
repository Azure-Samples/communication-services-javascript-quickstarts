| page_type | languages                                   | products                                                                    |
| --------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| sample    | <table><tr><td>TypeScript</tr></td></table> | <table><tr><td>azure</td><td>azure-communication-services</td></tr></table> |

# Call Automation – Move Participants Sample

This sample demonstrates how to use the Call Automation SDK to implement a Move Participants Call scenario with Azure Communication Services.

---

## Table of Contents

- [Overview](#overview)
- [Design](#design)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running the App Locally](#running-the-app-locally)
- [Application Architecture](#application-architecture)
- [API Endpoints Reference](#api-endpoints-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

This sample demonstrates how to move participants between calls using Azure Communication Services Call Automation SDK, featuring multiple call management, participant verification, and event-driven webhooks.

---

## Design

![Move Participant](./resources/Move_Participant_Sample.jpg)

---

## Prerequisites

- Azure account with active subscription
- Azure Communication Services resource with phone number
- [Azure Dev Tunnel](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)
- [Visual Studio Code](https://code.visualstudio.com/download)
- [Node.js](https://nodejs.org/en/download)

---

## Getting Started

### Clone the Source Code

1. Open PowerShell, Windows Terminal, Command Prompt, or equivalent.
2. Navigate to your desired directory.
3. Clone the repository:
   ```sh
   git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git
   ```

### Set Up Node.js Environment and Install Dependencies

```bash
cd communication-services-javascript-quickstarts/callautomation-multiple-dial-out
npm install
```

## Setup and Host Azure Dev Tunnel

```
# Install Dev Tunnel CLI (if not already installed)
# Dev Tunnel CLI comes with Visual Studio or can be installed separately

# Authenticate with Azure
devtunnel login

# Create and start a tunnel
devtunnel host -p 7006
```

---

## Configuration

Before running the application, create/open the `.env` file to configure the following settings:

| Setting                       | Description                                                                                                                                          | Example Value                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `PORT`                        | The port number where the application will listen.                                                                                                   | `8080`                                                                   |
| `CONNECTION_STRING`           | The connection string for your Azure Communication Services resource. Find this in the Azure Portal under your resource's "Keys" section.            | `"endpoint=https://<RESOURCE>.communication.azure.com/;accesskey=<KEY>"` |
| `CALLBACK_URI`                | The base URL where your app will listen for incoming events from Azure Communication Services. For local development, use your Azure Dev Tunnel URL. | `"https://<your-dev-tunnel>.devtunnels.ms"`                              |
| `ACS_INBOUND_PHONE_NUMBER`    | The Azure Communication Services phone number used to receive inbound calls. Must be configured in your ACS resource.                                | `"+1425XXXAAAA"`                                                         |
| `ACS_OUTBOUND_PHONE_NUMBER`   | The Azure Communication Services phone number used to make outbound calls. Must be purchased and configured in your ACS resource.                    | `"+1425XXXAAAA"`                                                         |
| `USER_PHONE_NUMBER`           | The phone number of the external user to initiate the first call. Any valid phone number for testing.                                                | `"+1425XXXAAAA"`                                                         |
| `ACS_TEST_IDENTITY_2`         | An Azure Communication Services user identity, generated using the ACS web client or SDK, used for testing participant movement.                     | `"8:acs:<GUID>"`                                                         |
| `ACS_TEST_IDENTITY_3`         | Another ACS user identity, generated similarly, for additional test scenarios.                                                                       | `"8:acs:<GUID>"`                                                         |
| `COGNITIVE_SERVICES_ENDPOINT` | Cognitive service endpoint for additional features.                                                                                                  | `"https://<RESOURCE>.cognitiveservices.azure.com/"`                      |

### Key Configuration Steps

- **CONNECTION_STRING:** Get from Azure Portal → Communication Services → Keys & Connection String
- **CALLBACK_URI:** Use your Azure Dev Tunnel public URL
- **Phone Numbers:** Configure in Communication Services → Phone numbers
- **ACS Test Identities:** Generate using ACS SDK or web client

#### Example `.env` file

```
PORT=8080
CONNECTION_STRING="endpoint=https://<RESOURCE>.communication.azure.com/;accesskey=<KEY>"
CALLBACK_URI="https://<your-dev-tunnel>.devtunnels.ms"
ACS_INBOUND_PHONE_NUMBER="+1425XXXAAAA"
ACS_OUTBOUND_PHONE_NUMBER="+1425XXXAAAA"
USER_PHONE_NUMBER="+1425XXXAAAA"
ACS_TEST_IDENTITY_2="8:acs:<GUID>"
ACS_TEST_IDENTITY_3="8:acs:<GUID>"
COGNITIVE_SERVICES_ENDPOINT="https://<RESOURCE>.cognitiveservices.azure.com/"
```

---

## Running the App Locally

1. **Create an azure event grid subscription for incoming calls:**

   - Set up a Web hook(`https://<dev-tunnel-url>/api/MoveParticipantEvent`) for callback.
   - Add Filters:
     - Key: `data.From.PhoneNumber.Value`, operator: `string contains`, value: `USER_PHONE_NUMBER, ACS_INBOUND_PHONE_NUMBER`
     - Key: `data.to.rawid`, operator: `string does not begin`, value: `8`
   - Deploy the event subscription.

2. **Run the Application:**

   - Navigate to the `callautomation-multiple-dial-out` folder.
   - Run `npm run dev` in PowerShell or Terminal.
   - Browser should open automatically to Swagger UI at `http://localhost:8080/`

3. **Workflow Execution**

> **Note:**  
> The phone numbers and identities referenced below are configured in `.env` file:
>
> - `USER_PHONE_NUMBER`
> - `ACS_INBOUND_PHONE_NUMBER`
> - `ACS_OUTBOUND_PHONE_NUMBER`
> - `ACS_TEST_IDENTITY_2`
> - `ACS_TEST_IDENTITY_3`
>   The phone numbers are released and available when the call is answered as they are created in ACS resource in Azure.
>
> **Call 2 and Call 3 must be answered after redirecting and before moving participants.**

#### Call 1

1. `USER_PHONE_NUMBER` calls `ACS_INBOUND_PHONE_NUMBER`. Note the Call connection Id as **Target Call Connection Id** when the call is created.
2. Call Automation answers the call and assigns a bot to the call as receiver.
3. `ACS_INBOUND_PHONE_NUMBER` is freed from the call after the call was answered and assigned to a bot.

#### Call 2

1. `ACS_INBOUND_PHONE_NUMBER` makes a call to `ACS_OUTBOUND_PHONE_NUMBER`. Note the Call connection Id as **Source Call Connection Id** when the call is created.
2. Call Automation answers the call and redirects to `ACS_TEST_IDENTITY_2`, then releases `ACS_OUTBOUND_PHONE_NUMBER` from the call. The call connection id generated here is an internal connection id; do not consider this connection id during the Move operation.

Move Participant operation:

- Inputs:
  - Source Connection Id (from Call 2) to move the participant from.
  - Target Connection Id (from Call 1) to move the participant to.
  - Participant (initial participant before call is redirected) from Source call (Call 2): `ACS_OUTBOUND_PHONE_NUMBER`
- **Participants list after `MoveParticipantSucceeded` event:** 3

#### Call 3

1. `ACS_INBOUND_PHONE_NUMBER` makes a call to `ACS_OUTBOUND_PHONE_NUMBER`. Note the Call connection Id as **Source (to move) Call Connection Id** when the call is created.
2. Call Automation answers the call and redirects to `ACS_TEST_IDENTITY_3`, then releases `ACS_OUTBOUND_PHONE_NUMBER` from the call. The call connection id generated here is an internal connection id; do not consider this connection id during the Move operation.

Move Participant operation:

- Inputs:
  - Source Connection Id (from Call 3) to move the participant from.
  - Target Connection Id (from Call 1) to move the participant to.
  - Participant (initial participant before call is redirected) from Source call (Call 3): `ACS_OUTBOUND_PHONE_NUMBER`
- **Participants list after `MoveParticipantSucceeded` event:** 4

---

## Application Architecture

### Application Components

**Backend (Express.js):**

- Manages three call types: User→ACS, ACS→Test Identity 2, ACS→Test Identity 3
- Handles call events, participant movement, and call termination
- Provides REST API for frontend interaction

**API Interface (Swagger UI):**

- Interactive API documentation and testing interface
- Real-time endpoint testing with request/response examples
- Professional API documentation with schema definitions

## API Endpoints Reference

| Endpoint                    | Method | Purpose                                   |
| --------------------------- | ------ | ----------------------------------------- |
| `/`                         | GET    | Redirect to Swagger UI (main interface)   |
| `/api-docs`                 | GET    | Interactive Swagger API documentation     |
| `/userCallToCallAutomation` | GET    | Create initial user call                  |
| `/createCall2`              | GET    | Create call for Test Identity 2           |
| `/createCall3`              | GET    | Create call for Test Identity 3           |
| `/moveParticipant2`         | GET    | Move participant from Call 2 to Call 1    |
| `/moveParticipant3`         | GET    | Move participant from Call 3 to Call 1    |
| `/terminateCalls`           | GET    | Terminate all active calls                |
| `/call-data`                | GET    | Get current call status (JSON)            |
| `/api/moveParticipantEvent` | POST   | Webhook: Handle incoming call events      |
| `/api/callbacks`            | POST   | Webhook: Handle call automation callbacks |

---

## API Testing with Swagger

You can explore and test the available API endpoints using the built-in Swagger UI:

- **Swagger URL:**  
  [https://localhost:8080/](https://localhost:8080/)

- > If running on a dev tunnel or cloud environment, replace `localhost:8080` with your tunnel's public URL (e.g., `https://<your-dev-tunnel>.devtunnels.ms/`).

---

## Troubleshooting

**Common Issues:**

- **Connection Problems:** Verify `CONNECTION_STRING` from Azure Portal
- **Callback Issues:** Ensure Dev Tunnel is running and `CALLBACK_URI` matches tunnel URL
- **Phone Numbers:** Confirm numbers are purchased and properly formatted in ACS resource
- **Test Identities:** Regenerate ACS identities if invalid
- **Dependencies:** Clear npm cache and reinstall if modules are missing

**Need Help?**

- [Azure Communication Services Documentation](https://learn.microsoft.com/azure/communication-services/)
- [Microsoft Q&A Forum](https://learn.microsoft.com/answers/topics/azure-communication-services.html)
