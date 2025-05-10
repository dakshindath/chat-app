import React from 'react';
import './Chat.css';
import MessageBubble from '../ui/MessageBubble';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, loading }) => {
  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return <div className="messages-loading">Loading messages...</div>;
  }

  if (messages.length === 0) {
    return <div className="messages-empty">No messages yet. Start the conversation!</div>;
  }

  return (
    <div className="message-list">
      {Object.keys(groupedMessages).map(date => (
        <div key={date} className="message-group">
          <div className="message-date">{date}</div>
          {groupedMessages[date].map(message => (
            <MessageBubble
              key={message._id}
              message={message}
              isSelf={message.sender === currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;