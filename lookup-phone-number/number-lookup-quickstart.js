async function main() {
    const { PhoneNumbersClient } = require('@azure/communication-phone-numbers');

    // This code retrieves your connection string from an environment variable
    const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];

    // Instantiate the phone numbers client
    const phoneNumbersClient = new PhoneNumbersClient(connectionString);

    // Use the free number lookup functionality to get number formatting information
    let formattingResults = await phoneNumbersClient.searchOperatorInformation([ "<target-phone-number>" ]);
    let formatInfo = formattingResults.values[0];
    console.log(formatInfo.phoneNumber + " is formatted " + formatInfo.internationalFormat + " internationally, and "
        + formatInfo.nationalFormat + " nationally");

    // Use the paid number lookup functionality to get operator specific details
    // IMPORTANT NOTE: Invoking the method below will incur a charge to your account
    let searchResults = await phoneNumbersClient.searchOperatorInformation([ "<target-phone-number>" ], { "includeAdditionalOperatorDetails": true });
    let operatorInfo = searchResults.values[0];
    console.log(operatorInfo.phoneNumber + " is a " + (operatorInfo.numberType ? operatorInfo.numberType : "unknown") + " number, operated in "
        + operatorInfo.isoCountryCode + " by " + (operatorInfo.operatorDetails.name ? operatorInfo.operatorDetails.name : "an unknown operator"));
}

main();
