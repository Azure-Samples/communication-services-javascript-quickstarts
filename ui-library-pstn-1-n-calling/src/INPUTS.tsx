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
  userIdentity: '<Azure Communication Services Identifier>',
  userToken: '<Azure Communication Services Access Token>',

  /**
   * Who the user is calling.
   * This is an array of phone numbers if you want to call a PSTN number. For example, `['+18001234567']`.
   * Or an array of identifiers for other ACS users you wish to call. For example, `['8:acs:dd9753c0-6e62-4f74-ab0f-c94f9723b4eb_00000018-11f6-813b-7137-8e3a0d004b5d']`.
   */
  callLocator: {
    participantIds: ['<Phone number or ACS identifier>']
  },

  /**
   * Display name for your user making the outbound call. This will be transmitted to the other ACS users in the call.
   */
  displayName: '<Display name for your user>',

  /**
   * Your Azure Communication Services provided phone number. This only needs supplied if you want to call a PSTN number.
   * Read more about procuring a phone number from Azure:
   * https://docs.microsoft.com/en-us/azure/communication-services/quickstarts/telephony/get-phone-number
   */
  callerId: '<Azure Communication Services provided Phone Number>',
}
