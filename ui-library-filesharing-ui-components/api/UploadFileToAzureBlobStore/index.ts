// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
} from "@azure/storage-blob";
import HTTP_CODES from "http-status-enum";
import * as multipart from "parse-multipart";

const azureStorageConnectionString =
  process.env["azureStorageConnectionString"];

let storageAccountName: string | undefined;

try {
  storageAccountName =
    azureStorageConnectionString.match(/AccountName=([^;]+)/)[1];
} catch {
  throw new Error("Invalid Azure Storage Connection String");
}

// Name of the container in Azure Storage to store all files in.
// Make sure that this name matches the value in the 'function.json' file.
const fileSharingUploadsContainerName = "uploads";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<unknown> {
  context.log("UploadFileToAzureBlobStore: Processing new request.");

  if (!req.body || !req.body.length) {
    context.res.body = { error: `Request body is not defined` };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  const filename = req.query?.filename;

  // `filename` is required property to correctly upload the file in the provided storage
  if (!filename) {
    context.res.body = { error: `filename is not defined` };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  // Content type is required to know how to parse multi-part form
  if (!req.headers || !req.headers["content-type"]) {
    context.res.body = {
      error: `Content type is not set in header 'content-type'`,
    };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  context.log(
    `*** Uploading Filename:${filename}, Content type:${req.headers["content-type"]}, Length:${req.body.length}`
  );

  if (!azureStorageConnectionString) {
    throw Error(
      "Storage isn't configured correctly - connection string missing in `azureStorageConnectionString`"
    );
  }

  try {
    // Each chunk of the file is delimited by a special string
    const bodyBuffer = Buffer.from(req.body);
    const boundary = multipart.getBoundary(req.headers["content-type"]);
    const parts = multipart.Parse(bodyBuffer, boundary);

    // The file buffer is corrupted or incomplete
    if (!parts?.length) {
      context.res.body = { error: `File buffer is incorrect` };
      context.res.status = HTTP_CODES.BAD_REQUEST;
      return;
    }

    // filename is a required property of the parse-multipart package
    if (parts[0]?.filename)
      context.log(`Original filename = ${parts[0]?.filename}`);
    if (parts[0]?.type) context.log(`Content type = ${parts[0]?.type}`);
    if (parts[0]?.data?.length) context.log(`Size = ${parts[0]?.data?.length}`);

    // Any data assigned to this binding is uploaded to azure storage by the output variable binding.
    // only parts[0].data is accessed as only one file is uploaded per request, other parts are never populated.
    context.bindings.storage = parts[0]?.data;

    context.res.body = {
      filename: filename,
      storageAccountName,
      fileSharingUploadsContainerName,
      url: await generateSASUrl(filename),
    };
    return;
  } catch (err) {
    context.log.error(err.message);
    context.res.body = {
      error: err.message,
    };
    context.res.status = HTTP_CODES.INTERNAL_SERVER_ERROR;
    return;
  }
};

/**
 * Utility method for generating a secure shortlived SAS URL for a blob.
 * To know more about SAS URLs, see: https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview
 * @param filename - string
 * @param expiresInSeconds - Default is 1 hour
 */
const generateSASUrl = async (
  filename: string,
  expiresInSeconds = 1 * 60 * 60
) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    azureStorageConnectionString
  );
  const blobContainerClient = blobServiceClient.getContainerClient(
    fileSharingUploadsContainerName
  );
  const blobClient = blobContainerClient.getBlobClient(filename);
  const expiresOn = new Date();
  expiresOn.setSeconds(expiresOn.getSeconds() + expiresInSeconds);
  const url = await blobClient.generateSasUrl({
    expiresOn: expiresOn,
    permissions: BlobSASPermissions.parse("r"), // Read only permission to the blob
    protocol: SASProtocol.Https, // Only allow HTTPS access to the blob
  });
  return url;
};

export default httpTrigger;
