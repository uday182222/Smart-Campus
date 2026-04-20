/**
 * Teacher role — Bottom tabs + CustomDrawer overlay.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomDrawer } from '../components/CustomDrawer';
import { TeacherDrawerContent } from '../components/TeacherDrawerContent';
import { DrawerProvider, useDrawer } from '../contexts/DrawerContext';
import { TeacherTabNavigator } from './TeacherTabNavigator';

const Stack = createStackNavigator();

function TeacherStack() {
  const { isOpen, closeDrawer } = useDrawer();

  return (
    <CustomDrawer isOpen={isOpen} onClose={closeDrawer} drawerContent={<TeacherDrawerContent />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F5F6FA' },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} />
      </Stack.Navigator>
    </CustomDrawer>
  );
}

export function TeacherNavigator() {
  return (
    <DrawerProvider>
      <TeacherStack />
    </DrawerProvider>
  );
}
