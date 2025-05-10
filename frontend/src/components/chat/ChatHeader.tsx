import React from 'react';
import './Chat.css';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface ChatHeaderProps {
  user: User;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user }) => {
  return (
    <div className="chat-header">
      <div className="chat-user-info">
        <div className="chat-user-avatar">
        <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
          <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.name} />
          
        </div>
        <div className="chat-user-details">
          <h3>{user.name}</h3>
          <p className={`status-text ${user.isOnline ? 'online' : 'offline'}`}>
            {user.isOnline ? 'online' : 'last seen today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;