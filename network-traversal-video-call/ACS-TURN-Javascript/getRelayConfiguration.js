// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
* @summary Get a Relay configuration
*/

const { CommunicationIdentityClient } = require("@azure/communication-identity");
const { CommunicationRelayClient } = require("@azure/communication-network-traversal");

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();

// You will need to set this environment variables or edit the following values
const connectionString =
  process.env["COMMUNICATION_CONNECTION_STRING"] || "<communication service connection string>";

async function getConfig() {
  const identityClient = new CommunicationIdentityClient(connectionString);
  const user = await identityClient.createUser();
  const relayClient = new CommunicationRelayClient(connectionString);
  const config = await relayClient.getRelayConfiguration(user);
  var servers = (await config).iceServers;
  return servers;
}

module.exports.getConfig = getConfig;
 