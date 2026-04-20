import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'superAdminAccent';
const DEFAULT_ACCENT = '#CBFF00';

export function useSuperAdminAccent() {
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setAccent(saved);
      setLoaded(true);
    });
  }, []);

  const saveAccent = async (color: string) => {
    setAccent(color);
    await AsyncStorage.setItem(STORAGE_KEY, color);
  };

  const isFirstLaunch = (): Promise<boolean> =>
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => saved === null);

  return { accent, saveAccent, loaded, isFirstLaunch };
}
