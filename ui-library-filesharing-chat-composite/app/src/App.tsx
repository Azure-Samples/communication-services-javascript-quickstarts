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
import axios from 'axios';
import FormData from 'form-data';
import { v4 } from 'uuid';

const MAX_FILE_SIZE_MB = 50 * 1024 * 1024;
const UNSUPPORTED_FILES = ['exe', 'bat', 'dat'];

function App(): JSX.Element {
  // Common variables
  const endpointUrl = '<Azure Communication Services Resource Endpoint>';
  const token = '<Azure Communication Services Resource Access Token>';
  const userId = '<User Id associated to the token>';
  const threadId = '<Get thread id from chat service>';
  const displayName = '<Display Name>';
  
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

  const isUnauthorizedUser = (userId: string): boolean => {
    return false;
  }
  
  const fileDownloadHandler: FileDownloadHandler = async (userId, fileData) => {
    if (isUnauthorizedUser(userId)) {
      return { errorMessage: 'You are not allowed to download stuff' };
    }
  
    return new URL(fileData.url);
  }
  const fileUploadHandler: FileUploadHandler = (userId: string, fileUploads: FileUploadManager[], msToken?: string): void => {
    for (const fileUpload of fileUploads) {
      const fileExtension = fileUpload.file?.name.split('.').pop() || '';
  
      if (fileUpload.file && fileUpload.file?.size > MAX_FILE_SIZE_MB) {
        fileUpload.notifyUploadFailed(`"${fileUpload.file?.name}" is too big. Select a file under 50MB.`);
        continue;
      }
  
      if (UNSUPPORTED_FILES.includes(fileExtension)) {
        fileUpload.notifyUploadFailed(`Uploading ".${fileExtension}" files is not allowed.`);
        continue;
      }
  
      const uniqueFileName = `${v4()}-${fileUpload.file?.name}`;
      const formData = new FormData();
      formData.append('file', fileUpload.file, fileUpload.file?.name);
      axios
        .request({
          method: 'post',
          url: `http://localhost:7071/api/UploadFileToAzureBlobStore?filename=${uniqueFileName}`,
          data: formData,
          headers: {
            'Content-Type': `multipart/form-data`,
            'Access-Control-Allow-Origin' : '*',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (p) => {
            fileUpload.notifyUploadProgressChanged(p.loaded / p.total);
          }
        })
        .then((res) => {
          fileUpload.notifyUploadProgressChanged(1);
          fileUpload.notifyUploadCompleted({
            name: fileUpload.file?.name || '',
            extension: fileExtension,
            url: res.data.url
          });
        })
        .catch((err) => {
          console.log(err);
          fileUpload.notifyUploadFailed('Unable to upload file. Please try again later.');
        });
    }
  };
  

  if (!!chatAdapter) {
    return (

      <div style={containerStyle} >
        <ChatComposite adapter={chatAdapter}
        options={{
          fileSharing: {
            uploadHandler: (userId, fileUploads) => fileUploadHandler(userId, fileUploads),
            downloadHandler: fileDownloadHandler,
            accept: 'image/png, image/jpeg, text/plain, .docx',
            multiple: true
          }
        }} />
      </div>
    );
  }
  if (credential === undefined) {
    return <h3>Failed to construct credential. Provided token is malformed.</h3>;
  }
  return <h3>Initializing...</h3>;
}

const containerStyle = {
  height: '100%',
};

export default App;

