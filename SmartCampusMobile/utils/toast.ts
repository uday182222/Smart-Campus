import { Alert } from 'react-native';

export const Toast = {
  show: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`[Toast ${type}]: ${message}`);
  },
  success: (message: string) => Toast.show(message, 'success'),
  error: (message: string) => Toast.show(message, 'error'),
  info: (message: string) => Toast.show(message, 'info'),
};
