import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import {
  ChatComposite,
  ChatAdapter,
  createAzureCommunicationChatAdapter,
  FileUploadHandler,
  FileUploadManager,
  FileDownloadHandler
} from '@azure/communication-react';
import React, { useEffect, useMemo, useState } from 'react';

function App(): JSX.Element {
  // Common variables
  const endpointUrl = 'ENDPOINT_URL';
  const userId = '';
  const displayName = 'User 1';
  const token = '';
  // Calling Variables
  // Provide any valid UUID for `groupId`.
  // const groupId = 'c457b079-2862-4ad1-aba4-7138ab4b7bad';
  // Chat Variables
  const threadId = '';

  const [chatAdapter, setChatAdapter] = useState<ChatAdapter>();

  // We can't even initialize the Chat and Call adapters without a well-formed token.
  const credential = useMemo(() => {
    try {
      return new AzureCommunicationTokenCredential(token);
    } catch {
      console.error('Failed to construct token credential');
      return undefined;
    }
  }, [token]);

  useEffect(() => {
    const createAdapter = async (): Promise<void> => {
      setChatAdapter(
        await createAzureCommunicationChatAdapter({
          endpoint: endpointUrl,
          userId: { communicationUserId: userId },
          displayName,
          credential: new AzureCommunicationTokenCredential(token),
          threadId
        })
      );
    };
    createAdapter();
  }, []);

  if (!!chatAdapter) {
    return (
      <>
        <div style={containerStyle}>
          <ChatComposite
            adapter={chatAdapter}
            options={{
              fileSharing: {
                uploadHandler: fileUploadHandler,
                downloadHandler: fileDownloadHandler,
                accept: 'image/png, image/jpeg, text/plain, .docx',
                multiple: true
              }
            }} />
        </div>
      </>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

const fileUploadHandler: FileUploadHandler = async (userId, fileUploads) => {
  for (const fileUpload of fileUploads) {
    try {
      const { name, url, extension } = await uploadFileToAzureBlob(fileUpload);
      fileUpload.notifyUploadCompleted({ name, extension, url });
    } catch (error) {
      if (error instanceof Error) {
        fileUpload.notifyUploadFailed(error.message);
      }
    }
  }
}

const isUnauthorizedUser = (userId: string): boolean => {
  return false;
}

const fileDownloadHandler: FileDownloadHandler = async (userId, fileData) => {
  if (isUnauthorizedUser(userId)) {
    return { errorMessage: 'You are not allowed to download stuff' };
  }

  return new URL(fileData.url);
}

const uploadFileToAzureBlob = async (fileUpload: FileUploadManager) => {
  // You need to handle the file upload here and upload it to Azure Blob Storage.
  // Optionally, you can update the file upload progress.
  fileUpload.notifyUploadProgressChanged(0.2);

  const file = fileUpload.file;
  if (!file) {
    throw new Error('fileUpload.file is undefined');
  }

  const filename = file.name;

  // Following is an example of calling an Azure Function to handle file upload
  // The https://docs.microsoft.com/en-us/azure/developer/javascript/how-to/with-web-app/azure-function-file-upload
  // tutorial uses 'username' parameter to specify the storage container name.
  // Note that the container in the tutorial is private by default. To get default downloads working in
  // this sample, you need to change the container's access level to Public via Azure Portal.
  const username = 'ui-library';
  
  // You can get function url from the Azure Portal:
  const azFunctionBaseUri='<YOUR_AZURE_FUNCTION_URL>';
  const uri = `${azFunctionBaseUri}&username=${username}&filename=${filename}`;
  
  const formData = new FormData();
  formData.append(file.name, file);
  const response = await fetch(uri, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file, status code:${response.status}`);
  }

  const storageBaseUrl = 'https://<YOUR_STORAGE_ACCOUNT>.blob.core.windows.net';

  return {
    name: filename,
    url: `${storageBaseUrl}/${username}/${filename}`,
    extension: getFileExtension(filename)
  };
}

const getFileExtension = (filename: string): string => {
  const arr = filename.split('.');
  return arr[arr.length - 1];
}

const containerStyle = {
  height: '100%',
};

export default App;
