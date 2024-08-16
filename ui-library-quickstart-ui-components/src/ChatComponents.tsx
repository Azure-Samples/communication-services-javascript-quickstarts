import {
  MessageThread,
  ChatMessage as WebUiChatMessage,
  SendBox,
  MessageStatus,
  MessageContentType,
  DEFAULT_COMPONENT_ICONS,
  RichTextSendBox
} from '@azure/communication-react';
import React, { useEffect } from 'react';
import { registerIcons } from '@fluentui/react';

export const ChatComponents = (): JSX.Element => {

  /**
   * By default, the `richTextEditorEnabled` is set to false,
   * which means the plain text editor will be used for the SendBox component and the MessageThread component's edit function.
   * Change this value to true to use the Rich Text Editor instead,
   * which provides rich text formatting, table inserting etc.
   */
  const richTextEditorEnabled = false

  useEffect(() => {
    registerIcons({ icons: DEFAULT_COMPONENT_ICONS });
  }, [])

  //A sample chat history
  const GetHistoryChatMessages = (): WebUiChatMessage[] => {
    return [
      {
        messageType: 'chat',
        contentType: 'text' as MessageContentType,
        senderId: '1',
        senderDisplayName: 'User1',
        messageId: Math.random().toString(),
        content: 'Hi everyone, I created this awesome group chat for us!',
        createdOn: new Date('2019-04-13T00:00:00.000+08:10'),
        mine: true,
        attached: false,
        status: 'seen' as MessageStatus
      },
      {
        messageType: 'chat',
        contentType: 'text' as MessageContentType,
        senderId: '2',
        senderDisplayName: 'User2',
        messageId: Math.random().toString(),
        content: 'Nice! This looks great!',
        createdOn: new Date('2019-04-13T00:00:00.000+08:09'),
        mine: false,
        attached: false
      },
      {
        messageType: 'chat',
        contentType: 'text' as MessageContentType,
        senderId: '3',
        senderDisplayName: 'User3',
        messageId: Math.random().toString(),
        content: "Yeah agree, let's chat here from now on!",
        createdOn: new Date('2019-04-13T00:00:00.000+08:09'),
        mine: false,
        attached: false
      }
    ];
  };

  const getSendBoxComponent = () => {
    if (richTextEditorEnabled) {
      return (
        <RichTextSendBox
          onSendMessage={async () => {
          return;
        }} 
        onInsertInlineImage={() => {
          return
        }}
        />
      )
    }

    return (
      <SendBox
      disabled={false}
      onSendMessage={async () => {
        return;
      }}
      onTyping={async () => {
        return;
      }}
    />
    )
  }

  return (
    <div style={{ height: '30rem', width: '30rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Chat thread component with message status indicator feature enabled */}
      <MessageThread userId={'1'} messages={GetHistoryChatMessages()} showMessageStatus={true} 
        richTextEditorOptions={{ 
          onInsertInlineImage: () => {
            return
          } 
        }} 
      />
      {getSendBoxComponent()}
    </div>
  );
};