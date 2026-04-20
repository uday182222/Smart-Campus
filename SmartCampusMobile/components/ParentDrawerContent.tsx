/**
 * Parent Drawer — navigates into nested ParentTabNavigator.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useActiveChild } from '../contexts/ActiveChildContext';
import { useDrawer } from '../contexts/DrawerContext';
import { apiClient } from '../services/apiClient';
import { LT } from '../constants/lightTheme';

const MENU_ITEMS = [
  { key: 'ParentDashboard', label: 'Dashboard', icon: 'home-outline' },
  { key: 'MyChildren', label: 'My Children', icon: 'people-outline' },
  { key: 'AttendanceHistory', label: 'Attendance', icon: 'checkmark-circle-outline' },
  { key: 'ParentHomework', label: 'Homework', icon: 'book-outline' },
  { key: 'ReportCard', label: 'Report Card', icon: 'bar-chart-outline' },
  { key: 'FeeStatus', label: 'Fee Status', icon: 'wallet-outline' },
  { key: 'BusTracking', label: 'Bus Tracking', icon: 'bus-outline' },
  { key: 'ParentCalendar', label: 'Calendar', icon: 'calendar-outline' },
  { key: 'Gallery', label: 'Gallery', icon: 'images-outline' },
  { key: 'Appointments', label: 'Appointments', icon: 'calendar-outline' },
  { key: 'ParentNotifications', label: 'Notifications', icon: 'notifications-outline', badge: true },
] as const;

/** Map drawer keys → tab navigator + stack screen */
const ROUTES: Record<string, { tab: string; screen: string }> = {
  ParentDashboard: { tab: 'ParentHome', screen: 'ParentDashboard' },
  MyChildren: { tab: 'ParentHome', screen: 'MyChildren' },
  AttendanceHistory: { tab: 'ParentAcademic', screen: 'Attendance' },
  ParentHomework: { tab: 'ParentAcademic', screen: 'Homework' },
  ReportCard: { tab: 'ParentAcademic', screen: 'ReportCard' },
  FeeStatus: { tab: 'ParentFees', screen: 'FeeStatus' },
  BusTracking: { tab: 'ParentBus', screen: 'BusTracking' },
  ParentCalendar: { tab: 'ParentAcademic', screen: 'Calendar' },
  Gallery: { tab: 'ParentGallery', screen: 'Gallery' },
  Appointments: { tab: 'ParentGallery', screen: 'Appointments' },
  ParentNotifications: { tab: 'ParentHome', screen: 'Notifications' },
  Profile: { tab: 'ParentHome', screen: 'Profile' },
  Settings: { tab: 'ParentHome', screen: 'Settings' },
};

function getDeepestRouteName(state: any): string {
  if (!state?.routes || state.index == null) return '';
  const r = state.routes[state.index];
  if (r?.state) return getDeepestRouteName(r.state);
  return r?.name ?? '';
}

export function ParentDrawerContent() {
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const { children, activeChild, setActiveChild } = useActiveChild();
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
      .slice(0, 2) || 'P';

  useEffect(() => {
    apiClient
      .get('/parent/notifications')
      .then((res: any) => {
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.notifications ?? [];
        const unread = Array.isArray(list) ? list.filter((n: any) => !n.read && !n.isRead).length : 0;
        setUnreadCount(unread);
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
          name: 'ParentTabs',
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

      <View style={{ backgroundColor: LT.primaryDark, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: LT.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>{initials}</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
              {userData?.name || 'Parent'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
              Parent · {theme.schoolName || 'Smart Campus'}
            </Text>
          </View>
        </View>

        {children.length >= 2 && (
          <>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 14, marginBottom: 8 }}>Viewing child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={{ paddingRight: 8 }}>
              {children.map((child: any) => {
                const isActive = activeChild?.studentId === child.studentId;
                return (
                  <TouchableOpacity
                    key={child.studentId}
                    onPress={() => setActiveChild(child)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 20,
                      backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                      marginRight: 8,
                      borderWidth: isActive ? 0 : 1,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        color: isActive ? LT.primary : '#FFFFFF',
                        fontSize: 12,
                        fontWeight: isActive ? '900' : '600',
                      }}
                      numberOfLines={1}
                    >
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}
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
              {'badge' in item && item.badge && unreadCount > 0 && (
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
