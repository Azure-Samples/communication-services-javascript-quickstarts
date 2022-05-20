import { EmailTemplate } from "./emailTemplate";
import { EmailClient, SendEmailResult, SendStatusResult } from "@azure/communication-email";
import { EmailAddress, EmailAttachment, EmailAttachmentType, EmailContent, EmailImportance, EmailMessage, EmailRecipients } from "@azure/communication-email";
import fs from 'fs';

export class EmailSender {
    private readonly emailClient: EmailClient;

    constructor(connectionString: string) {
        this.emailClient = new EmailClient(connectionString);
    }

    private getEmailAttachment(attachmentPath: string) {
        let name: string = attachmentPath.split('.')[0].split('//')[1] + '.' + attachmentPath.split('.')[1];
        let attachmentType: string = attachmentPath.split('.')[1];

        type emailAttachmentType = EmailAttachmentType;
        function getAttachmentType(param: emailAttachmentType) {
            return param;
        }

        try {
            var buff = fs.readFileSync(attachmentPath);
            let contentBytesBase64 = buff.toString('base64');

            let attachment: EmailAttachment = {
                contentBytesBase64: contentBytesBase64,
                attachmentType: getAttachmentType(attachmentType as emailAttachmentType),
                name: name
            }
            return attachment;
        }
        catch (e) {
            console.log(e)
        }
    }

    private processEmailRecipients(emailRecipient: string) {
        const emailAddresses: EmailAddress[] = [];
        try {
            var recipients = emailRecipient.split(";");
            recipients.forEach(recipient => {
                var details = recipient.split(",");
                if (details.length == 2 && details[0] && details[1]) {
                    emailAddresses.push({
                        email: details[0],
                        displayName: details[1]
                    });
                }
            })
            const emailRecipients: EmailRecipients = { to: emailAddresses };

            return emailRecipients;
        }
        catch (e) {
            console.log(e)
        }
    }

    public async sendEmail(emailTemplate: EmailTemplate) {
        try {

            console.log('Sending email for : '+ emailTemplate.TemplateName);
            
            var emailRecipients = this.processEmailRecipients(emailTemplate.Recipients);

            const emailAttachments: EmailAttachment[] = [];
            if (emailTemplate.Attachments) {
                var attachments = emailTemplate.Attachments.split(';');  // assuming the attachments are separated by semicolon only
                attachments.forEach(path => {
                    var attachmentResult = this.getEmailAttachment(path.trim())
                    emailAttachments.push(attachmentResult)
                });
            }

            //Setting email Importance
            let importance: EmailImportance;
            type emailImportanceType = EmailImportance;
            function getEmailImportance(param: emailImportanceType) {
                return param;
            }

            if (emailTemplate.Importance) {
                importance = getEmailImportance(emailTemplate.Importance.toLowerCase() as emailImportanceType)
            }
            else {
                importance = "normal"
            }

            // Setting Email content as PlainText/ HTML
            let emailContent: EmailContent =
            {
                subject: emailTemplate.Subject,
                html: emailTemplate.HTMLText,
                plainText: emailTemplate.PlainText
            }

            const emailMessage: EmailMessage = {
                sender: emailTemplate.Sender,
                content: emailContent,
                importance: importance,
                recipients: emailRecipients,
                attachments: emailAttachments
            };

            let response = await this.emailClient.send(emailMessage);
            await this.CheckEmailStatus(response, emailTemplate.TemplateName)
        }
        catch (e) {
            console.log(`Failed to send email: ${emailTemplate.TemplateName}--> ${e}`);
        }
    }

    public async CheckEmailStatus(response: SendEmailResult, emailTemplate: string) {
        const messageId = response.messageId;

        if (messageId === null) {
            console.log("Message Id not found.")
            return
        }

        const context = this
        let counter = 0

        const statusInterval = setInterval(async function () {
            counter++;
            const response = await context.emailClient.getSendStatus(messageId);

            if (response) {
                console.log(`Email send status for ${emailTemplate} :: [${response.status}]`)
                if (response.status.toLowerCase() !== "queued" || counter > 12) {
                    clearInterval(statusInterval)
                }
            }
        }, 5000)
    }
}