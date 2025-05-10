import React from 'react';
import './UI.css';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface UserItemProps {
  user: User;
  isSelected?: boolean;
  onClick: () => void;
}

const UserItem: React.FC<UserItemProps> = ({ user, isSelected = false, onClick }) => {
  return (
    <div 
      className={`user-item ${isSelected ? 'selected' : ''}`} 
      onClick={onClick}
    >
      <div className="user-item-avatar">
        <img src={user.avatar || 'https://via.placeholder.com/40'} alt={user.name} />
        <span className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`}></span>
      </div>
      <div className="user-item-info">
        <h4>{user.name}</h4>
        <p>{user.email}</p>
      </div>
    </div>
  );
};

export default UserItem;