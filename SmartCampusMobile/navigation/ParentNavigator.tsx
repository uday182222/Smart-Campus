/**
 * Parent role — Bottom tabs + CustomDrawer overlay.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomDrawer } from '../components/CustomDrawer';
import { ParentDrawerContent } from '../components/ParentDrawerContent';
import { DrawerProvider, useDrawer } from '../contexts/DrawerContext';
import { ParentTabNavigator } from './ParentTabNavigator';

const Stack = createStackNavigator();

function ParentStack() {
  const { isOpen, closeDrawer } = useDrawer();

  return (
    <CustomDrawer isOpen={isOpen} onClose={closeDrawer} drawerContent={<ParentDrawerContent />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F5F6FA' },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />
      </Stack.Navigator>
    </CustomDrawer>
  );
}

export function ParentNavigator() {
  return (
    <DrawerProvider>
      <ParentStack />
    </DrawerProvider>
  );
}
