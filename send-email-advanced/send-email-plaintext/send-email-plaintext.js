const { EmailClient } = require("@azure/communication-email");

const connectionString = "<ACS_CONNECTION_STRING>";
const sender = "<SENDER_EMAIL>";
const toRecipients = {
    to: [
        { email: "<alice@contoso.com>", displayName: "Alice" },
    ],
};

const client = new EmailClient(connectionString);
const emailContent = {
    subject: "Send email plain text - JS sample",
  plainText: "Test Email from JS Send Email Sample Application\n\n This email is part of testing of email communication service. \\n Best wishes",
  html: "",
};

async function main() {
  try {
    const emailMessage = {
      sender: sender,
      content: emailContent,
      importance: 'low',
      recipients: toRecipients,
    };

    const sendResult = await client.send(emailMessage);

    if (sendResult && sendResult.messageId) {
        const messageId = sendResult.messageId;     
        if (messageId === null || messageId === undefined) {
        console.log("Message Id not found.");
        return;
      }

      console.log("Send email success, MessageId :", messageId);

      let counter = 0;
      const statusInterval = setInterval(async function () {
        counter++;
        try {
          const sendStatusResult = await client.getSendStatus(messageId);
            if (sendStatusResult) {
                console.log(`Email status for {${messageId}} : [${sendStatusResult.status}]`);
                if (sendStatusResult.status.toLowerCase() !== "queued" || counter > 12) {
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
      console.log("################### Exception occurred while sending email #####################", e);
  }
}

main();