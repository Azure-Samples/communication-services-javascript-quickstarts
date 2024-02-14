// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { InvocationContext, HttpRequest, HttpResponseInit, app } from "@azure/functions";
import { BlobSASPermissions, BlobServiceClient, BlockBlobClient, SASProtocol } from "@azure/storage-blob";
import HTTP_CODES from "http-status-enum";
import { v4 } from "uuid";

const azureStorageConnectionString = process.env["azureStorageConnectionString"];

let storageAccountName: string | undefined;

try {
  storageAccountName = azureStorageConnectionString.match(/AccountName=([^;]+)/)[1];
} catch {
  throw new Error("Invalid Azure Storage Connection String");
}

// Name of the container in Azure Storage to store all files in.
// Make sure that this name matches the value in the 'function.json' file.
const fileSharingUploadsContainerName = "uploads";

const httpTrigger = async function (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("UploadFileToAzureBlobStore: Processing new request.");

  const contentType = req.headers?.get("content-type");
  // Content type is required to know how to parse multi-part form
  if (!contentType || !contentType.includes("multipart/form-data")) {
    context.log("Missing Content-Type of multipart/form-data on header");
    return {
      status: HTTP_CODES.BAD_REQUEST,
      body: "Please pass Content-Type on the header",
    };
  }

  const formData = await req.formData();
  const fileData = formData.get("file");
  if (!fileData) {
    context.log("Missing file passed as form data");
    return {
      status: HTTP_CODES.BAD_REQUEST,
      body: "Please pass a file in the form data",
    };
  }

  if (!azureStorageConnectionString) {
    throw Error("Storage isn't configured correctly - connection string missing in `azureStorageConnectionString`");
  }

  try {
    // Assume the data is a valid file, this is wrapped in a try/catch to catch any errors
    const file = fileData as unknown as File;

    context.log(`Original filename = ${file.name}`);
    context.log(`Content type = ${file.type}`);
    context.log(`Size = ${file.size}`);

    // Each chunk of the file is delimited by a special string
    const fileContent = await file.arrayBuffer();
    const fileContentBuffer = Buffer.from(fileContent);
    const size = fileContentBuffer.byteLength;

    const uniqueFileName = `${v4()}-${file.name}`;

    context.log(`*** Uploading Filename:${uniqueFileName}, Content type:${file.type}, Length:${file.size}`);

    const blockBlobClient = createBlockBlobClient(uniqueFileName);
    const response = await blockBlobClient.upload(fileContentBuffer, size);

    context.log(`Upload block blob ${uniqueFileName} successfully`, response.requestId);
    return {
      status: HTTP_CODES.OK,
      jsonBody: {
        filename: uniqueFileName,
        storageAccountName,
        fileSharingUploadsContainerName,
        url: await generateSASUrl(blockBlobClient),
      },
    };
  } catch (err) {
    context.error(HTTP_CODES.INTERNAL_SERVER_ERROR);
    return {
      status: 500,
      body: err.message,
    };
  }
};

/**
 * Utility method for generating a secure shortlived SAS URL for a blob.
 * To know more about SAS URLs, see: https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview
 * @param filename - string
 * @param expiresInSeconds - Default is 1 hour
 */
const generateSASUrl = async (blobClient: BlockBlobClient, expiresInSeconds = 1 * 60 * 60) => {
  const expiresOn = new Date();
  expiresOn.setSeconds(expiresOn.getSeconds() + expiresInSeconds);
  const url = await blobClient.generateSasUrl({
    expiresOn: expiresOn,
    permissions: BlobSASPermissions.parse("r"), // Read only permission to the blob
    protocol: SASProtocol.Https, // Only allow HTTPS access to the blob
  });

  return url;
};

const createBlockBlobClient = (filename: string): BlockBlobClient => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
  const blobContainerClient = blobServiceClient.getContainerClient(fileSharingUploadsContainerName);
  return blobContainerClient.getBlockBlobClient(filename);
};

app.http("uploadFileToAzureBlobStore", {
  methods: ["POST"],
  handler: httpTrigger,
});
