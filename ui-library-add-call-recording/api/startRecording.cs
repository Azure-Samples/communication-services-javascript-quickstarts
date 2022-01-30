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

            CallingServerClient callingServerClient = new CallingServerClient(Settings.GetACSConnectionString());

            log.LogInformation($"ACS Connection String: {Settings.GetACSConnectionString()}");

            if (string.IsNullOrEmpty(serverCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }
            return new OkObjectResult(JsonConvert.SerializeObject(new Result { text = $"Would have started call recording for {serverCallId}" }));
        }
    }
}
