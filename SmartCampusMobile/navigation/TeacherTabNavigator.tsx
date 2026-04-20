import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';

import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import ClassesHomeScreen from '../screens/teacher/ClassesHomeScreen';
import AttendanceScreen from '../screens/teacher/AttendanceScreen';
import MarksEntryScreen from '../screens/teacher/MarksEntryScreen';
import HomeworkScreen from '../screens/teacher/HomeworkScreen';
import HomeworkCreateScreen from '../screens/teacher/HomeworkCreateScreen';
import MyStudentsScreen from '../screens/teacher/MyStudentsScreen';
import RemarksScreen from '../screens/teacher/RemarksScreen';
import MessagesScreen from '../screens/teacher/MessagesScreen';
import TeacherMoreScreen from '../screens/teacher/TeacherMoreScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const HomeStackNav = createStackNavigator();
const ClassesStackNav = createStackNavigator();
const HomeworkStackNav = createStackNavigator();
const StudentsStackNav = createStackNavigator();
const MoreStackNav = createStackNavigator();

const SO = { headerShown: false, gestureEnabled: true as const };

const TABS = [
  { name: 'TeacherHome', label: 'Home', icon: 'home-variant' as const },
  { name: 'TeacherClasses', label: 'Classes', icon: 'google-classroom' as const },
  { name: 'TeacherHomework', label: 'Homework', icon: 'book-open-variant' as const },
  { name: 'TeacherStudents', label: 'Students', icon: 'account-group' as const },
  { name: 'TeacherMore', label: 'More', icon: 'dots-grid' as const },
];

function CustomTabBar({ state, navigation }: any) {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        paddingHorizontal: 4,
        minHeight: 72,
        borderTopWidth: 0,
        shadowColor: '#6B7280',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const tab = TABS[index];
        const isFocused = state.index === index;
        if (!tab) return null;

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isFocused ? `${primary}26` : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 2,
              }}
            >
              <MaterialCommunityIcons name={tab.icon} size={24} color={isFocused ? primary : '#9CA3AF'} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: isFocused ? '700' : '400', color: isFocused ? primary : '#9CA3AF' }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={SO}>
      <HomeStackNav.Screen name="TeacherDashboard" component={TeacherDashboard} />
      <HomeStackNav.Screen name="Profile" component={ProfileScreen} />
      <HomeStackNav.Screen name="Settings" component={SettingsScreen} />
    </HomeStackNav.Navigator>
  );
}

function ClassesStack() {
  return (
    <ClassesStackNav.Navigator screenOptions={SO}>
      <ClassesStackNav.Screen name="ClassesHome" component={ClassesHomeScreen} />
      <ClassesStackNav.Screen name="Attendance" component={AttendanceScreen} />
      <ClassesStackNav.Screen name="MarksEntry" component={MarksEntryScreen} />
    </ClassesStackNav.Navigator>
  );
}

function HomeworkStack() {
  return (
    <HomeworkStackNav.Navigator screenOptions={SO}>
      <HomeworkStackNav.Screen name="Homework" component={HomeworkScreen} />
      <HomeworkStackNav.Screen name="HomeworkCreate" component={HomeworkCreateScreen} />
    </HomeworkStackNav.Navigator>
  );
}

function StudentsStack() {
  return (
    <StudentsStackNav.Navigator screenOptions={SO}>
      <StudentsStackNav.Screen name="MyStudents" component={MyStudentsScreen} />
      <StudentsStackNav.Screen name="Remarks" component={RemarksScreen} />
      <StudentsStackNav.Screen name="Messages" component={MessagesScreen} />
    </StudentsStackNav.Navigator>
  );
}

function MoreStack() {
  return (
    <MoreStackNav.Navigator screenOptions={SO}>
      <MoreStackNav.Screen name="TeacherMore" component={TeacherMoreScreen} />
      <MoreStackNav.Screen name="Calendar" component={CalendarScreen} />
      <MoreStackNav.Screen name="Profile" component={ProfileScreen} />
      <MoreStackNav.Screen name="Settings" component={SettingsScreen} />
    </MoreStackNav.Navigator>
  );
}

export function TeacherTabNavigator() {
  return (
    <Tab.Navigator tabBar={() => null} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="TeacherHome" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="TeacherClasses" component={ClassesStack} options={{ title: 'Classes' }} />
      <Tab.Screen name="TeacherHomework" component={HomeworkStack} options={{ title: 'Homework' }} />
      <Tab.Screen name="TeacherStudents" component={StudentsStack} options={{ title: 'Students' }} />
      <Tab.Screen name="TeacherMore" component={MoreStack} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}
