/**
 * Admin Drawer — white body, primaryDark header, MaterialCommunityIcons menu.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useDrawer } from '../contexts/DrawerContext';
import { apiClient } from '../services/apiClient';
import { PD, darkenHex } from '../constants/parentDesign';

const MENU_ITEMS: Array<{
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: boolean;
}> = [
  { key: 'AdminDashboard', label: 'Dashboard', icon: 'view-dashboard' },
  { key: 'PendingRequests', label: 'Pending Requests', icon: 'account-clock', badge: true },
  { key: 'UserManagement', label: 'Manage Users', icon: 'account-multiple' },
  { key: 'ClassManagement', label: 'Classes', icon: 'google-classroom' },
  { key: 'AttendanceReport', label: 'Attendance Report', icon: 'chart-bar-stacked' },
  { key: 'FeeReport', label: 'Fee Management', icon: 'wallet' },
  { key: 'Announcements', label: 'Announcements', icon: 'bullhorn' },
  { key: 'Events', label: 'Events', icon: 'calendar-star' },
  { key: 'SchoolProfile', label: 'School Profile', icon: 'school' },
];

export function AdminDrawerContent() {
  const { userData, logout } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.25);
  const { closeDrawer, drawerNavigation } = useDrawer();
  const [pendingCount, setPendingCount] = useState(0);

  const state = drawerNavigation?.getState?.();
  const currentRoute = state?.routes?.[state.index]?.name ?? '';
  const active = currentRoute;

  const initials =
    userData?.name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A';

  const schoolCodeLabel = theme.schoolId ? String(theme.schoolId).slice(0, 12) : '—';

  useEffect(() => {
    apiClient
      .get('/registration/requests')
      .then((res: any) => {
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setPendingCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => {});
  }, []);

  const navigate = (screenName: string) => {
    closeDrawer();
    setTimeout(() => {
      drawerNavigation?.dispatch(CommonActions.navigate({ name: screenName }));
    }, 50);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor={primaryDark} />

      <View style={{ backgroundColor: primaryDark, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: primary, fontSize: 22, fontWeight: '900' }}>{theme.schoolName?.charAt(0) || 'S'}</Text>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 12 }} numberOfLines={2}>
          {theme.schoolName || 'Smart Campus'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, fontStyle: 'italic' }} numberOfLines={1}>
          {userData?.name || 'Admin'}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Courier', marginTop: 8 }}>{schoolCodeLabel}</Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8, backgroundColor: '#FFFFFF' }} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => navigate(item.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isActive ? `${primary}18` : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 4,
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isActive ? primary : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color={isActive ? '#FFFFFF' : PD.textMuted} />
              </View>
              <Text style={{ flex: 1, color: isActive ? primary : PD.textDark, fontSize: 15, fontWeight: isActive ? '800' : '500' }} numberOfLines={1}>
                {item.label}
              </Text>
              {item.badge && pendingCount > 0 && (
                <View style={{ backgroundColor: PD.danger, borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: PD.cardBorder, paddingHorizontal: 12, paddingBottom: 32, paddingTop: 12, backgroundColor: '#FFFFFF' }}>
        <TouchableOpacity
          onPress={() => navigate('Profile')}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: PD.cardBorder }}
          activeOpacity={0.7}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: PD.textDark, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
              {userData?.name}
            </Text>
            <Text style={{ color: PD.textMuted, fontSize: 12 }} numberOfLines={1}>
              {userData?.email}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate('Settings')}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 8 }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="cog" size={22} color={PD.textMuted} style={{ marginRight: 12 }} />
          <Text style={{ flex: 1, color: PD.textDark, fontSize: 14, fontWeight: '600' }}>Settings</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={PD.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            closeDrawer();
            logout();
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FEE2E2',
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.3)',
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={22} color={PD.danger} style={{ marginRight: 12 }} />
          <Text style={{ flex: 1, color: PD.danger, fontSize: 14, fontWeight: '800' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
