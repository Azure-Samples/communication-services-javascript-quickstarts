import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { SmsClient }  from "@azure/communication-sms"

// Initialize required variables
const connectionString =  process.env.ACS_CONNECTIONSTRING
const phoneNumberFrom = process.env.ACS_PHONE_NUMBER
const urlShortener = process.env.URL_SHORTENER

// Instantiate the SMS client.
const smsClient = new SmsClient(connectionString);

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let to = req.query.phoneNumber; // Get phone number to send SMS to
    let urlToShorten =  req.query.url; // Get URL to shorten
    const body =  JSON.stringify({ "Url": urlToShorten})

    await fetch(urlShortener, {
      method: 'POST',
      body: body
    })
    .then(res => res.json())
    .then(async data => {
      const url = data["ShortUrl"]
      const sendResults = await smsClient.send({
        from: phoneNumberFrom,
        to: [to],
        message: "Join your scheduled appointment here: " + url
      }, {
        enableDeliveryReport: true
      });

      // Individual messages can encounter errors during sending.
      // Use the "successful" property to verify the status.
      for (const sendResult of sendResults) {
        if (sendResult.successful) {
          console.log("Success: ", sendResult);
        } else {
          console.error("Something went wrong when trying to send this message: ", sendResult);
        }
      }
      context.res = {
        // status: 200, /* Defaults to 200 */
        body: url
      };
    })

};

export default httpTrigger;