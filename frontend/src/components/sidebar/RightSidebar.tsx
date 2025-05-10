import React from 'react';
import './Sidebar.css';
import UserItem from '../ui/UserItem';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface RightSidebarProps {
  users: User[];
  loading: boolean;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  users, 
  loading, 
  selectedUser,
  onSelectUser 
}) => {
  return (
    <div className="sidebar right-sidebar">
      <div className="sidebar-title">All Users</div>
      
      <div className="sidebar-content">
        {loading ? (
          <div className="loading-message">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="no-users-message">No users found</div>
        ) : (
          users.map(user => (
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

export default RightSidebar;