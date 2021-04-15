async function main() {
    const { PhoneNumbersClient } = require('@azure/communication-phone-numbers');

    /* This code demonstrates how to fetch your connection string from an environment variable. */
    const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];

    /* Instantiate the phone numbers client */
    const phoneNumbersClient = new PhoneNumbersClient(connectionString);

    /* Search for Available Phone Number */

    /* Create search request */
    const searchRequest = {
        countryCode: "US",
        phoneNumberType: "tollFree",
        assignmentType: "application",
        capabilities: {
            sms: "outbound",
            calling: "none"
        },
        areaCode: "833",
        quantity: 1
    };

    const searchPoller = await phoneNumbersClient.beginSearchAvailablePhoneNumbers(searchRequest);

    /* The search is underway. Wait to receive searchId. */
    const { searchId, phoneNumbers } = await searchPoller.pollUntilDone();

    const phoneNumber = phoneNumbers[0];

    console.log(`Found phone number: ${phoneNumber}`);
    console.log(`searchId: ${searchId}`);

    /* Purchase Phone Number*/

    const purchasePoller = await phoneNumbersClient.beginPurchasePhoneNumbers(searchId);

    /* Purchase is underway. */
    await purchasePoller.pollUntilDone();
    console.log(`Successfully purchased ${phoneNumber}`);

    /* Update Phone Number Capabilities*/

    /* Create update request. */
    /* This will update phone number to send and receive sms, but only send calls.*/
    const updateRequest = {
        sms: "inbound+outbound",
        calling: "outbound"
    };

    const updatePoller = await phoneNumbersClient.beginUpdatePhoneNumberCapabilities(
        phoneNumber,
        updateRequest
    );

    /* Update is underway. */
    await updatePoller.pollUntilDone();
    console.log("Phone number updated successfully.");

    /* Get Purchased Phone Number */
    const { capabilities } = await phoneNumbersClient.getPurchasedPhoneNumber(phoneNumber);
    console.log(`These capabilities: ${capabilities}, should be the same as these: ${updateRequest}.`);

    const phoneNumberss = await phoneNumbersClient.listPurchasedPhoneNumbers();

    for await (const purchasedPhoneNumber of phoneNumberss) {
        console.log(`Phone number: ${purchasedPhoneNumber.phoneNumber}, country code: ${purchasedPhoneNumber.countryCode}.`);
    }

    /* Release Purchased Phone Number */
    const releasePoller = await phoneNumbersClient.beginReleasePhoneNumber(phoneNumber);

    /* Release is underway. */
    await releasePoller.pollUntilDone();
    console.log("Successfully release phone number.");
}

main();