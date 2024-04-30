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
   * This is an array of {@link CommunicationIdentifiers}. These can be mixed of ACS, Teams, and phone numbers.
   */
  targetCallees: [
    {
      phoneNumber: '<Enter your phone number to call here>', rawId: '4:<Enter your phone number to call here>'
    }
  ],

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
