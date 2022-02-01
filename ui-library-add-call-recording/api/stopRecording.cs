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
            if (data.GetType().GetProperty("recordingId") == null)
            {
                return new BadRequestObjectResult("`recordingId` not set");
            }
            string recordingId = data?.recordingId;
            if (string.IsNullOrEmpty(serverCallId))
            {
                return new BadRequestObjectResult("empty `recordingId` set");
            }

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());
            var stopRecordingReponse = await callingServerClient.InitializeServerCall(serverCallId).StopRecordingAsync(recordingId).ConfigureAwait(false);
            log.LogInformation($"Stopped recording for {serverCallId}: {recordingId}");
            return new OkResult();
        }
    }
}
