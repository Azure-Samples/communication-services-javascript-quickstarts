using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Azure.Communication.CallingServer;
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

            var callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            var serverCall = callingServerClient.InitializeServerCall(request.ServerCallId);

            string recordingId = "";
            try
            {
                // We don't need status updates about an ongoing call, so we pass in a dummy callback URI.
                var startRecordingResult = await serverCall.StartRecordingAsync(new Uri("http://dummy.uri")).ConfigureAwait(false);
                recordingId = startRecordingResult.Value.RecordingId;
            }
            catch (RequestFailedException e)
            {
                log.LogWarning($"Failed to start recording for {request.ServerCallId}: {e}");
                return new StatusCodeResult(e.Status);
            }

            log.LogInformation($"Started recording for {request.ServerCallId}: {recordingId}");

            return new OkObjectResult(JsonConvert.SerializeObject(new StartRecordingResponse { RecordingId = recordingId }));
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
