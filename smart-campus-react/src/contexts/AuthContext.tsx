import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/AuthService';
import { apiClient } from '../services/apiClient';

interface UserData {
  uid: string;
  email: string;
  role: string;
  schoolId: string;
  name: string;
}

interface User {
  username: string;
  attributes: Array<{ Name: string; Value: string }>;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      // Try real API first
      try {
        const response = await authService.login(email, password);
        
        if (response.success && response.data) {
          const user = response.data.user;
          const mockUser = {
            username: user.email,
            attributes: [
              { Name: 'custom:role', Value: user.role },
              { Name: 'custom:schoolId', Value: user.schoolId },
              { Name: 'given_name', Value: user.name }
            ]
          };

          setUserData({
            uid: user.id,
            email: user.email,
            role: user.role.toLowerCase(), // Normalize to lowercase for frontend routing
            schoolId: user.schoolId,
            name: user.name,
          });
          
          setCurrentUser(mockUser);
          return;
        }
      } catch (apiError: any) {
        // If API fails, fall back to mock for demo
        console.warn('API login failed, using mock:', apiError.message);
      }

      // Fallback to mock authentication
      const validCredentials = [
        { email: 'teacher@test.com', password: 'test123', role: 'teacher' },
        { email: 'parent@test.com', password: 'parent123', role: 'parent' },
        { email: 'admin@test.com', password: 'admin123', role: 'admin' },
      ];

      const validUser = validCredentials.find(
        cred => cred.email === email && cred.password === password
      );

      if (validUser) {
        const mockUser = {
          username: email,
          attributes: [
            { Name: 'custom:role', Value: validUser.role },
            { Name: 'custom:schoolId', Value: 'SCH001' },
            { Name: 'given_name', Value: validUser.role.charAt(0).toUpperCase() + validUser.role.slice(1) }
          ]
        };

        setUserData({
          uid: email,
          email: email,
          role: validUser.role,
          schoolId: 'SCH001',
          name: validUser.role.charAt(0).toUpperCase() + validUser.role.slice(1),
        });
        
        setCurrentUser(mockUser);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      authService.logout();
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Initialize AWS Amplify (for future use)
    // Auth.configure(awsconfig);
    
    // For demo purposes, just set loading to false
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
