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
    public static class StopRecording
    {
        [FunctionName("stopRecording")]
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

            var request = JsonConvert.DeserializeObject<StopRecordingRequest>(requestBody, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            if (request == null)
            {
                return new BadRequestObjectResult("malformed JSON");
            }
            if (string.IsNullOrEmpty(request.ServerCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }
            if (string.IsNullOrEmpty(request.RecordingId))
            {
                return new BadRequestObjectResult("`recordingId` not set");
            }

            var callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            var serverCall = callingServerClient.InitializeServerCall(request.ServerCallId);
            try
            {
                await serverCall.StopRecordingAsync(request.RecordingId).ConfigureAwait(false);
            }
            catch (RequestFailedException e)
            {
                log.LogWarning($"Failed to stop recording for ({request.ServerCallId}, {request.RecordingId}): {e}");
                return new StatusCodeResult(e.Status);
            }

            log.LogInformation($"Stopped recording for {request.ServerCallId}: {request.RecordingId}");
            return new OkResult();
        }
    }

    class StopRecordingRequest
    {
        [JsonProperty("serverCallId")]
        public string ServerCallId { get; set; }
        [JsonProperty("recordingId")]
        public string RecordingId { get; set; }
    }
}
