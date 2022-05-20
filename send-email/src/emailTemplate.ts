export interface EmailTemplate {
    Id: string;
    TemplateName: string;
    Subject: string;
    PlainText: string;
    HTMLText: string;
    Sender: string;
    Recipients: string;
    Importance?: string;
    Attachments?: string;
}
