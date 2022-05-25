const { EmailClient } = require("@azure/communication-email");

const connectionString = "<ACS_CONNECTION_STRING>";
const client = new EmailClient(connectionString);
const sender = "<SENDER_EMAIL>";
const emailContent = {
  subject: "Send email quick start test- JS sample",
  plainText: "Test Email from JS Send Email Sample Application\n\n This email is part of testing of email communication service. \\n Best wishes",
  html: "<html><head><title>ACS Email as a Service</title></head><body><h1>ACS Email as a Service - Html body</h1><h2>This email is part of testing of email communication service</h2></body></html>",
};
const toRecipients = {
  to: [
    { email: "<RECIPIENT_EMAIL>", displayName: "<RECIPIENT_DISPLAY_NAME>" },
  ],
};

async function main() {
  try {
    const emailMessage = {
      sender: sender,
      content: emailContent,
      recipients: toRecipients,
    };

    const sendResult = await client.send(emailMessage);

    if (sendResult && sendResult.messageId) {
      // check mail status, wait for 5 seconds, check for 60 seconds.
      const messageId = sendResult.messageId;
      if (messageId === null) {
        console.log("Message Id not found.");
        return;
      }

      console.log("Send email success, MessageId :", sendResult.messageId);

      let counter = 0;
      const statusInterval = setInterval(async function () {
        counter++;
        try {
          const response = await client.getSendStatus(messageId);
          if (response) {
            console.log(`Email status for {${messageId}} : [${response.status}]`);
            if (response.status.toLowerCase() !== "queued" || counter > 12) {
              clearInterval(statusInterval);
            }
          }
        } catch (e) {
          console.log("Error in checking send mail status: ",e);
        }
      }, 5000);
    } else {
      console.error("Something went wrong when trying to send this email: ", sendResult);
    }
  } catch (e) {
    console.log("################### Exception occoured while sending email #####################", e);
  }
}

main();
