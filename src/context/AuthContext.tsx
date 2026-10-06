/**
 * Authentication Context
 * Manages user session, secure login, registration, and logout.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeUser } from '../types';
import * as db from '../services/db';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface AuthContextType {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateName: (newName: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = 'finpredict_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedId = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedId) {
        const uid = parseInt(storedId, 10);
        const existing = db.getUserById(uid);
        if (existing) {
          setUser(existing);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Session restoration failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const foundUser = db.getUserByEmail(email);
      if (!foundUser) {
        return { success: false, error: 'Invalid email ID or password. Please verify your credentials.' };
      }

      const isMatch = await verifyPassword(foundUser.password_hash, password);
      if (!isMatch) {
        return { success: false, error: 'Invalid email ID or password. Please verify your credentials.' };
      }

      const { password_hash: _, ...safe } = foundUser;
      setUser(safe);
      localStorage.setItem(SESSION_STORAGE_KEY, safe.id.toString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login encountered an unexpected error.' };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const existing = db.getUserByEmail(email);
      if (existing) {
        return { success: false, error: 'An account with this email address already exists. Please log in instead.' };
      }

      const passwordHash = await hashPassword(password);
      const safe = db.createUser(name, email, passwordHash);
      setUser(safe);
      localStorage.setItem(SESSION_STORAGE_KEY, safe.id.toString());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const updateName = async (newName: string): Promise<boolean> => {
    if (!user) return false;
    const ok = db.updateUserName(user.id, newName);
    if (ok) {
      setUser({ ...user, name: newName });
    }
    return ok;
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    const newHash = await hashPassword(newPassword);
    return db.updateUserPassword(user.id, newHash);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateName,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
