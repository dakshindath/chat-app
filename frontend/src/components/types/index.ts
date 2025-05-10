// Common interfaces used throughout the application

// User interface
export interface User {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    isOnline: boolean;
  }
  
  // Message interface
  export interface Message {
    _id: string;
    sender: string;
    receiver: string;
    text: string;
    timestamp: string;
    hasAttachment?: boolean;
    attachmentType?: 'image' | 'video' | 'file';
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
  }
  
  // Authentication related interfaces
  export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    avatar?: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  // Socket related interfaces
  export interface SocketMessage {
    event: string;
    data: any;
  }
  
  // Component props interfaces
  export interface UserItemProps {
    user: User;
    isSelected?: boolean;
    onClick: () => void;
  }
  
  export interface MessageBubbleProps {
    message: Message;
    isSelf: boolean;
  }
  
  export interface ChatHeaderProps {
    user: User;
  }
  
  export interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    loading: boolean;
  }
  
  export interface MessageInputProps {
    onSendMessage: (text: string) => void;
  }
  
  export interface LeftSidebarProps {
    currentUser: User | null;
    recentChats: User[];
    selectedUser: User | null;
    onSelectUser: (user: User) => void;
    onLogout: () => void;
  }
  
  export interface RightSidebarProps {
    users: User[];
    loading: boolean;
    selectedUser: User | null;
    onSelectUser: (user: User) => void;
  }
  
  export interface ChatWindowProps {
    currentUser: User | null;
    selectedUser: User | null;
  }
  
  export interface ProtectedRouteProps {
    children: React.ReactNode;
  }