using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Contoso.Transfer;

namespace Contoso
{
    public static class ListRecordings
    {
        static BlobStorage storageClient;

        [FunctionName("listRecordings")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req,
            ILogger log)
        {
            string serverCallId = req.Query["serverCallId"];
            if (string.IsNullOrEmpty(serverCallId))
            {
                return new BadRequestObjectResult("`serverCallId` not set");
            }

            if (ListRecordings.storageClient == null)
            {
                ListRecordings.storageClient = new BlobStorage(log, Settings.GetRecordingStoreConnectionString(), Settings.GetRecordingStoreContainerName());
            }

            var response = new ListRecordingsResponse
            {
                Blobs = ListRecordings.storageClient.GetBlobDataList($"call_{serverCallId}")
            };
            return new OkObjectResult(JsonConvert.SerializeObject(response));
        }
    }

    class ListRecordingsResponse
    {
        [JsonProperty("blobs")]
        public BlobData[] Blobs { get; set; }
    }
}
