import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

import ProductionParentDashboard from '../screens/ProductionParentDashboard';
import MyChildrenScreen from '../screens/parent/MyChildrenScreen';
import ParentNotificationsScreen from '../screens/parent/ParentNotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AcademicHomeScreen from '../screens/parent/AcademicHomeScreen';
import AttendanceHistoryScreen from '../screens/parent/AttendanceHistoryScreen';
import ParentHomeworkScreen from '../screens/parent/ParentHomeworkScreen';
import ReportCardScreen from '../screens/parent/ReportCardScreen';
import ParentCalendarScreen from '../screens/parent/ParentCalendarScreen';
import FeeStatusScreen from '../screens/parent/FeeStatusScreen';
import BusTrackingScreen from '../screens/parent/BusTrackingScreen';
import GalleryScreen from '../screens/GalleryScreen';
import AppointmentsScreen from '../screens/parent/AppointmentsScreen';

const Tab = createBottomTabNavigator();
const HomeStackNav = createStackNavigator();
const AcademicStackNav = createStackNavigator();
const FeesStackNav = createStackNavigator();
const BusStackNav = createStackNavigator();
const GalleryStackNav = createStackNavigator();

const SO = { headerShown: false, gestureEnabled: true as const };

const horizontalPush = {
  gestureEnabled: true as const,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
};

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <HomeStackNav.Screen
        name="ParentDashboard"
        component={ProductionParentDashboard}
        options={{ gestureEnabled: false }}
      />
      <HomeStackNav.Screen name="MyChildren" component={MyChildrenScreen} />
      <HomeStackNav.Screen name="Notifications" component={ParentNotificationsScreen} options={horizontalPush} />
      <HomeStackNav.Screen name="Profile" component={ProfileScreen} options={horizontalPush} />
      <HomeStackNav.Screen name="Settings" component={SettingsScreen} options={horizontalPush} />
    </HomeStackNav.Navigator>
  );
}

function AcademicStack() {
  return (
    <AcademicStackNav.Navigator screenOptions={SO}>
      <AcademicStackNav.Screen name="AcademicHome" component={AcademicHomeScreen} />
      <AcademicStackNav.Screen name="Attendance" component={AttendanceHistoryScreen} />
      <AcademicStackNav.Screen name="Homework" component={ParentHomeworkScreen} />
      <AcademicStackNav.Screen name="ReportCard" component={ReportCardScreen} />
      <AcademicStackNav.Screen name="Calendar" component={ParentCalendarScreen} />
    </AcademicStackNav.Navigator>
  );
}

function FeesStack() {
  return (
    <FeesStackNav.Navigator screenOptions={SO}>
      <FeesStackNav.Screen name="FeeStatus" component={FeeStatusScreen} />
    </FeesStackNav.Navigator>
  );
}

function BusStack() {
  return (
    <BusStackNav.Navigator screenOptions={SO}>
      <BusStackNav.Screen name="BusTracking" component={BusTrackingScreen} />
    </BusStackNav.Navigator>
  );
}

function GalleryStack() {
  return (
    <GalleryStackNav.Navigator screenOptions={SO}>
      <GalleryStackNav.Screen name="Gallery" component={GalleryScreen} />
      <GalleryStackNav.Screen name="Appointments" component={AppointmentsScreen} />
      <GalleryStackNav.Screen name="Settings" component={SettingsScreen} />
      <GalleryStackNav.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      />
    </GalleryStackNav.Navigator>
  );
}

export function ParentTabNavigator() {
  return (
    <Tab.Navigator tabBar={() => null} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="ParentHome" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="ParentAcademic" component={AcademicStack} options={{ title: 'Academic' }} />
      <Tab.Screen name="ParentFees" component={FeesStack} options={{ title: 'Fees' }} />
      <Tab.Screen name="ParentBus" component={BusStack} options={{ title: 'Bus' }} />
      <Tab.Screen name="ParentGallery" component={GalleryStack} options={{ title: 'Gallery' }} />
    </Tab.Navigator>
  );
}
