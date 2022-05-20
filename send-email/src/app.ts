import { EmailSender } from "./emailSender";
import { EmailTemplate } from "./emailTemplate";
var configuration = require('../config.js');
let data: [EmailTemplate] = require('../data/data.json');

const client = new EmailSender(configuration.Connectionstring);

main();

async function main() {
    try {
        console.log('Email communication service - send email scenarios\n==================================================');

        var tasks = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            tasks[i] = new Promise((resolve) =>
                client.sendEmail(data[i]));
        }
        const results = await Promise.all(tasks);
    }
    catch (e) {
        console.log('################### Exception occurred while sending email #####################')
        console.log(e)
    }
}
