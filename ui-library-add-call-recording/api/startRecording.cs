using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Azure.Communication.CallAutomation;
using Azure;

namespace Contoso
{
    public static class StartRecording
    {
        [FunctionName("startRecording")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            string requestBody = "";
            try
            {
                requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            }
            catch (ArgumentNullException)
            {
                return new BadRequestObjectResult("null POST body");
            }

            var request = JsonConvert.DeserializeObject<StartRecordingRequest>(requestBody, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            if (request == null)
            {
                return new BadRequestObjectResult("malformed JSON");
            }
            if (string.IsNullOrEmpty(request.ServerCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }

            try
            {
                var callAutomationClient = new CallAutomationClient(Settings.GetACSConnectionString());
                StartRecordingOptions recordingOptions = new StartRecordingOptions(new ServerCallLocator(request.ServerCallId))
                {
                    RecordingContent = RecordingContent.AudioVideo,
                    RecordingChannel = RecordingChannel.Mixed,
                    RecordingFormat = RecordingFormat.Mp4
                };
                var startRecordingResponse = await callAutomationClient.GetCallRecording().StartAsync(recordingOptions).ConfigureAwait(false);
                var recordingId = startRecordingResponse.Value.RecordingId;
                log.LogInformation($"Started recording for {request.ServerCallId}: {recordingId}");
                return new OkObjectResult(JsonConvert.SerializeObject(new StartRecordingResponse { RecordingId = recordingId }));
            }
            catch (RequestFailedException e)
            {
                log.LogWarning($"Failed to start recording for {request.ServerCallId}: {e}");
                return new StatusCodeResult(e.Status);
            }
        }
    }

    class StartRecordingRequest
    {
        [JsonProperty("serverCallId")]
        public string ServerCallId { get; set; }
    }

    class StartRecordingResponse
    {
        [JsonProperty("recordingId")]
        public string RecordingId { get; set; }
    }
}
