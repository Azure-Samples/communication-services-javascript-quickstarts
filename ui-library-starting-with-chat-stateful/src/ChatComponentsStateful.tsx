import { usePropsFor, MessageThread, SendBox, RichTextSendBox } from '@azure/communication-react';

function ChatComponents(): JSX.Element {
  const messageThreadProps = usePropsFor(MessageThread);
  const sendBoxProps = usePropsFor(SendBox);
/**
 * By default, the `richTextEditorEnabled` is set to false,
 * which means the plain text editor will be used for the SendBox component and the MessageThread component's edit function.
 * Change this value to true to use the Rich Text Editor instead,
 * which provides rich text formatting, table inserting etc.
 * Note that inserting inline images is not enabled for this Quickstart.
 * Please use the `ui-library-quickstart-teams-interop-meeting-chat` Quickstart to try out the inline image inserting function.
 * https://github.com/Azure-Samples/communication-services-javascript-quickstarts/tree/main/ui-library-quickstart-teams-interop-meeting-chat
 */
  const richTextEditorEnabled = false

  const getSendBoxComponent = () => {
    if (richTextEditorEnabled) {
      return sendBoxProps && 
        <RichTextSendBox {...sendBoxProps} />
    } else {
      return sendBoxProps && <SendBox {...sendBoxProps} />
    }
  }
  

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', padding: '0 0.5rem' }}>
      <div style={{ overflow: 'auto', maxHeight: '100%', flexGrow: 1 }}>
        {/*Props are updated asynchronously, so only render the component once props are populated.*/}
        { messageThreadProps && <MessageThread 
          {...messageThreadProps}
          richTextEditorOptions={ richTextEditorEnabled ? {} : undefined } />}
      </div>
      <div style={{ margin: '0.5rem 0' }}>
        {getSendBoxComponent()}
      </div>
    </div>
  );
}

export default ChatComponents;