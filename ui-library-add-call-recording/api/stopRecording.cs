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

            var request = JsonConvert.DeserializeObject<StopRecordingRquest>(requestBody, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
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

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            var stopRecordingReponse = await callingServerClient.InitializeServerCall(request.ServerCallId).StopRecordingAsync(request.RecordingId).ConfigureAwait(false);
            log.LogInformation($"Stopped recording for {request.ServerCallId}: {request.RecordingId}");
            return new OkResult();
        }
    }

    class StopRecordingRquest
    {
        [JsonProperty("serverCallId")]
        public string ServerCallId { get; set; }
        [JsonProperty("recordingId")]
        public string RecordingId { get; set; }
    }
}
