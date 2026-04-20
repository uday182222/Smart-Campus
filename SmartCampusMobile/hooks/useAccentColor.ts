import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';

/**
 * Returns the correct accent color for ANY role:
 * SUPER_ADMIN → their chosen accent (from AsyncStorage)
 * All others  → school's primaryColor (from SchoolThemeContext)
 */
export function useAccentColor(): string {
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
  const [superAdminAccent, setSuperAdminAccent] = useState('#CBFF00');

  useEffect(() => {
    if (userData?.role === 'SUPER_ADMIN' || userData?.role === 'super_admin') {
      AsyncStorage.getItem('superAdminAccent').then((saved) => {
        if (saved) setSuperAdminAccent(saved);
      });
    }
  }, [userData?.role]);

  if (userData?.role === 'SUPER_ADMIN' || userData?.role === 'super_admin') {
    return superAdminAccent;
  }
  return theme.primaryColor || '#CBFF00';
}
