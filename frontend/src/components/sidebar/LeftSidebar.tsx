import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import UserItem from '../ui/UserItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutSharpIcon from '@mui/icons-material/LogoutSharp';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface LeftSidebarProps {
  currentUser: User | null;
  recentChats: User[];
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  currentUser, 
  recentChats, 
  selectedUser,
  onSelectUser,
  onLogout
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="sidebar left-sidebar">
      <div className="sidebar-header">
        <div className="user-profile-container">
          <div className="current-user">
            <div className="user-avatar">
              <img src={currentUser?.avatar || 'https://via.placeholder.com/40'} alt={currentUser?.name} />
              <span className={`status-indicator ${currentUser?.isOnline ? 'online' : 'offline'}`}></span>
            </div>
            <div className="user-info">
              <h3>{currentUser?.name}</h3>
              <p>{currentUser?.email}</p>
            </div>
          </div>
          <div className="dropdown-container" ref={dropdownRef}>
            <div className="dropdown-toggle" onClick={toggleDropdown}>
              <KeyboardArrowDownIcon fontSize="small" />
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={onLogout}>
                  <LogoutSharpIcon className="dropdown-icon" fontSize="small" />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="sidebar-title">Recent Chats</div>
      
      <div className="sidebar-content">
        {recentChats.length === 0 ? (
          <div className="no-chats-message">No recent conversations</div>
        ) : (
          recentChats.map(user => (
            <UserItem
              key={user._id}
              user={user}
              isSelected={selectedUser?._id === user._id}
              onClick={() => onSelectUser(user)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;