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

            var request = JsonConvert.DeserializeObject<StartRecordingRquest>(requestBody, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
            if (request == null)
            {
                return new BadRequestObjectResult("malformed JSON");
            }
            if (string.IsNullOrEmpty(request.ServerCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            // We don't need status updates about an ongoing call, so we pass in a dummy callback URI.
            var startRecordingResponse = await callingServerClient.InitializeServerCall(request.ServerCallId).StartRecordingAsync(new Uri("http://dummy.uri")).ConfigureAwait(false);
            var recordingId = startRecordingResponse.Value.RecordingId;
            log.LogInformation($"Started recording for {request.ServerCallId}: {recordingId}");

            return new OkObjectResult(JsonConvert.SerializeObject(new StartRecordingResponse { RecordingId = recordingId }));
        }
    }

    class StartRecordingRquest
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
