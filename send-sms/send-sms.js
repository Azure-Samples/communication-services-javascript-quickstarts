const {SmsClient} = require('@azure/communication-sms');

// This code demonstrates how to fetch your connection string
// from an environment variable.
const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];

// Instantiate the SMS client
const smsClient = new SmsClient(connectionString);

async function main(){
    const sendResults = await smsClient.send({
      from: "<from-phone-number>",
      to: ["<to-phone-number-1>", "<to-phone-number-2>"],
      message: "Hello World 👋🏻 via SMS"
      });
    
      // individual messages can encounter errors during sending
      // use the "successful" property to verify
      for (const sendResult of sendResults) {
        if (sendResult.successful) {
          console.log("Success: ", sendResult);
        } else {
          console.error("Something went wrong when trying to send this message: ", sendResult);
        }
      }
}

main();