import { usePropsFor, MessageThread, SendBox, ActiveFileUpload, FileMetadata } from "@azure/communication-react";
import React from "react";
import axios from "axios";
import Form from "form-data";
import { v4 } from "uuid";

function ChatComponents(): JSX.Element {
  const allActiveFileUploads = React.useRef<ActiveFileUpload[]>([]);
  const completedFileUploads = React.useRef<FileMetadata[] | []>([]);
  const [files, setFiles] = React.useState<File[] | []>();
  const [activeFileUploads, setActiveFileUploads] = React.useState<ActiveFileUpload[]>([]);

  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);

  const updateFileUploadProgress = (fileId: string, progress: number, complete: boolean = false) => {
    allActiveFileUploads.current = updateProgressForOneFile(allActiveFileUploads.current, fileId, progress, complete);
    setActiveFileUploads(allActiveFileUploads.current);
  };

  const uploadFile = async (file: File): Promise<void> => {
    const extension = file.name.split(".").pop() || "";
    const uniqueFileName = `${v4()}-${file.name}`;
    const data = new Form();
    data.append("file", file);

    axios
      .request({
        method: "post",
        url: `/api/UploadFileToAzureBlobStore?filename=${uniqueFileName}`,
        data: data,
        onUploadProgress: (p) => {
          updateFileUploadProgress(file.name, p.loaded / p.total);
        },
      })
      .then((res) => {
        updateFileUploadProgress(file.name, 1, true);
        completedFileUploads.current = [
          ...completedFileUploads.current,
          {
            name: file.name,
            extension,
            url: res.data.url,
          },
        ];
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // We trigger `uploadFile` whenever new files are selected.
  React.useEffect(() => {
    if (files?.length) {
      files.forEach(uploadFile);
    }
    // We only need to run this useEffect when new files are selected by the file input.
    // And hence, we don't add `uploadFile` to dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const onChange = (files: FileList | null) => {
    if (!files) return;
    setFiles(Array.from(files));
    allActiveFileUploads.current = Array.from(files).map((file) => ({
      filename: file.name,
      id: file.name,
      progress: 0,
    }));
    setActiveFileUploads(allActiveFileUploads.current);
  };

  const onCancelFileUpload = (fileId: string) => {
    allActiveFileUploads.current = allActiveFileUploads.current.filter((upload) => upload.id !== fileId);
    setActiveFileUploads(allActiveFileUploads.current);
  };

  const onSendMessage = async (message: string) => {
    sendBoxProps.onSendMessage(message, {
      metadata: {
        // `fileSharingMetadata` is the key used by UI Library to recognize file attachments in a message.
        // Using a different key will prevent UI Library from recognizing the file attachment and file sharing UI won't work.
        fileSharingMetadata: JSON.stringify(completedFileUploads.current),
      },
    });

    allActiveFileUploads.current = [];
    completedFileUploads.current = [];
    setActiveFileUploads([]);
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {messageThreadProps && <MessageThread {...messageThreadProps} />}
      {sendBoxProps && (
        <SendBox
          {...sendBoxProps}
          activeFileUploads={activeFileUploads}
          onCancelFileUpload={onCancelFileUpload}
          onSendMessage={onSendMessage}
        />
      )}

      <div style={{ padding: "0.25rem" }}>
        <input
          name="file"
          type="file"
          multiple
          onChange={(event) => {
            onChange(event.currentTarget.files);
          }}
        />
      </div>
    </div>
  );
}

export default ChatComponents;

const updateProgressForOneFile = (
  allActiveFileUploads: ActiveFileUpload[],
  fileId: string,
  progress: number,
  complete: boolean
) => {
  return allActiveFileUploads.map((active) => {
    if (active.id === fileId) {
      return {
        ...active,
        progress,
        uploadComplete: complete,
      };
    }
    return active;
  });
};
