// @ts-nocheck
/**
 * Modern Bottom Tab Navigator - Beautiful tab bar
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { colors, spacing, typography, gradients, shadows, borderRadius } from '../theme';

// Screens
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import AttendanceScreen from '../screens/teacher/AttendanceScreen';
import HomeworkScreen from '../screens/teacher/HomeworkScreen';
import ParentDashboard from '../screens/parent/ParentDashboard';
import TransportTrackingScreen from '../screens/parent/TransportTrackingScreen';
import GalleryScreen from '../screens/GalleryScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
  color?: string;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, icon, label, color = colors.primary.main, badge }) => {
  const scale = useSharedValue(focused ? 1 : 0.9);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
      {focused && (
        <LinearGradient
          colors={[color + '20', color + '10']}
          style={styles.iconBackground}
        />
      )}
      <MaterialCommunityIcons
        name={icon as any}
        size={24}
        color={focused ? color : colors.text.tertiary}
      />
      <Text style={[styles.tabLabel, focused && { color, fontWeight: '600' }]}>
        {label}
      </Text>
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// Teacher Tab Navigator
export const TeacherTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="view-dashboard"
              label="Home"
              color={colors.primary.main}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Classes"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="google-classroom"
              label="Classes"
              color={colors.secondary.main}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={HomeworkScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="calendar-month"
              label="Schedule"
              color={colors.accent.orange}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={GalleryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="account-circle"
              label="Profile"
              color={colors.accent.purple}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tab.Navigator>
  );
};

// Parent Tab Navigator
export const ParentTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ParentDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="view-dashboard"
              label="Home"
              color={colors.secondary.main}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={HomeworkScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="calendar-month"
              label="Calendar"
              color={colors.primary.main}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={GalleryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="bell"
              label="Alerts"
              color={colors.accent.orange}
              badge={3}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={TransportTrackingScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="account-circle"
              label="Profile"
              color={colors.accent.purple}
            />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 88 : 70,
    backgroundColor: colors.background.white,
    borderTopWidth: 0,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.large,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  iconBackground: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -8,
    right: -8,
    borderRadius: borderRadius.large,
  },
  tabLabel: {
    ...typography.tiny,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.tiny,
    color: colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },
});

export default TeacherTabNavigator;

