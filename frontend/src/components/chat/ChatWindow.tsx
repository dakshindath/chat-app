import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './Chat.css';
import { User, Message } from '../../components/types/index';

interface ChatWindowProps {
  currentUser: User | null;
  selectedUser: User | null;
}

// For tracking temp messages
interface TempMessage {
  tempId: string;
  text: string;
  timestamp: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, selectedUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSelectedUserRef = useRef<string | null>(null);
  const [tempMessages, setTempMessages] = useState<TempMessage[]>([]);
  const processedMsgIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only fetch messages if the selected user has changed
    if (currentUser && selectedUser) {
      if (prevSelectedUserRef.current !== selectedUser._id) {
        fetchMessages();
        prevSelectedUserRef.current = selectedUser._id;
        // Reset when conversation changes
        setTempMessages([]);
        processedMsgIds.current.clear();
      }
    } else {
      setMessages([]);
      prevSelectedUserRef.current = null;
    }
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        console.log('Socket message received:', message);

        // Check if message belongs to current conversation
        if (
          (currentUser && selectedUser) && 
          ((message.sender === currentUser._id && message.receiver === selectedUser._id) ||
           (message.sender === selectedUser._id && message.receiver === currentUser._id))
        ) {
          // Skip if we've already processed this message
          if (processedMsgIds.current.has(message._id)) {
            return;
          }

          // For messages sent by current user
          if (message.sender === currentUser._id) {
            // Find temp message that matches
            const tempMsgIndex = tempMessages.findIndex(
              tm => tm.text === message.text && 
                  Math.abs(new Date(tm.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000
            );

            if (tempMsgIndex >= 0) {
              // Replace temp message with real one
              setMessages(prev => prev.map(msg => 
                msg._id === tempMessages[tempMsgIndex].tempId ? message : msg
              ));
              
              // Remove the temp message
              setTempMessages(prev => prev.filter((_, i) => i !== tempMsgIndex));
              
              // Mark as processed
              processedMsgIds.current.add(message._id);
              return;
            }
          }
          
          // Add the message if not a match with a temp message
          processedMsgIds.current.add(message._id);
          setMessages(prev => [...prev, message]);
        }
      };

      socket.on('receive-message', handleReceiveMessage);

      return () => {
        socket.off('receive-message', handleReceiveMessage);
      };
    }
  }, [socket, currentUser, selectedUser, tempMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('chat-token');
      const response = await axios.get(
        `http://localhost:5000/api/messages?senderId=${currentUser._id}&receiverId=${selectedUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mark all fetched messages as processed
      response.data.forEach((msg: Message) => {
        processedMsgIds.current.add(msg._id);
      });
      
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };
  const sendMessage = async (text: string, fileAttachment?: {
    hasAttachment: boolean;
    attachmentType: 'image' | 'video' | 'file';
    attachmentUrl: string;
    attachmentName: string;
    attachmentSize: number;
  }) => {
    if (!currentUser || !selectedUser || (!text.trim() && !fileAttachment)) return;

    try {
      // Create temporary ID and timestamp
      const tempId = `temp-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Create message object
      const newMessage: any = {
        sender: currentUser._id,
        receiver: selectedUser._id,
        text: text.trim() || ''
      };
      
      // Add attachment data if present
      if (fileAttachment) {
        newMessage.hasAttachment = true;
        newMessage.attachmentType = fileAttachment.attachmentType;
        newMessage.attachmentUrl = fileAttachment.attachmentUrl;
        newMessage.attachmentName = fileAttachment.attachmentName;
        newMessage.attachmentSize = fileAttachment.attachmentSize;
      }
      
      // Add temporary message to UI
      const tempMessage: Message = {
        ...newMessage,
        _id: tempId,
        timestamp
      };
      
      // Track this temporary message
      setTempMessages(prev => [...prev, { tempId, text: text.trim() || '', timestamp }]);
      
      // Add to UI
      setMessages(prev => [...prev, tempMessage]);
      
      // Send via socket
      if (socket && isConnected) {
        socket.send(JSON.stringify({
          event: 'send-message',
          data: newMessage
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="chat-window">
      {selectedUser ? (
        <>
          <ChatHeader user={selectedUser} />
          <div className="message-container">
            <MessageList 
              messages={messages} 
              currentUserId={currentUser?._id || ''} 
              loading={loading} 
            />
            <div ref={messagesEndRef} />
          </div>
          <MessageInput onSendMessage={sendMessage} />
        </>
      ) : (
        <div className="chat-placeholder">
          <div className="placeholder-content">
            <h3>Select a user to start chatting</h3>
            <p>Choose from the list of users on either side</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;