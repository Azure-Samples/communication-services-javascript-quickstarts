import {
  usePropsFor,
  MessageThread,
  SendBox,
  ActiveFileUpload,
  FileMetadata,
} from "@azure/communication-react";
import React from "react";
import axios from "axios";
import Form from "form-data";
import { v4 } from "uuid";

function ChatComponents(): JSX.Element {
  const allActiveFileUploads = React.useRef<ActiveFileUpload[] | []>([]);
  const completedFileUploads = React.useRef<FileMetadata[] | []>([]);
  const [files, setFiles] = React.useState<File[] | []>();
  const [activeFileUploads, setActiveFileUploads] = React.useState<
    ActiveFileUpload[] | []
  >([]);

  const updateFileUploadProgress = (
    fileId: string,
    progress: number,
    complete: boolean = false
  ) => {
    const updatedData = allActiveFileUploads.current.map((active) => {
      if (active.id === fileId) {
        return {
          ...active,
          progress,
          uploadComplete: complete,
        };
      }
      return active;
    });
    allActiveFileUploads.current = updatedData;
    setActiveFileUploads(updatedData);
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

  React.useEffect(() => {
    if (files?.length) {
      files.forEach((file) => {
        uploadFile(file);
      });
    }
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

  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {messageThreadProps && <MessageThread {...messageThreadProps} />}
      {sendBoxProps && (
        <SendBox
          {...sendBoxProps}
          activeFileUploads={activeFileUploads}
          onCancelFileUpload={(id: string) => {
            allActiveFileUploads.current = allActiveFileUploads.current.filter(
              (upload) => upload.id !== id
            );
            setActiveFileUploads(allActiveFileUploads.current);
          }}
          onSendMessage={async (message: string) => {
            sendBoxProps.onSendMessage(message, {
              metadata: {
                fileSharingMetadata: JSON.stringify(
                  completedFileUploads.current
                ),
              },
            });

            allActiveFileUploads.current = [];
            completedFileUploads.current = [];
            setActiveFileUploads([]);
          }}
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
