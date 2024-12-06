const { EmailClient, KnownEmailSendStatus } = require("@azure/communication-email");

const connectionString = "<ACS_CONNECTION_STRING>";
const senderAddress = "<SENDER_EMAIL_ADDRESS>"
const recipientAddress = "<RECIPIENT_EMAIL_ADDRESS>"

async function main() {
  const POLLER_WAIT_TIME = 10

  const message = {
    senderAddress: senderAddress,
    recipients: {
      to: [{ address: recipientAddress }],
    },
    content: {
      subject: "Test email from JS Sample",
      plainText: "This is plaintext body of test email.",
      html: "<html><h1>This is the html body of test email.</h1></html>",
    },
  }

  try {
    const client = new EmailClient(connectionString);

    const originalPoller = await client.beginSend(message);

    // The serialized poller can be stored somewhere (like a database) and used to re-intialize the poller later on.
    // This can be helpful if you want to check the message status from a different process.
    const serializedPoller = originalPoller.toString();

    const resumedPoller = await client.beginSend(undefined, {resumeFrom: serializedPoller});

    let timeElapsed = 0;
    while(!resumedPoller.isDone()) {
      resumedPoller.poll();
      console.log("Email send polling in progress");

      await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
      timeElapsed += 10;

      if(timeElapsed > 18 * POLLER_WAIT_TIME) {
        throw "Polling timed out.";
      }
    }

    if(resumedPoller.getResult().status === KnownEmailSendStatus.Succeeded) {
      console.log(`Successfully sent the email (operation id: ${resumedPoller.getResult().id})`);
    }
    else {
      throw resumedPoller.getResult().error;
    }
  }
  catch(ex) {
    console.error(ex);
  }
}

main();
