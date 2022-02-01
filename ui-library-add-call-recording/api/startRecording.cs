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
            if (string.IsNullOrEmpty(requestBody))
            {
                return new BadRequestObjectResult("empty POST body");
            }

            dynamic data = JsonConvert.DeserializeObject(requestBody);
            if (data.GetType().GetProperty("serverCallId") == null)
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }
            string serverCallId = data?.serverCallId;
            if (string.IsNullOrEmpty(serverCallId))
            {
                return new BadRequestObjectResult("empty `serverCallId` set");
            }

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            // We don't need status updates about an ongoing call, so we pass in a dummy callback URI.
            var startRecordingResponse = await callingServerClient.InitializeServerCall(serverCallId).StartRecordingAsync(new Uri("http://dummy.uri")).ConfigureAwait(false);
            var recordingId = startRecordingResponse.Value.RecordingId;
            log.LogInformation($"Started recording for {serverCallId}: {recordingId}");

            return new OkObjectResult(JsonConvert.SerializeObject(new StartRecordingResponse { RecordingId = recordingId }));
        }
    }

    class StartRecordingResponse
    {
        public string RecordingId { get; set; }
    }
}
