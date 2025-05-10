import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isOnline: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string, avatar?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for user session on load
    const storedUser = localStorage.getItem('chat-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      setUser(response.data.user);
      localStorage.setItem('chat-user', JSON.stringify(response.data.user));
      localStorage.setItem('chat-token', response.data.token);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, avatar?: string) => {
    try {
      setLoading(true);
      const defaultAvatar = avatar || `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`;
      const response = await axios.post('http://localhost:5000/api/auth/register', { 
        name, 
        email, 
        password, 
        confirmPassword,
        avatar: defaultAvatar 
      });
      setUser(response.data);
      localStorage.setItem('chat-user', JSON.stringify(response.data));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Update user's online status to false when logging out
        const token = localStorage.getItem('chat-token');
        await axios.post('http://localhost:5000/api/auth/logout', 
          { userId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local storage and state even if the API call fails
      localStorage.removeItem('chat-user');
      localStorage.removeItem('chat-token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};