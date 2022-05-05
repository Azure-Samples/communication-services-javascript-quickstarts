import { FileDownloadHandler } from "@azure/communication-react";

const isAuthorizedUser = (userId: string): boolean => {
    return true;
}

const fileDownloadHandler: FileDownloadHandler = async (userId, fileData) => {
    if (isAuthorizedUser(userId)) {
      return new URL(fileData.url);
    }
    
    return { errorMessage: 'You are not authorised to download the file.' };
  }

export default fileDownloadHandler;