/// This file contains the inputs you must supply to run the quickstart.
/// In a production application, you would not hardcode these values, but instead
/// obtain them from your backend service.

export const INPUTS = {
  /**
   * Authentication information needed for your client application to use
   * Azure Communication Services.
   *
   * For this quickstart, you can obtain these from the Azure portal as described here:
   * https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/identity/quick-create-identity
   *
   * In a real application, your backend service would provide these to the client
   * application after the user goes through your authentication flow.
   */
  userIdentity: "<Azure Communication Services Identifier>",
  userToken: "<Azure Communication Services Access Token>",

  /**
   * Who the user is calling.
   *
   * For the current beta, the user can only be transferred by a Teams user in a 1 on 1 call.
   * The current beta version of AzureCommunicationCallAdapter only supports calling one Teams user so only
   * one Teams user id should be entered in the participantIds array.
   * For example, `['8:acs:dd9753c0-6e62-4f74-ab0f-c94f9723b4eb_00000018-11f6-813b-7137-8e3a0d004b5d']`.
   * A Teams user can also be contacted if the Teams user is a call agent of a call queue. In that case, the call queue
   * id or phone number should be entered in the participantIds array.
   */
  targetCallees: ["<One Teams user id>"],
  /**
   * Display name for your user making the outbound call. This will be transmitted to the other ACS users in the call.
   */
  displayName: "<Display name for your user>",
};
