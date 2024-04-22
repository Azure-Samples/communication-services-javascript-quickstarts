import {
  AttachmentSelectionHandler,
  AttachmentUploadOptions,
  AttachmentUploadTask
} from "@azure/communication-react";
import axios from "axios";
import FormData from "form-data";
import { v4 } from "uuid";

const MAX_FILE_SIZE_MB = 50 * 1024 * 1024; // 50MB
const UNSUPPORTED_FILES = ["exe", "bat", "dat"];

const fileSelectionHandler: AttachmentSelectionHandler = async (
  tasks: AttachmentUploadTask[]
): Promise<void> => {
  for (const task of tasks) {
    const fileExtension = task.file?.name.split(".").pop() ?? "";

    if (task.file && task.file?.size > MAX_FILE_SIZE_MB) {
      task.notifyUploadFailed(
        `"${task.file?.name}" is too big. Select a file under 50MB.`
      );
      continue;
    }

    if (UNSUPPORTED_FILES.includes(fileExtension)) {
      task.notifyUploadFailed(
        `Uploading ".${fileExtension}" files is not allowed.`
      );
      continue;
    }

    const uniqueFileName = `${task}-${v4()}-${task.file?.name}`;
    const formData = new FormData();
    formData.append("file", task.file, task.file?.name);

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
            task.notifyUploadProgressChanged(p.loaded / p.total);
        },
      });

      // 1 means the file upload progress is 100%. Similarly, 0.5 would be 50%.
      task.notifyUploadProgressChanged(1);
      task.notifyUploadCompleted(uniqueFileName, response.data.url);
    } catch (error) {
      console.error(error);
      task.notifyUploadFailed(
        "Unable to upload file. Please try again later."
      );
    }
  }
};

export const uploadOptions: AttachmentUploadOptions = {
  disableMultipleUploads: false,
  handleAttachmentSelection: fileSelectionHandler,
}