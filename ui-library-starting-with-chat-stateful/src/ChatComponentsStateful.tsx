import { ChatThreadClient } from '@azure/communication-chat';
import { usePropsFor, MessageThread, SendBox, RichTextSendBox, StatefulChatClient } from '@azure/communication-react';
import { useCallback } from 'react';
import { askAI, ContextItem } from './AIClient';
interface ChatComponentsProps {
  chatClient: StatefulChatClient;
  chatThreadClient: ChatThreadClient;
  threadId: string;
}

function ChatComponents(props: ChatComponentsProps): JSX.Element {
  const { chatClient, chatThreadClient, threadId } = props;

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

  const isBotMessage = useCallback((content: any) => {
    return content.startsWith('/bot')
  }, []);

  const getBotMessage = useCallback((content: any) => {
    // If the token is found, remove it from the message content.
    const msgToBot = content.slice(4).trim();
    return msgToBot;
  }, []);

  const getContextForBot = useCallback(() => {
    // get the history of the thread
    const messages = chatClient.getState().threads[threadId].chatMessages;
    const history: ContextItem[] = [];
    for (const [_, message] of Object.entries(messages)) {
      history.push({
        senderName: message.senderDisplayName ?? '',
        content: message.content?.message ?? ''
      });
    }
    return history;
  }, [chatClient, threadId]);

  const onSendMessage = useCallback(
    async (message: string) => {
      if (isBotMessage(message)) {
        // send message to bot
        console.log('Bot message detected, asking AI...');
        const botMessage = getBotMessage(message);
        const context = getContextForBot();
        const AIResponse = await askAI(botMessage, chatClient.getState().displayName, context);
        console.log('Bot response:', AIResponse);
        //TODO: Insert to the message list
        return
      }
    
      // directly call into stateful client
      const sendMessageRequest = {
        content: message,
        senderDisplayName: chatClient.getState().displayName
      };
      await chatThreadClient.sendMessage(sendMessageRequest);
    },
    [chatClient, chatThreadClient, getBotMessage, getContextForBot, isBotMessage]
  );

  const getSendBoxComponent = () => {
    if (richTextEditorEnabled) {
      return sendBoxProps && 
        <RichTextSendBox {...sendBoxProps} onSendMessage={onSendMessage}/>
    } else {
      return sendBoxProps && <SendBox {...sendBoxProps} onSendMessage={onSendMessage}/>
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
