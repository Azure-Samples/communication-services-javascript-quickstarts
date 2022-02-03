using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Microsoft.Extensions.Logging;

namespace Contoso
{
    namespace Transfer
    {
        class BlobStorage
        {
            private ILogger log;
            private BlobContainerClient containerClient;

            public BlobStorage(ILogger log, string connectionString, string containerName)
            {
                this.log = log;
                var serviceClient = new BlobServiceClient(connectionString);
                this.containerClient = serviceClient.GetBlobContainerClient(containerName);
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

            public string[] GetBlobUris(string prefix)
            {
                var pages = this.containerClient.GetBlobs(Azure.Storage.Blobs.Models.BlobTraits.None, Azure.Storage.Blobs.Models.BlobStates.None, prefix);
                var response = new List<string>();
                foreach (var blob in pages)
                {
                    var blobClient = this.containerClient.GetBlobClient(blob.Name);
                    response.Add(blobClient.Uri.ToString());
                }
                return response.ToArray();
            }
        }
    }

}
