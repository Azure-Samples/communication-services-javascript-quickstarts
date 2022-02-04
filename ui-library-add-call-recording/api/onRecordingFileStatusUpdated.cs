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
using System.Text.RegularExpressions;
using Contoso.Transfer;

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
            await TransferRecording(e, log);
            return new OkResult();
        }

        static async Task TransferRecording(EventGridEvent e, ILogger log)
        {
            var serverCallId = ExtractServerCallIDOrDie(e.Subject);
            var payload = JsonConvert.DeserializeObject<RecordingFileStatusUpdatedPayload>(e.Data.ToString(), new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });

            var callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            var storageClient = new BlobStorage(log, Settings.GetRecordingStoreConnectionString(), Settings.GetRecordingStoreContainerName());

            var chunks = payload.RecordingStorageInfo.RecordingChunks;
            var blobStorePaths = new List<string>();
            foreach (var chunk in chunks)
            {
                var name = blobName(serverCallId, chunk);
                var inStream = callingServerClient.DownloadStreaming(new Uri(chunk.ContentLocation)).Value;
                if (await storageClient.UploadFileAsync(name, inStream))
                {
                    blobStorePaths.Add(name);
                    log.LogInformation($"Transferred {name}");
                }
            }
            log.LogInformation($"Uploaded {blobStorePaths.Count} chunks for {serverCallId}");
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

        static string ExtractServerCallIDOrDie(string subject)
        {
            var match = serverCallIdExtractionPattern.Match(subject);
            var serverCallId = match.Groups["serverCallId"].Value;
            if (string.IsNullOrEmpty(serverCallId))
            {
                throw new Exception($"Failed parse serverCallId from {subject}");
            }
            return serverCallId;
        }

        static string blobName(string serverCallId, RecordingChunk chunk)
        {
            return $"call_{serverCallId}/chunk_{chunk.DocumentId}_{chunk.Index}.mov";
        }

        static Regex serverCallIdExtractionPattern = new Regex(@".*serverCallId/(?<serverCallId>[^/]*)/recordingId/.*");
    }
}
