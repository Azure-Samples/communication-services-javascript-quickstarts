import { BlobSASPermissions, BlobSASSignatureValues, generateBlobSASQueryParameters, StorageSharedKeyCredential } from "@azure/storage-blob";
import { Logger, MessageType } from './Logger';

const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require("fs");

export class BlobStorageHelper {
  static containerClientUri: string;

  public static async uploadFileToStorage(containerName: string,
    blobName: string,
    blobConnectionString: string) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString)
      const containerClient = blobServiceClient.getContainerClient(containerName);
      var containerExist = await containerClient.exists();
      if (!containerExist) {
        var output = 'Blob Container -> ' + containerName + ' is unavailable'
        var error = { 'output': output, 'statusCode': '400' }
        Logger.logMessage(MessageType.ERROR, output)
        return error;
      }

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      var blobExist = await blockBlobClient.exists();
      if (blobExist) {
        var output = 'Blob  -> ' + blobName + ' is already present'
        var error = { 'output': output, 'statusCode': '400' }
        Logger.logMessage(MessageType.ERROR, output)
        return error;
      }
      else {
        try {
          var data = fs.readFileSync(blobName);
          const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
          Logger.logMessage(MessageType.INFORMATION, "Blob was uploaded successfully. requestId: " + uploadBlobResponse.requestId)
          this.containerClientUri = containerClient.getBlockBlobClient(blobName).url;
          var message = { 'output': true, 'statusCode': '200' }
          return message;
        }
        catch (e) {
          var exception = BlobStorageHelper.getExecptionDetails(e)
          return exception
        }
      }
    }
    catch (e) {
      var exception = BlobStorageHelper.getExecptionDetails(e)
      return exception
    }
  }


  public static getBlobSasUri(containerName: string, blobName: string, storageAccountName: string, storageAccountKey: string) {
    try {
      const sasOptions: BlobSASSignatureValues = {
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
        permissions: BlobSASPermissions.parse("r"),
        containerName: containerName,
        blobName: blobName
      };

      var sharedKeyCredential = new StorageSharedKeyCredential(storageAccountName, storageAccountKey)
      const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();
      var sasUri = `${this.containerClientUri}?${sasToken}`;
      Logger.logMessage(MessageType.INFORMATION, `SAS uri for blob is: ${sasUri}`)
      return sasUri;
    }
    catch (e) {
      return BlobStorageHelper.getExecptionDetails(e);
    }
  }

  public static getExecptionDetails(e: any) {
    let statusCode = e.statusCode || e.status || "500"
    let name = e.message || e.name || 'Some error occoured'
    let stack = e.stack || ' Not available'
    let code = e.code || ''
    var output = 'Error :  Status =  ' + statusCode + ' \n| Code = ' + code + ' \n| Message = ' + name + ' \n| Stack = ' + stack
    var result = { 'output': output, 'statusCode': statusCode }
    Logger.logMessage(MessageType.ERROR, output);
    return result;
  }
}