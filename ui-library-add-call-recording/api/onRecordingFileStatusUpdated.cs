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
using Azure.Communication.CallingServer;

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
            DownloadRecording(e, log);
            return new OkResult();
        }

        static void DownloadRecording(EventGridEvent e, ILogger log)
        {
            var payload = JsonConvert.DeserializeObject<RecordingFileStatusUpdatedPayload>(e.Data.ToString(), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            var callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());

            foreach (var chunk in payload.RecordingStorageInfo.RecordingChunks)
            {
                var response = callingServerClient.DownloadStreaming(new Uri(chunk.ContentLocation));
                using (var outStream = new MemoryStream())
                {
                    response.Value.CopyTo(outStream);
                    log.LogInformation($"Downloaded {outStream.Length} bytes from {chunk.ContentLocation}/{chunk.DocumentId}#{chunk.Index}.");
                }
            }
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
        [JsonProperty("contentLocation")]
        public string ContentLocation { get; set; }
        [JsonProperty("metadataLocation")]
        public string MetadataLocation { get; set; }
    }
}
