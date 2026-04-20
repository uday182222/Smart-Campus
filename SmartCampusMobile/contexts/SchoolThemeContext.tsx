import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SchoolTheme {
  schoolId: string;
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const defaultTheme: SchoolTheme = {
  schoolId: '',
  schoolName: '',
  logoUrl: null,
  primaryColor: '#1E40AF',
  secondaryColor: '#3B82F6',
};

interface SchoolThemeContextType {
  theme: SchoolTheme;
  setSchoolTheme: (theme: SchoolTheme) => Promise<void>;
  clearSchoolTheme: () => Promise<void>;
}

const SchoolThemeContext = createContext<SchoolThemeContextType>({
  theme: defaultTheme,
  setSchoolTheme: async () => {},
  clearSchoolTheme: async () => {},
});

export function SchoolThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SchoolTheme>(defaultTheme);

  const setSchoolTheme = async (newTheme: SchoolTheme) => {
    setTheme(newTheme);
    await AsyncStorage.setItem('schoolTheme', JSON.stringify(newTheme));
  };

  const clearSchoolTheme = async () => {
    setTheme(defaultTheme);
    await AsyncStorage.removeItem('schoolTheme');
  };

  useEffect(() => {
    AsyncStorage.getItem('schoolTheme').then((stored) => {
      if (stored) {
        try {
          setTheme(JSON.parse(stored));
        } catch (_e) {
          // ignore parse errors
        }
      }
    });
  }, []);

  return (
    <SchoolThemeContext.Provider value={{ theme, setSchoolTheme, clearSchoolTheme }}>
      {children}
    </SchoolThemeContext.Provider>
  );
}

export const useSchoolTheme = () => {
  const context = useContext(SchoolThemeContext);
  if (!context) {
    throw new Error('useSchoolTheme must be used within SchoolThemeProvider');
  }
  return context;
};
