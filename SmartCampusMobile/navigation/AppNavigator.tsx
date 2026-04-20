import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAccentColor } from '../hooks/useAccentColor';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { apiClient } from '../services/apiClient';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap } from 'lucide-react-native';
import { T } from '../constants/theme';

// Import production screens (STABLE)
import ProductionLoginScreen from '../screens/ProductionLoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import PendingRequestsScreen from '../screens/admin/PendingRequestsScreen';
import ProductionParentDashboard from '../screens/ProductionParentDashboard';
import ProductionStudentDashboard from '../screens/ProductionStudentDashboard';
import ProductionAdminDashboard from '../screens/ProductionAdminDashboard';

// NEW Modern Screens
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import NewAttendanceScreen from '../screens/teacher/AttendanceScreen';
import MarksScreen from '../screens/parent/MarksScreen';
import { ConductorPortal, ParentBusTracking } from '../screens/transport';

// Feature screens
import AttendanceScreen from '../screens/AttendanceScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import AttendanceAnalyticsScreen from '../screens/AttendanceAnalyticsScreen';
import FeeManagementScreen from '../screens/FeeManagementScreen';
import TransportScreen from '../screens/TransportScreen';
import CommunicationScreen from '../screens/CommunicationScreen';
import GalleryScreen from '../screens/GalleryScreen';
import NotificationScreen from '../screens/NotificationScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SettingsScreen from '../screens/SettingsScreen';
// Admin screens
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ClassManagementScreen from '../screens/admin/ClassManagementScreen';
import AttendanceReportScreen from '../screens/admin/AttendanceReportScreen';
import FeeReportScreen from '../screens/admin/FeeReportScreen';
import AnnouncementsScreen from '../screens/admin/AnnouncementsScreen';
import SchoolProfileScreen from '../screens/admin/SchoolProfileScreen';
import { AdminNavigator } from './AdminNavigator';
import { TeacherNavigator } from './TeacherNavigator';
import { ParentNavigator } from './ParentNavigator';
import { BusHelperNavigator } from './BusHelperNavigator';
// Teacher screens
import MarksEntryScreen from '../screens/teacher/MarksEntryScreen';
import RemarksScreen from '../screens/teacher/RemarksScreen';
// Parent screens
import FeeScreen from '../screens/parent/FeeScreen';
import AppointmentsScreen from '../screens/parent/AppointmentsScreen';
// Super Admin screens
import SuperAdminLoginScreen from '../screens/superadmin/SuperAdminLoginScreen';
import SuperAdminGateScreen from '../screens/superadmin/SuperAdminGateScreen';
import AccentColorPickerScreen from '../screens/superadmin/AccentColorPickerScreen';
import SuperAdminDashboardScreen from '../screens/superadmin/SuperAdminDashboardScreen';
import SchoolManagementScreen from '../screens/superadmin/SchoolManagementScreen';
import CreateSchoolScreen from '../screens/superadmin/CreateSchoolScreen';
import SchoolDetailScreen from '../screens/superadmin/SchoolDetailScreen';
import SchoolUsersScreen from '../screens/superadmin/SchoolUsersScreen';

function AppSplash() {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      const bounceDot = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: -8, duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.delay(600),
          ])
        );

      Animated.parallel([
        bounceDot(dot1, 0),
        bounceDot(dot2, 150),
        bounceDot(dot3, 300),
      ]).start();
    });
  }, []);

  return (
    <LinearGradient
      colors={['#C7D2FE', '#EEF2FF', '#E0E7FF'] as const}
      locations={[0, 0.45, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <StatusBar barStyle="dark-content" />

      <View
        style={{
          position: 'absolute',
          top: -60,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(30,63,160,0.07)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 80,
          right: -40,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: 'rgba(30,63,160,0.05)',
        }}
      />

      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(255,255,255,0.65)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.95)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: T.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <GraduationCap size={48} color={T.primary} strokeWidth={1.8} />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: T.primary,
            letterSpacing: -1,
          }}
        >
          Smart Campus
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: T.textMuted,
            marginTop: 6,
            fontWeight: '400',
            letterSpacing: 0.1,
          }}
        >
          Connecting Schools, Empowering Education
        </Text>
      </Animated.View>

      <Animated.View
        style={{
          opacity: textOpacity,
          flexDirection: 'row',
          gap: 8,
          marginTop: 48,
        }}
      >
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              transform: [{ translateY: dot }],
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: T.primary,
              opacity: 0.6,
            }}
          />
        ))}
      </Animated.View>
    </LinearGradient>
  );
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AdminStack = createStackNavigator();
const SuperAdminStack = createStackNavigator();
const TeacherStack = createStackNavigator();
const ParentStack = createStackNavigator();

const ADMIN_MENU_ITEMS = [
  { name: 'Dashboard', screen: 'AdminDashboard', icon: 'home' as const },
  { name: 'Pending Requests', screen: 'PendingRequests', icon: 'user-plus' as const },
  { name: 'Manage Users', screen: 'UserManagement', icon: 'users' as const },
  { name: 'Manage Classes', screen: 'ClassManagement', icon: 'book' as const },
  { name: 'Attendance Report', screen: 'AttendanceReport', icon: 'bar-chart-2' as const },
  { name: 'Fee Management', screen: 'FeeReport', icon: 'pie-chart' as const },
  { name: 'Announcements', screen: 'Announcements', icon: 'bell' as const },
  { name: 'School Profile', screen: 'SchoolProfile', icon: 'briefcase' as const },
  { name: 'Profile', screen: 'Profile', icon: 'user' as const },
  { name: 'Settings', screen: 'Settings', icon: 'settings' as const },
];

// Admin menu screen — dark theme (replaces drawer; this is what opens when Admin taps menu)
const ADMIN_MENU_NAV_ITEMS = [
  { screen: 'AdminDashboard', label: 'Dashboard', icon: 'home-outline' as const },
  { screen: 'PendingRequests', label: 'Pending Requests', icon: 'person-add-outline' as const, badge: true },
  { screen: 'UserManagement', label: 'Manage Users', icon: 'people-outline' as const },
  { screen: 'ClassManagement', label: 'Manage Classes', icon: 'school-outline' as const },
  { screen: 'AttendanceReport', label: 'Attendance Report', icon: 'bar-chart-outline' as const },
  { screen: 'FeeReport', label: 'Fee Management', icon: 'wallet-outline' as const },
  { screen: 'Announcements', label: 'Announcements', icon: 'megaphone-outline' as const },
  { screen: 'SchoolProfile', label: 'School Profile', icon: 'business-outline' as const },
];

const AdminMenuScreen = ({ navigation }: { navigation: any }) => {
  const accent = useAccentColor();
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const [pendingCount, setPendingCount] = useState(0);

  const initials = (userData?.name ?? 'A').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    apiClient.get('/registration/requests').then((res: any) => {
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setPendingCount(Array.isArray(list) ? list.length : 0);
    }).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.adminMenuBack}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          <Text style={styles.adminMenuBackText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.adminMenuHeader}>
          <View style={[styles.adminMenuLogo, { backgroundColor: accent }]}>
            <Text style={styles.adminMenuLogoText}>{theme.schoolName?.charAt(0) || 'S'}</Text>
          </View>
          <Text style={styles.adminMenuTitle} numberOfLines={1}>{theme.schoolName || 'Smart Campus'}</Text>
          <Text style={styles.adminMenuSubtitle} numberOfLines={1}>{userData?.name || 'Admin'}</Text>
          <View style={styles.adminMenuPill}>
            <Text style={[styles.adminMenuPillText, { color: accent }]}>Admin Panel</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
          {ADMIN_MENU_NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={styles.adminMenuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.adminMenuIconCircle, { backgroundColor: '#242424' }]}>
                <Ionicons name={item.icon} size={18} color="#AAAAAA" />
              </View>
              <Text style={styles.adminMenuLabel} numberOfLines={1}>{item.label}</Text>
              {item.badge && pendingCount > 0 && (
                <View style={[styles.adminMenuBadge, { backgroundColor: accent }]}>
                  <Text style={styles.adminMenuBadgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.adminMenuFooter}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.adminMenuFooterRow} activeOpacity={0.7}>
            <View style={[styles.adminMenuAvatar, { backgroundColor: accent }]}>
              <Text style={styles.adminMenuAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminMenuFooterName} numberOfLines={1}>{userData?.name}</Text>
              <Text style={styles.adminMenuFooterEmail} numberOfLines={1}>{userData?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.adminMenuFooterRow} activeOpacity={0.7}>
            <View style={styles.adminMenuIconCircle}>
              <Ionicons name="settings-outline" size={18} color="#AAAAAA" />
            </View>
            <Text style={styles.adminMenuLabel}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.adminMenuLogout} activeOpacity={0.7}>
            <View style={styles.adminMenuLogoutIcon}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text style={styles.adminMenuLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Teacher Stack Navigator (for sub-screens)
const TeacherHomeStack = () => {
  return (
    <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
      <TeacherStack.Screen name="TeacherHome" component={TeacherDashboard} />
      <TeacherStack.Screen name="Attendance" component={NewAttendanceScreen} />
      <TeacherStack.Screen name="Homework" component={HomeworkScreen} />
      <TeacherStack.Screen name="Marks" component={AttendanceAnalyticsScreen} />
      <TeacherStack.Screen name="MarksEntry" component={MarksEntryScreen} />
      <TeacherStack.Screen name="Remarks" component={RemarksScreen} />
      <TeacherStack.Screen name="Schedule" component={CalendarScreen} />
      <TeacherStack.Screen name="Students" component={AttendanceHistoryScreen} />
      <TeacherStack.Screen name="Tasks" component={HomeworkScreen} />
      <TeacherStack.Screen name="Messages" component={CommunicationScreen} />
      <TeacherStack.Screen name="Notifications" component={NotificationScreen} />
      <TeacherStack.Screen name="Profile" component={ProfileScreen} />
      <TeacherStack.Screen name="Activities" component={AttendanceHistoryScreen} />
      <TeacherStack.Screen name="ClassDetails" component={AttendanceScreen} />
      <TeacherStack.Screen name="Communication" component={CommunicationScreen} />
    </TeacherStack.Navigator>
  );
};

// Teacher Tab Navigator
const TeacherTabNavigator = () => {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          height: 85,
          paddingTop: 10,
          paddingBottom: 30,
          paddingHorizontal: 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={TeacherHomeStack}
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={NewAttendanceScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="check-circle" size={24} color={color} />,
          title: 'Attendance',
        }}
      />
      <Tab.Screen
        name="HomeworkTab"
        component={HomeworkScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
          title: 'Homework',
        }}
      />
      <Tab.Screen
        name="CommunicationTab"
        component={CommunicationScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} />,
          title: 'Messages',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Parent Stack Navigator (for sub-screens)
const ParentHomeStack = () => {
  return (
    <ParentStack.Navigator screenOptions={{ headerShown: false }}>
      <ParentStack.Screen name="ParentHome" component={ProductionParentDashboard} />
      <ParentStack.Screen name="ChildDetails" component={ProductionStudentDashboard} />
      <ParentStack.Screen name="Attendance" component={AttendanceHistoryScreen} />
      <ParentStack.Screen name="Homework" component={HomeworkScreen} />
      <ParentStack.Screen name="Marks" component={MarksScreen} />
      <ParentStack.Screen name="BusTracking" component={ParentBusTracking} />
      <ParentStack.Screen name="Fees" component={FeeScreen} />
      <ParentStack.Screen name="Appointments" component={AppointmentsScreen} />
      <ParentStack.Screen name="Gallery" component={GalleryScreen} />
      <ParentStack.Screen name="Notifications" component={NotificationScreen} />
      <ParentStack.Screen name="Profile" component={ProfileScreen} />
      <ParentStack.Screen name="Calendar" component={CalendarScreen} />
    </ParentStack.Navigator>
  );
};

// Parent Tab Navigator
const ParentTabNavigator = () => {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 0,
          height: 85,
          paddingTop: 10,
          paddingBottom: 30,
          paddingHorizontal: 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ParentHomeStack}
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="ChildrenTab"
        component={ProductionStudentDashboard}
        options={{
          tabBarIcon: ({ color }) => <Feather name="users" size={24} color={color} />,
          title: 'Children',
        }}
      />
      <Tab.Screen
        name="TransportTab"
        component={ParentBusTracking}
        options={{
          tabBarIcon: ({ color }) => <Feather name="truck" size={24} color={color} />,
          title: 'Bus',
        }}
      />
      <Tab.Screen
        name="FeesTab"
        component={FeeScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={24} color={color} />,
          title: 'Fees',
        }}
      />
      <Tab.Screen
        name="GalleryTab"
        component={GalleryScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="camera" size={24} color={color} />,
          title: 'Gallery',
        }}
      />
    </Tab.Navigator>
  );
};

// Super Admin Stack Navigator (Gate checks first launch → AccentColorPicker or Dashboard)
const SuperAdminNavigator = () => (
  <SuperAdminStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SuperAdminGate">
    <SuperAdminStack.Screen name="SuperAdminGate" component={SuperAdminGateScreen} />
    <SuperAdminStack.Screen name="AccentColorPicker" component={AccentColorPickerScreen} />
    <SuperAdminStack.Screen name="SuperAdminDashboard" component={SuperAdminDashboardScreen} />
    <SuperAdminStack.Screen name="SchoolManagement" component={SchoolManagementScreen} />
    <SuperAdminStack.Screen name="CreateSchool" component={CreateSchoolScreen} />
    <SuperAdminStack.Screen name="SchoolDetail" component={SchoolDetailScreen} />
    <SuperAdminStack.Screen name="SchoolUsers" component={SchoolUsersScreen} />
    <SuperAdminStack.Screen name="Profile" component={ProfileScreen} />
    <SuperAdminStack.Screen name="Settings" component={SettingsScreen} />
  </SuperAdminStack.Navigator>
);

// Admin Stack Navigator (Stack instead of Drawer to avoid Reanimated useAnimatedGestureHandler removed in Reanimated 3)
const AdminStackNavigator = () => {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={ProductionAdminDashboard} />
      <AdminStack.Screen name="AdminMenu" component={AdminMenuScreen} />
      <AdminStack.Screen name="PendingRequests" component={PendingRequestsScreen} />
      <AdminStack.Screen name="UserManagement" component={UserManagementScreen} />
      <AdminStack.Screen name="ClassManagement" component={ClassManagementScreen} />
      <AdminStack.Screen name="AttendanceReport" component={AttendanceReportScreen} />
      <AdminStack.Screen name="FeeReport" component={FeeReportScreen} />
      <AdminStack.Screen name="Announcements" component={AnnouncementsScreen} />
      <AdminStack.Screen name="SchoolProfile" component={SchoolProfileScreen} />
      <AdminStack.Screen name="Profile" component={ProfileScreen} />
      <AdminStack.Screen name="Settings" component={SettingsScreen} />
    </AdminStack.Navigator>
  );
};

// Main App Navigator with role-based routing
const AppNavigator = () => {
  const { currentUser, userData, loading } = useAuth();

  console.log('🧭 AppNavigator: Current state:', { 
    currentUser: !!currentUser, 
    userData: userData?.role, 
    loading 
  });

  if (loading) {
    return <AppSplash />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <>
            <Stack.Screen name="Login" component={ProductionLoginScreen} />
            <Stack.Screen name="Registration" component={RegistrationScreen} />
            <Stack.Screen name="SuperAdminLogin" component={SuperAdminLoginScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // Main App Stack based on user role
          (() => {
            const role = userData?.role?.toLowerCase();
            switch (role) {
              case 'super_admin':
                return (
                  <Stack.Screen name="SuperAdminMain" component={SuperAdminNavigator} />
                );
              case 'school_admin':
              case 'admin':
              case 'principal':
                return (
                  <Stack.Screen name="AdminMain" component={AdminNavigator} />
                );
              case 'teacher':
                return (
                  <Stack.Screen name="TeacherMain" component={TeacherNavigator} />
                );
              case 'parent':
                /* Bottom tabs + drawer: see ParentNavigator → ParentTabNavigator */
                return (
                  <Stack.Screen name="ParentMain" component={ParentNavigator} />
                );
              case 'student':
                return (
                  <Stack.Screen name="StudentMain" component={ProductionStudentDashboard} />
                );
              case 'bus_helper':
              case 'BUS_HELPER':
                return (
                  <Stack.Screen name="HelperMain" component={BusHelperNavigator} />
                );
              default:
                console.log('Unknown role:', userData?.role);
                return (
                  <Stack.Screen name="Login" component={ProductionLoginScreen} />
                );
            }
          })()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: '#2196F3',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  drawerStyle: {
    backgroundColor: '#FFFFFF',
    width: 280,
  },
  adminMenuBack: { padding: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' },
  adminMenuBackText: { marginLeft: 8, fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  adminMenuHeader: { backgroundColor: '#1A1A1A', paddingBottom: 24, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  adminMenuLogo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  adminMenuLogoText: { color: '#1A1A1A', fontSize: 20, fontWeight: '900' },
  adminMenuTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 12, letterSpacing: -0.3 },
  adminMenuSubtitle: { color: '#AAAAAA', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  adminMenuPill: { backgroundColor: '#242424', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 8 },
  adminMenuPillText: { fontSize: 10, fontVariant: ['tabular-nums'], fontWeight: '700' },
  adminMenuItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13, marginBottom: 4 },
  adminMenuIconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#242424', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  adminMenuLabel: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  adminMenuBadge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  adminMenuBadgeText: { color: '#1A1A1A', fontSize: 10, fontWeight: '900' },
  adminMenuFooter: { paddingHorizontal: 12, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A2A' },
  adminMenuFooterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 14, padding: 12, marginBottom: 8 },
  adminMenuAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  adminMenuAvatarText: { color: '#1A1A1A', fontSize: 13, fontWeight: '900' },
  adminMenuFooterName: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  adminMenuFooterEmail: { color: '#666666', fontSize: 11, fontStyle: 'italic' },
  adminMenuLogout: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0808', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#3D1010' },
  adminMenuLogoutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3D1010', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  adminMenuLogoutText: { flex: 1, color: '#EF4444', fontSize: 14, fontWeight: '700' },
  drawerContainer: {
    flex: 1,
    paddingTop: 50,
  },
  drawerHeader: {
    padding: 24,
    backgroundColor: '#2196F3',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderRadius: 12,
  },
  drawerIconContainer: {
    marginRight: 16,
    width: 28,
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 'auto',
    marginHorizontal: 16,
    marginBottom: 30,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default AppNavigator;
