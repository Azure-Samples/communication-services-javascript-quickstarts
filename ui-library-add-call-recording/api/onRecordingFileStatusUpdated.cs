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
using System.Collections.Generic;

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
            if (!IsRecordingFileStatusUpdatedMessage(e))
            {
                log.LogInformation($"Rejecting event of type ${e.EventType}");
                return new BadRequestResult();
            }
            PrintAvailableChunks(e, log);
            return new OkResult();
        }

        static void PrintAvailableChunks(EventGridEvent e, ILogger log)
        {
            log.LogInformation($"Data: {e.Data}");
            var payload = JsonConvert.DeserializeObject<RecordingFileStatusUpdatedPayload>(e.Data.ToString(), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            log.LogInformation($"Parsed payload: {payload}");
            log.LogInformation($"Num chunks: {payload.RecordingStorageInfo.RecordingChunks.Count}");
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

        static bool IsRecordingFileStatusUpdatedMessage(EventGridEvent e)
        {
            return string.Equals(e.EventType, "Microsoft.Communication.RecordingFileStatusUpdated", StringComparison.OrdinalIgnoreCase);
        }
    }

    class RecordingFileStatusUpdatedPayload
    {
        [JsonProperty("recordingStorageInfo")]
        public RecordingStorageInfo RecordingStorageInfo { get; set; }
        [JsonProperty("recordingStartTime")]
        public string RecordingStartTime { get; set; }
        [JsonProperty("recordingDurationMs")]
        public int RecordingDurationMs { get; set; }
        [JsonProperty("sessionEndReason")]
        public string SessionEndReason { get; set; }
    }

    class RecordingStorageInfo
    {
        [JsonProperty("recordingChunks")]
        public List<RecordingChunk> RecordingChunks { get; set; }
    }

    class RecordingChunk
    {
        [JsonProperty("documentId")]
        public string DocumentId { get; set; }
        [JsonProperty("index")]
        public int Index { get; set; }
        [JsonProperty("endReason")]
        public string EndReason { get; set; }
    }
}
