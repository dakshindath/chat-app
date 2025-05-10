import React from 'react';
import './UI.css';
import { Message } from '../types';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import GetAppIcon from '@mui/icons-material/GetApp';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf }) => {
  const messageTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Render attachment based on type
  const renderAttachment = () => {
    if (!message.hasAttachment) return null;    const handleDownload = () => {
      // For direct download of non-displayable files
      const link = document.createElement('a');
      link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${message.attachmentUrl}`;
      link.download = message.attachmentName!;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };switch (message.attachmentType) {
      case 'image':
        return (
          <div className="attachment-container">
            <img 
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${message.attachmentUrl}`} 
              alt={message.attachmentName} 
              className="attachment-image" 
              onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${message.attachmentUrl}`, '_blank')}
            />
            <span className="attachment-name">{message.attachmentName}</span>
          </div>
        );
      case 'video':
        return (
          <div className="attachment-container">
            <video 
              src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${message.attachmentUrl}`} 
              controls 
              className="attachment-video"
            />
            <span className="attachment-name">{message.attachmentName}</span>
          </div>
        );
      case 'file':
        return (
          <div className="attachment-file" onClick={handleDownload}>
            <InsertDriveFileIcon className="file-icon" />
            <div className="file-details">
              <span className="file-name">{message.attachmentName}</span>
              <span className="file-size">{formatFileSize(message.attachmentSize || 0)}</span>
            </div>
            <GetAppIcon className="download-icon" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`message-bubble-container ${isSelf ? 'self' : 'other'}`}>
      <div className={`message-bubble ${isSelf ? 'self' : 'other'}`}>
        {message.text && <p className="message-text">{message.text}</p>}
        {message.hasAttachment && renderAttachment()}
        <span className="message-time">{messageTime}</span>
      </div>
    </div>
  );
};

export default MessageBubble;