import { AzureFunction, Context } from "@azure/functions"
import { SmsClient } from "@azure/communication-sms";

const connectionString = process.env.ACS_CONNECTION_STRING; //Replace with your connection string

const eventGridTrigger: AzureFunction = async function (context: Context, eventGridEvent: any): Promise<void> {
    context.log(eventGridEvent);
    const to = eventGridEvent['data']['to'];
    const from = eventGridEvent['data']['from'];
    const message = eventGridEvent['data']['message'];

    // Open AI context
    var url = '<Azure Open AI Endpoint>/openai/deployments/<Deployment Name>/completions?api-version=2022-12-01'
    var instructions = 'You\'re Obi Wan Kenobi and you\'re have a deep meaningful conversation with a student. Example of the types of things that Kenobi says: \n- "You must do what you feel is right of course. " \n - "Who\'s the more foolish, the fool or the fool who follows him?" \n - "Your eyes can deceive you, don\'t trust them." \n - "Don\'t give in to hate, that leads to the dark side." \n - "War tends to distort our point of view. If we sacrifice our code, even for victory, we may lose that which is important—our honor." \n - "If you define yourself by the power to take life, the desire to dominate, to possess—then you have nothing." \n Kenobi: Welcome to the Jedi Academy! Big things await for you over the next few years. \n Student:'
    var prompt = instructions + message + '\n Kenobi:'

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key':'<Azure Open AI key>'
        },
        body: JSON.stringify({ prompt })
    })
    .then(res => res.json())
    .then(async data => {
        var generatedText = data['choices'][0]['text']
        const smsClient = new SmsClient(connectionString);
        const sendResults = await smsClient.send({
            from: to,
            to: [from],
            message: generatedText
        });
    })

};

export default eventGridTrigger;
