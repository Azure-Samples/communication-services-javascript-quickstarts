import {
  FileUploadHandler,
  FileUploadManager,
} from "@azure/communication-react";
import axios from "axios";
import FormData from "form-data";
import { v4 } from "uuid";

const MAX_FILE_SIZE_MB = 50 * 1024 * 1024; // 50MB
const UNSUPPORTED_FILES = ["exe", "bat", "dat"];

const fileUploadHandler: FileUploadHandler = async (
  // The userId of the user who is uploading the file.
  // Can be used for authorization purposes OR to upload files to user specific folders.
  userId: string,
  fileUploads: FileUploadManager[]
): Promise<void> => {
  for (const fileUpload of fileUploads) {
    const fileExtension = fileUpload.file?.name.split(".").pop() ?? "";

    if (fileUpload.file && fileUpload.file?.size > MAX_FILE_SIZE_MB) {
      fileUpload.notifyUploadFailed(
        `"${fileUpload.file?.name}" is too big. Select a file under 50MB.`
      );
      continue;
    }

    if (UNSUPPORTED_FILES.includes(fileExtension)) {
      fileUpload.notifyUploadFailed(
        `Uploading ".${fileExtension}" files is not allowed.`
      );
      continue;
    }

    const uniqueFileName = `${userId}-${v4()}-${fileUpload.file?.name}`;
    const formData = new FormData();
    formData.append("file", fileUpload.file, fileUpload.file?.name);

    try {
      const response = await axios.request({
        method: "post",
        url: `/api/uploadFileToAzureBlobStore?filename=${uniqueFileName}`,
        data: formData,
        headers: {
          "Content-Type": `multipart/form-data`,
          "Access-Control-Allow-Origin": "*",
        },
        onUploadProgress: (p) => {
          if (p.total)
            fileUpload.notifyUploadProgressChanged(p.loaded / p.total);
        },
      });

      // 1 means the file upload progress is 100%. Similarly, 0.5 would be 50%.
      fileUpload.notifyUploadProgressChanged(1);
      fileUpload.notifyUploadCompleted({
        id: uniqueFileName,
        name: fileUpload.file?.name ?? "",
        extension: fileExtension,
        url: response.data.url,
      });
    } catch (error) {
      console.error(error);
      fileUpload.notifyUploadFailed(
        "Unable to upload file. Please try again later."
      );
    }
  }
};

export default fileUploadHandler;
