/**
 * Admin role — Stack Navigator inside CustomDrawer. Real React Navigation.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { CustomDrawer } from '../components/CustomDrawer';
import { AdminDrawerContent } from '../components/AdminDrawerContent';
import { DrawerProvider, useDrawer } from '../contexts/DrawerContext';

import ProductionAdminDashboard from '../screens/ProductionAdminDashboard';
import PendingRequestsScreen from '../screens/admin/PendingRequestsScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ClassManagementScreen from '../screens/admin/ClassManagementScreen';
import AttendanceReportScreen from '../screens/admin/AttendanceReportScreen';
import FeeReportScreen from '../screens/admin/FeeReportScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import SchoolProfileScreen from '../screens/admin/SchoolProfileScreen';
import EventsScreen from '../screens/admin/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

function AdminStack() {
  const { isOpen, closeDrawer } = useDrawer();

  return (
    <CustomDrawer
      isOpen={isOpen}
      onClose={closeDrawer}
      drawerContent={<AdminDrawerContent />}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F5F6FA' },
          gestureEnabled: false,
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: { opacity: current.progress },
          }),
        }}
      >
        <Stack.Screen name="AdminDashboard" component={ProductionAdminDashboard} />
        <Stack.Screen name="PendingRequests" component={PendingRequestsScreen} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} />
        <Stack.Screen name="ClassManagement" component={ClassManagementScreen} />
        <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} />
        <Stack.Screen name="FeeReport" component={FeeReportScreen} />
        <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
        <Stack.Screen name="SchoolProfile" component={SchoolProfileScreen} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </CustomDrawer>
  );
}

export function AdminNavigator() {
  return (
    <DrawerProvider>
      <AdminStack />
    </DrawerProvider>
  );
}
