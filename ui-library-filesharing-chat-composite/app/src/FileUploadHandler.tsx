import { FileUploadHandler, FileUploadManager } from "@azure/communication-react";
import axios from 'axios';
import FormData from 'form-data';
import { v4 } from 'uuid';

const MAX_FILE_SIZE_MB = 50 * 1024 * 1024;
const UNSUPPORTED_FILES = ['exe', 'bat', 'dat'];

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
            'Access-Control-Allow-Origin' : '*'
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

  export default fileUploadHandler;