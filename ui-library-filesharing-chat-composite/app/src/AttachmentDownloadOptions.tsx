import { AttachmentDownloadOptions, AttachmentMetadata, ChatMessage, defaultAttachmentMenuAction } from "@azure/communication-react";

const handler = () => {
  // here we are returning a static action for all attachments and all messages
  return [defaultAttachmentMenuAction];
};

// alternatively, you can return different actions based on the attachment or message
export const customHandler = (attachment: AttachmentMetadata, message?: ChatMessage) => {
  if (attachment.name.includes("pdf")) {
    return [
      {
        title: "Custom button",
        icon: (<i className="custom-icon"></i>),
        onClick: () => {
          window.alert("Custom button clicked");
        }
      },
      defaultAttachmentMenuAction
    ];
  } else if (message?.senderId === "user1") {
    return [
      {
        title: "Custom button 2",
        icon: (<i className="custom-icon-2"></i>),
        onClick: () => {
          window.alert("Custom button 2 clicked");
        }
      },
      // you can also override the default action partially
      {
        ...defaultAttachmentMenuAction,
        onClick: () => {
          window.alert("Default action clicked");
        }
      }
    ];
  }
}

export const downloadOptions: AttachmentDownloadOptions = {
  actionsForAttachment: handler
}
