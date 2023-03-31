import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { SmsClient }  from "@azure/communication-sms"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    //Parse Query Parameters
    let to = req.query.phoneNumber; // Get phone number to send SMS to
    let urlToShorten =  req.query.url; // Get URL to shorten

    //Get short URL from Azure URL Shortener
    const body =  JSON.stringify({ "Url": urlToShorten})
    const urlShortener = process.env.URL_SHORTENER
    await fetch(urlShortener, {
      method: 'POST',
      body: body
    })
    .then(res => res.json())
    .then(async data => {
      const url = data["ShortUrl"]
      const connectionString =  process.env.ACS_CONNECTIONSTRING
      const phoneNumberFrom = process.env.ACS_PHONE_NUMBER
      const smsClient = new SmsClient(connectionString);
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