import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LeftSidebar from '../sidebar/LeftSidebar';
import ChatWindow from '../chat/ChatWindow';
import RightSidebar from '../sidebar/RightSidebar';
import './chatLayout.css';
import { User } from '../types';

const ChatLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('chat-token');
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter out current user
        const filteredUsers = response.data.filter((u: User) => u._id !== user?._id);
        setUsers(filteredUsers);
        
        // For demo purposes, set the first few users as recent chats
        setRecentChats(filteredUsers.slice(0, 3));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Update users with online status when onlineUsers changes
  useEffect(() => {
    if (onlineUsers.length > 0 && users.length > 0) {
      // Create a map of user IDs to online status
      const onlineStatusMap = onlineUsers.reduce((map, onlineUser) => {
        map[onlineUser._id] = onlineUser.isOnline;
        return map;
      }, {} as Record<string, boolean>);

      // Update users list with online status
      const updatedUsers = users.map(userItem => ({
        ...userItem,
        isOnline: onlineStatusMap[userItem._id] ?? false
      }));
      setUsers(updatedUsers);

      // Update recent chats with online status
      const updatedRecentChats = recentChats.map(userItem => ({
        ...userItem,
        isOnline: onlineStatusMap[userItem._id] ?? false
      }));
      setRecentChats(updatedRecentChats);

      // Update selected user if present
      if (selectedUser && onlineStatusMap.hasOwnProperty(selectedUser._id)) {
        setSelectedUser({
          ...selectedUser,
          isOnline: onlineStatusMap[selectedUser._id]
        });
      }
    }
  }, [onlineUsers]);

  const handleUserSelect = (selected: User) => {
    setSelectedUser(selected);
    
    // Add to recent chats if not already there
    if (!recentChats.find(chat => chat._id === selected._id)) {
      setRecentChats(prev => [selected, ...prev].slice(0, 10));
    }
  };

  return (
    <div className="chat-layout">
      <LeftSidebar 
        currentUser={user} 
        recentChats={recentChats} 
        onSelectUser={handleUserSelect}
        selectedUser={selectedUser}
        onLogout={logout}
      />
      <ChatWindow 
        currentUser={user}
        selectedUser={selectedUser} 
      />
      <RightSidebar 
        users={users} 
        loading={loading}
        onSelectUser={handleUserSelect}
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default ChatLayout;