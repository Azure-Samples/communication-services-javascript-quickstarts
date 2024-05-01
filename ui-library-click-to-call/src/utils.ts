import {
  MicrosoftTeamsAppIdentifier,
  CommunicationUserIdentifier,
} from "@azure/communication-common";

/**
 * Helper function to check if the user id is valid.
 */
export const isValidUserId = (userId: CommunicationUserIdentifier): boolean => {
  if (userId.communicationUserId.includes("8:acs:")) {
    return true;
  }
  return false;
};

/**
 * Helper function to check if the Teams app id is valid.
 */
export const isValidTeamsAppId = (
  teamsAppId: MicrosoftTeamsAppIdentifier
): boolean => {
  if (teamsAppId.teamsAppId) {
    return true;
  }
  return false;
};

/**
 * Helper function to check if the token is valid. If they have changed the value of the
 * token from the default value, it is considered valid and contoso should validate their token if issues
 * persist.
 */
export const isValidToken = (token: string): boolean => {
  if (token.includes("Teams")) {
    return false;
  }
  return true;
};
