using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.Azure.EventGrid;
using System.Linq;
using Newtonsoft.Json.Linq;
using Microsoft.Azure.EventGrid.Models;

// https://communication-services-javascript-694ggr9pjh4gv5-7071.githubpreview.dev/api/onRecordingFileStatusUpdated

namespace Contoso
{
    public static class onRecordingFileStatusUpdated
    {
        [FunctionName("onRecordingFileStatusUpdated")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            log.LogInformation($"onRecordingFileStatusUpdated: ${requestBody}");
            var e = JsonConvert.DeserializeObject<EventGridEvent[]>(requestBody).FirstOrDefault();
            if (IsValidationMessage(e))
            {
                log.LogInformation("Responding to validation message");
                return ValidationMessageResponse(e);
            }
            log.LogInformation("Some other event...");
            return new OkResult();
        }

        static ActionResult ValidationMessageResponse(EventGridEvent e)
        {
            var data = e.Data as JObject;
            var eventData = data.ToObject<SubscriptionValidationEventData>();
            var responseData = new SubscriptionValidationResponse
            {
                ValidationResponse = eventData.ValidationCode
            };
            if (responseData.ValidationResponse != null)
            {
                return new OkObjectResult(responseData);
            }
            return new OkResult();
        }

        static bool IsValidationMessage(EventGridEvent e)
        {
            return string.Equals(e.EventType, EventTypes.EventGridSubscriptionValidationEvent, StringComparison.OrdinalIgnoreCase);
        }
    }
}
