const { EmailClient, KnownEmailSendStatus } = require("@azure/communication-email");
const fs = require("fs");

const connectionString = "<ACS_CONNECTION_STRING>";
const senderAddress = "<SENDER_EMAIL_ADDRESS>"
const recipientAddress = "<RECIPIENT_EMAIL_ADDRESS>"

async function main() {
  const POLLER_WAIT_TIME = 10

  jpgAttachmentPath = __dirname + "\\inline-attachment.jpg";
  pngAttachmentPath = __dirname + "\\inline-attachment.png";

  const message = {
    senderAddress: senderAddress,
    recipients: {
      to: [{ address: recipientAddress }],
    },
    content: {
      subject: "Test email from JS Sample",
      plainText: "This is plaintext body of test email.",
      html: "<html><h1>HTML body inline images:</h1><img src=\"cid:kittens-1\" /><img src=\"cid:kittens-2\" /></html>",
    },
    attachments: [
      {
        name: "inline-attachment.jpg",
        contentId: "kittens-1",
        contentType: "image/jpeg",
        contentInBase64: fs.readFileSync(pngAttachmentPath).toString("base64"),
      },
      {
        name: "inline-attachment.png",
        contentId: "kittens-2",
        contentType: "image/png",
        contentInBase64: fs.readFileSync(jpgAttachmentPath).toString("base64"),
      }
    ],
  }

  try {
    const client = new EmailClient(connectionString);

    const poller = await client.beginSend(message);

    if (!poller.getOperationState().isStarted) {
      throw "Poller was not started."
    }

    let timeElapsed = 0;
    while(!poller.isDone()) {
      poller.poll();
      console.log("Email send polling in progress");

      await new Promise(resolve => setTimeout(resolve, POLLER_WAIT_TIME * 1000));
      timeElapsed += 10;

      if(timeElapsed > 18 * POLLER_WAIT_TIME) {
        throw "Polling timed out.";
      }
    }

    if(poller.getResult().status === KnownEmailSendStatus.Succeeded) {
      console.log(`Successfully sent the email (operation id: ${poller.getResult().id})`);
    }
    else {
      throw poller.getResult().error;
    }
  }
  catch(ex) {
    console.error(ex);
  }
}

main();