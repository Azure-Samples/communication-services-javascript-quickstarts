import {
  usePropsFor,
  MessageThread,
  SendBox,
  ActiveFileUpload,
} from "@azure/communication-react";
import React from "react";

function ChatComponents(): JSX.Element {
  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);

  const [activeFileUploads, setActiveFileUploads] = React.useState<
    ActiveFileUpload[] | []
  >([
    {
      filename: "file1.txt",
      id: "file1",
      progress: 0.5,
    },
  ]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {/*Props are updated asynchronously, so only render the component once props are populated.*/}
      {messageThreadProps && <MessageThread {...messageThreadProps} />}
      {sendBoxProps && (
        <SendBox
          {...sendBoxProps}
          activeFileUploads={activeFileUploads}
          onCancelFileUpload={(id: string) => {
            setActiveFileUploads(
              activeFileUploads.filter((upload) => upload.id !== id)
            );
          }}
          onSendMessage={async (message: string) => {
            sendBoxProps.onSendMessage(message, {
              metadata: {
                fileSharingMetadata: JSON.stringify([
                  {
                    name: "TestFile.pdf",
                    extension: "pdf",
                    url: "https://test.com/test.pdf",
                  },
                ]),
              },
            });
          }}
        />
      )}
    </div>
  );
}

export default ChatComponents;
