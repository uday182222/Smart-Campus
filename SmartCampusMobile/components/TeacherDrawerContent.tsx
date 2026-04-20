/**
 * Teacher Drawer — navigates into nested TeacherTabNavigator.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useDrawer } from '../contexts/DrawerContext';
import { apiClient } from '../services/apiClient';
import { LT } from '../constants/lightTheme';

const MENU_ITEMS: Array<{
  key: string;
  label: string;
  icon: string;
  badge?: boolean;
}> = [
  { key: 'TeacherDashboard', label: 'Dashboard', icon: 'home-outline' },
  { key: 'ClassesHome', label: 'My Classes', icon: 'school-outline' },
  { key: 'Attendance', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { key: 'Homework', label: 'Homework', icon: 'book-outline' },
  { key: 'MarksEntry', label: 'Enter Marks', icon: 'create-outline' },
  { key: 'Remarks', label: 'Remarks', icon: 'chatbubble-outline' },
  { key: 'MyStudents', label: 'My Students', icon: 'people-outline' },
  { key: 'Messages', label: 'Messages', icon: 'mail-outline', badge: true },
  { key: 'Calendar', label: 'Calendar', icon: 'calendar-outline' },
];

const ROUTES: Record<string, { tab: string; screen: string }> = {
  TeacherDashboard: { tab: 'TeacherHome', screen: 'TeacherDashboard' },
  ClassesHome: { tab: 'TeacherClasses', screen: 'ClassesHome' },
  Attendance: { tab: 'TeacherClasses', screen: 'Attendance' },
  Homework: { tab: 'TeacherHomework', screen: 'Homework' },
  MarksEntry: { tab: 'TeacherClasses', screen: 'MarksEntry' },
  Remarks: { tab: 'TeacherStudents', screen: 'Remarks' },
  MyStudents: { tab: 'TeacherStudents', screen: 'MyStudents' },
  Messages: { tab: 'TeacherStudents', screen: 'Messages' },
  Calendar: { tab: 'TeacherMore', screen: 'Calendar' },
  Profile: { tab: 'TeacherHome', screen: 'Profile' },
  Settings: { tab: 'TeacherMore', screen: 'Settings' },
  TeacherMore: { tab: 'TeacherMore', screen: 'TeacherMore' },
};

function getDeepestRouteName(state: any): string {
  if (!state?.routes || state.index == null) return '';
  const r = state.routes[state.index];
  if (r?.state) return getDeepestRouteName(r.state);
  return r?.name ?? '';
}

export function TeacherDrawerContent() {
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const { closeDrawer, drawerNavigation } = useDrawer();
  const [unreadCount, setUnreadCount] = useState(0);

  const state = drawerNavigation?.getState?.();
  const deepest = getDeepestRouteName(state);
  const active = deepest;

  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'T';

  useEffect(() => {
    apiClient
      .get('/teacher/dashboard')
      .then((res: any) => {
        const data = res?.data ?? res;
        if (typeof data?.unreadMessages === 'number') setUnreadCount(data.unreadMessages);
      })
      .catch(() => {});
  }, []);

  const navigate = (key: string) => {
    const target = ROUTES[key];
    if (!target) return;
    closeDrawer();
    setTimeout(() => {
      drawerNavigation?.dispatch(
        CommonActions.navigate({
          name: 'TeacherTabs',
          params: {
            screen: target.tab,
            params: { screen: target.screen },
          },
        })
      );
    }, 50);
  };

  const isMenuActive = (key: string) => {
    const t = ROUTES[key];
    return t ? active === t.screen : false;
  };

  return (
    <View style={{ flex: 1, backgroundColor: LT.card }}>
      <StatusBar barStyle="light-content" backgroundColor={LT.primaryDark} />

      <View style={{ backgroundColor: LT.primaryDark, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: LT.secondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>{initials}</Text>
        </View>

        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 12 }} numberOfLines={1}>
          {userData?.name || 'Teacher'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>Teacher</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 }} numberOfLines={1}>
          {theme.schoolName || 'Smart Campus'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = isMenuActive(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigate(item.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isActive ? LT.primaryLight : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 6,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isActive ? LT.primary : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name={item.icon as any} size={20} color={isActive ? '#FFFFFF' : LT.textMuted} />
              </View>

              <Text
                style={{
                  flex: 1,
                  color: isActive ? LT.primary : LT.textPrimary,
                  fontSize: 15,
                  fontWeight: isActive ? '800' : '600',
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>

              {item.badge && unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: LT.danger,
                    borderRadius: 10,
                    minWidth: 22,
                    height: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: LT.cardBorder,
          paddingHorizontal: 12,
          paddingBottom: 28,
          paddingTop: 12,
          backgroundColor: LT.card,
        }}
      >
        <TouchableOpacity
          onPress={() => navigate('Profile')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: LT.card,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: LT.cardBorder,
            ...LT.shadow,
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: LT.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: LT.textPrimary, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {userData?.name}
            </Text>
            <Text style={{ color: LT.textMuted, fontSize: 12 }} numberOfLines={1}>
              {userData?.email}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={LT.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate('Settings')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: LT.card,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: LT.cardBorder,
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="settings-outline" size={20} color={LT.textMuted} />
          </View>
          <Text style={{ flex: 1, color: LT.textPrimary, fontSize: 14, fontWeight: '600' }}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={LT.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            closeDrawer();
            logout();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: LT.dangerBg,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.25)',
          }}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FECACA',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={LT.danger} />
          </View>
          <Text style={{ flex: 1, color: LT.danger, fontSize: 14, fontWeight: '700' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
