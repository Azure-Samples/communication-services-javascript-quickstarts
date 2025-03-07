import { ChatThreadClient } from '@azure/communication-chat';
import { usePropsFor, MessageThread, SendBox, RichTextSendBox, StatefulChatClient, ChatMessage } from '@azure/communication-react';
import { useCallback, useEffect, useState } from 'react';
import { askAI, ContextItem } from './AIClient';
interface ChatComponentsProps {
  chatClient: StatefulChatClient;
  chatThreadClient: ChatThreadClient;
  threadId: string;
  userId: string;
  displayName: string;
}

function ChatComponents(props: ChatComponentsProps): JSX.Element {
  const { chatClient, chatThreadClient, threadId, userId, displayName } = props;

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

  const [messages, setMessages] = useState<ChatMessage[]>((messageThreadProps?.messages as ChatMessage[]) ?? []);
  useEffect(() => {
    // merge messageThreadProps.messages with local messages
    if (messageThreadProps?.messages) {
      
      setMessages(prevMessages => {
        const serverMessages = messageThreadProps.messages as ChatMessage[];
        const mergedMessages = [...prevMessages, ...serverMessages];
        // Remove duplicate messages based on messageId
        const uniqueMessages = Array.from(new Set(mergedMessages.map(msg => msg.messageId)))
          .map(id => mergedMessages.find(msg => msg.messageId === id))
          .filter((msg): msg is ChatMessage => msg !== undefined && msg.messageId !== "");        
        return uniqueMessages.sort((a, b) => a.createdOn.getTime() - b.createdOn.getTime());
      });
    }
  }, [messageThreadProps?.messages]);

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
      console.log('======================================onSendMessage======================================');

      if (!message) {
        return;
      }
      if (isBotMessage(message)) {
        const promptMessage: ChatMessage = {
          messageId: Math.random().toString(),
          messageType: 'chat',
          content: message,
          senderId: userId,
          senderDisplayName: displayName,
          createdOn: new Date(),
          status: 'seen',
          contentType: 'text',
          mine: true
        };
        console.log('======================================setMessages2======================================');
        setMessages(prevMessages => [...prevMessages, promptMessage]);
        // send message to bot
        console.log('Bot message detected, asking AI...');
        const botMessage = getBotMessage(message);
        const context = getContextForBot();
        if (!botMessage) {
          return;
        }
        const AIResponse = await askAI(botMessage, chatClient.getState().displayName, context);
        console.log('Bot response:', AIResponse);
        // Insert to the message list
        const messageId = Math.random().toString();
        const newMessage: ChatMessage = {
          messageId: messageId,
          messageType: 'chat',
          content: AIResponse,
          senderId: 'bot',
          senderDisplayName: 'Bot',
          createdOn: new Date(),
          status: 'seen',
          contentType: 'text'
        };
        console.log('======================================setMessages3======================================');
        setMessages(prevMessages => [...prevMessages, newMessage]);
        return
      }
    
      // directly call into stateful client
      const sendMessageRequest = {
        content: message,
        senderDisplayName: chatClient.getState().displayName
      };
      console.log('Sending message:', message);
      
      await chatThreadClient.sendMessage(sendMessageRequest);
    },
    [chatClient, chatThreadClient, displayName, getBotMessage, getContextForBot, isBotMessage, userId]
  );

  const onMessageSeen = useCallback(
    async (messageId: string) => {
      const message = messages.find(msg => msg.messageId === messageId);
      console.log('Message seen:', message?.content);

      if (isBotMessage(message?.content)) {
        return;
      }
      // directly call into stateful client
      await chatThreadClient.sendReadReceipt({ chatMessageId: messageId });
    },
    [chatThreadClient, isBotMessage, messages]
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
          messages={messages}
          onMessageSeen={onMessageSeen}
          richTextEditorOptions={ richTextEditorEnabled ? {} : undefined } />
        }
      </div>
      <div style={{ margin: '0.5rem 0' }}>
        {getSendBoxComponent()}
      </div>
    </div>
  );
}

export default ChatComponents;
