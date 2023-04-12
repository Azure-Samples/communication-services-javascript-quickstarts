using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Contoso
{
    namespace Transfer
    {
        class BlobData
        {
            [JsonProperty("name")]
            public string Name { get; set; }
            [JsonProperty("url")]
            public string Url { get; set; }
        }

        class BlobStorage
        {
            private ILogger log;
            private BlobContainerClient containerClient;

            private Dictionary<string, BlobData> cachedBlobList;

            public BlobStorage(ILogger log, string connectionString, string containerName)
            {
                this.log = log;
                var serviceClient = new BlobServiceClient(connectionString);
                this.containerClient = serviceClient.GetBlobContainerClient(containerName);
                this.cachedBlobList = new Dictionary<string, BlobData>();
            }

            public async Task<bool> UploadFileAsync(string blobName, Stream inStream)
            {
                if (!await this.containerClient.ExistsAsync())
                {
                    throw new Exception("container not available");
                }

                var blobClient = this.containerClient.GetBlobClient(blobName);
                if (await blobClient.ExistsAsync())
                {
                    this.log.LogWarning($"Blob {blobName} already exists. Skipping upload.");
                    return false;
                }

                await blobClient.UploadAsync(inStream);
                return true;
            }

            public BlobData[] GetBlobDataList(string prefix)
            {
                var blobs = this.containerClient.GetBlobs(Azure.Storage.Blobs.Models.BlobTraits.None, Azure.Storage.Blobs.Models.BlobStates.None, prefix);
                foreach (var blob in blobs)
                {
                    if (this.cachedBlobList.ContainsKey(blob.Name))
                    {
                        continue;
                    }

                    var blobClient = this.containerClient.GetBlobClient(blob.Name);
                    this.cachedBlobList.Add(blob.Name, new BlobData(){
                        Name = blob.Name,
                        Url = blobClient.CanGenerateSasUri ? blobClient.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.AddHours(1)).ToString() : null
                    });
                }

                return new List<BlobData>(this.cachedBlobList.Values).ToArray();
            }
        }
    }

}
