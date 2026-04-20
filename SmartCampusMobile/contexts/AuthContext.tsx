import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { User } from '../services/AuthService';

interface AuthContextType {
  currentUser: User | null;
  userData: User | null;
  schoolData: { id: string; name: string } | null;
  loading: boolean;
  login: (email: string, password: string, schoolId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [schoolData, setSchoolData] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Safety: never stay on loading screen longer than 2.5s
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 2500);

    const initializeAuth = async () => {
      try {
        const user = await AuthService.restoreSession();
        if (cancelled) return;
        if (user) {
          setCurrentUser(user);
          setUserData(user);
          setSchoolData(user.school ? { id: user.school.id, name: user.school.name } : null);
        } else {
          setCurrentUser(null);
          setUserData(null);
          setSchoolData(null);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        if (!cancelled) {
          setCurrentUser(null);
          setUserData(null);
          setSchoolData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string, schoolId?: string) => {
    setLoading(true);
    try {
      const result = await AuthService.login(email, password, schoolId);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setUserData(result.user);
        setSchoolData(result.user.school ? { id: result.user.school.id, name: result.user.school.name } : null);
      } else {
        throw new Error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setCurrentUser(null);
      setUserData(null);
      setSchoolData(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser,
    userData,
    schoolData,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
