// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import * as multipart from 'parse-multipart';
import HTTP_CODES from 'http-status-enum';

const azureStorageConnectionString = process.env['azureStorageConnectionString'];
let storageAccountName;
try {
  storageAccountName = azureStorageConnectionString.match(/AccountName=([^;]+)/)[1];
} catch {
  console.warn('Azure storage connection string not provided');
}
const fileSharingUploadsContainerName = 'uploads'; // Must be in storage path value in function.json

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
  context.log('HTTP trigger function processed a request to upload a file to azure blob store.');

  if (!req.body || !req.body.length) {
    context.res.body = { error: `Request body is not defined` };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  // `filename` is required property to use multi-part npm package
  if (!req.query?.filename) {
    context.res.body = { error: `filename is not defined` };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  // Content type is required to know how to parse multi-part form
  if (!req.headers || !req.headers['content-type']) {
    context.res.body = { error: `Content type is not sent in header 'content-type'` };
    context.res.status = HTTP_CODES.BAD_REQUEST;
    return;
  }

  context.log(
    `*** Uploading Filename:${req.query?.filename}, Content type:${req.headers['content-type']}, Length:${req.body.length}`
  );

  if (!azureStorageConnectionString) {
    throw Error("Storage isn't configured correctly - connection string missing in `azureStorageConnectionString`");
  }

  try {
    // Each chunk of the file is delimited by a special string
    const bodyBuffer = Buffer.from(req.body);
    const boundary = multipart.getBoundary(req.headers['content-type']);
    const parts = multipart.Parse(bodyBuffer, boundary);

    // The file buffer is corrupted or incomplete
    if (!parts?.length) {
      context.res.body = { error: `File buffer is incorrect` };
      context.res.status = HTTP_CODES.BAD_REQUEST;
      return;
    }

    // filename is a required property of the parse-multipart package
    if (parts[0]?.filename) console.log(`Original filename = ${parts[0]?.filename}`);
    if (parts[0]?.type) console.log(`Content type = ${parts[0]?.type}`);
    if (parts[0]?.data?.length) console.log(`Size = ${parts[0]?.data?.length}`);
    // Passed to Storage
    context.bindings.storage = parts[0]?.data;
    context.res.body = {
      filename: req.query?.filename,
      storageAccountName,
      fileSharingUploadsContainerName,
      url: `https://${storageAccountName}.blob.core.windows.net/${fileSharingUploadsContainerName}/${req.query?.filename}`
    };
    return;
  } catch (err) {
    context.log.error(err.message);
    context.res.body = {
      error: err.message
    };
    context.res.status = HTTP_CODES.INTERNAL_SERVER_ERROR;
    return;
  }
};

export default httpTrigger;
