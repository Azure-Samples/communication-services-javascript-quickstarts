import { FileDownloadHandler } from "@azure/communication-react";

const isAuthorizedUser = (userId: string): boolean => {
  // Developers can choose to implement their own logic here.
  // For example, you can check if the user is authorized to download files.
  // OR only allow certain users to download files.
  return true;
};

const fileDownloadHandler: FileDownloadHandler = async (userId, fileData) => {
  if (isAuthorizedUser(userId)) {
    return new URL(fileData.url);
  }

  return { errorMessage: "You are not authorised to download the file." };
};

export default fileDownloadHandler;
