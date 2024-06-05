import {
  AttachmentDownloadOptions,
  AttachmentMenuAction,
  AttachmentMetadata,
  ChatMessage,
  defaultAttachmentMenuAction,
} from "@azure/communication-react";

const handler = () => {
  // here we are returning a static action for all attachments and all messages
  return [defaultAttachmentMenuAction];
};

// alternatively, you can return different actions based on the attachment or message
export const customHandler = (
  attachment: AttachmentMetadata,
  message?: ChatMessage
): AttachmentMenuAction[] => {
  const extension = attachment.name.split(".").pop() || "";
  if (extension === "pdf") {
    return [
      {
        name: "Custom button",
        icon: <i className="custom-icon"></i>,
        onClick: () => {
          window.alert("Custom button clicked");
          return Promise.resolve();
        },
      },
      defaultAttachmentMenuAction,
    ];
  } else if (message?.senderId === "user1") {
    return [
      {
        name: "Custom button 2",
        icon: <i className="custom-icon-2"></i>,
        onClick: () => {
          window.alert("Custom button 2 clicked");
          return Promise.resolve();
        },
      },
      // you can also override the default action partially
      {
        ...defaultAttachmentMenuAction,
        onClick: () => {
          window.alert("Default action clicked");
          return Promise.resolve();
        },
      },
    ];
  } else {
    return [defaultAttachmentMenuAction];
  }
};

export const downloadOptions: AttachmentDownloadOptions = {
  actionsForAttachment: handler,
};
