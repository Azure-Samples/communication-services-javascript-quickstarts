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
    public static class startRecording
    {
        [FunctionName("startRecording")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            string serverCallId = data?.serverCallId;
            if (string.IsNullOrEmpty(serverCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            // We don't need status updates about an ongoing call, so we pass in a dummy callback URI.
            var startRecordingResponse = await callingServerClient.InitializeServerCall(serverCallId).StartRecordingAsync(new Uri("")).ConfigureAwait(false);
            var recordingId = startRecordingResponse.Value.RecordingId;
            log.LogInformation($"Started recording for {serverCallId}: {recordingId}");

            return new OkObjectResult(JsonConvert.SerializeObject(new Result { text = $"Started recording for {serverCallId}: {recordingId}" }));
        }
    }
}
