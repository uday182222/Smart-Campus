/**
 * Bus Helper — Stack: ConductorPortal (HOME), RouteDetail, ActiveTrip, TripSummary, TripHistory, Profile, Settings.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConductorPortalScreen from '../screens/transport/ConductorPortalScreen';
import RouteDetailScreen from '../screens/transport/RouteDetailScreen';
import ActiveTripScreen from '../screens/transport/ActiveTripScreen';
import TripSummaryScreen from '../screens/transport/TripSummaryScreen';
import TripHistoryScreen from '../screens/transport/TripHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

export function BusHelperNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { backgroundColor: '#EEF2FF' },
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: { opacity: current.progress },
        }),
      }}
    >
      <Stack.Screen name="ConductorPortal" component={ConductorPortalScreen} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
      <Stack.Screen name="ActiveTrip" component={ActiveTripScreen} />
      <Stack.Screen name="TripSummary" component={TripSummaryScreen} />
      <Stack.Screen name="TripHistory" component={TripHistoryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
