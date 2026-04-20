import "./global.css";
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './contexts/AuthContext';
import { SchoolThemeProvider } from './contexts/SchoolThemeContext';
import { ActiveChildProvider } from './contexts/ActiveChildContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SchoolThemeProvider>
          <AuthProvider>
            <ActiveChildProvider>
              <AppNavigator />
            </ActiveChildProvider>
          </AuthProvider>
        </SchoolThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
