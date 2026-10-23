import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; mockOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@miniledger_token');
        if (storedToken) {
          setToken(storedToken);
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            // Token invalid or expired
            await AsyncStorage.removeItem('@miniledger_token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const sendOtp = async (phone: string) => {
    return await api.sendOtp(phone);
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const res = await api.verifyOtp(phone, otp);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'OTP verification failed' };
  };

  const logout = async () => {
    await api.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const res = await api.getMe();
    if (res.success && res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        sendOtp,
        verifyOtp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
