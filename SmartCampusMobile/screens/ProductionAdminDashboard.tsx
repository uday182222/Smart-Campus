/**
 * Admin Dashboard — premium gradient header + PD cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Users,
  GraduationCap,
  Layers,
  UserPlus,
  Grid3X3,
  BarChart3,
  Megaphone,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useDrawer } from '../contexts/DrawerContext';
import { DashboardSkeleton } from '../components/ui';
import { T } from '../constants/theme';
import { apiClient } from '../services/apiClient';
import { canAccess } from '../utils/rolePermissions';

const API = apiClient as any;
const { width: SCREEN_W } = Dimensions.get('window');

interface AdminStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalParents?: number;
  pendingRequests: number;
  todayAttendance?: { present: number; absent: number; late?: number; percentage: number };
  totalFeesDue?: number;
  totalFeesCollected?: number;
}

interface PendingItem {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  className: string;
  createdAt: string;
}

const QUICK = [
  { label: 'Users', sub: 'Manage accounts', Icon: UserPlus, screen: 'UserManagement' as const },
  { label: 'Classes', sub: 'Sections & rooms', Icon: Grid3X3, screen: 'ClassManagement' as const },
  { label: 'Reports', sub: 'Attendance', Icon: BarChart3, screen: 'AttendanceReport' as const },
  { label: 'Announce', sub: 'Broadcast', Icon: Megaphone, screen: 'Announcements' as const },
];

export default function ProductionAdminDashboard() {
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const navigation = useNavigation<any>();
  const { setDrawerNavigation, openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const rootNav = navigation.getParent?.()?.getParent?.() ?? navigation.getParent?.() ?? navigation;
    setDrawerNavigation(rootNav);
    return () => setDrawerNavigation(null);
  }, [navigation, setDrawerNavigation]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<PendingItem[]>([]);

  const load = useCallback(async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([API.get('/admin/stats'), API.get('/registration/requests')]);
      const statsData = (statsRes?.data?.data ?? statsRes?.data) as AdminStats | undefined;
      if (statsData) setStats(statsData);
      const reqData = (requestsRes?.data?.data ?? requestsRes?.data) as PendingItem[] | undefined;
      const list = Array.isArray(reqData) ? reqData : [];
      setRecent(list.slice(0, 3));
    } catch (_e) {
      setStats(null);
      setRecent([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const adminName = userData?.name ?? 'Administrator';
  const roleLabel = userData?.role === 'PRINCIPAL' ? 'Principal' : 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const present = stats?.todayAttendance?.present ?? 0;
  const absent = stats?.todayAttendance?.absent ?? 0;
  const late = stats?.todayAttendance?.late ?? 0;
  const pct = Math.round(stats?.todayAttendance?.percentage ?? 0);
  const collected = stats?.totalFeesCollected ?? 0;
  const due = stats?.totalFeesDue ?? 0;
  const totalFees = collected + due || 1;
  const collectedPct = Math.min(100, (collected / totalFees) * 100);
  const rateLabel = `${Math.round(collectedPct)}% collection rate`;

  const statChips = [
    { Icon: Users, n: stats?.totalStudents ?? 0, l: 'Students' },
    { Icon: GraduationCap, n: stats?.totalTeachers ?? 0, l: 'Teachers' },
    { Icon: Layers, n: stats?.totalClasses ?? 0, l: 'Classes' },
    { Icon: UserPlus, n: stats?.pendingRequests ?? 0, l: 'Pending' },
  ];

  if (loading && !stats) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 16 }}>
          <Text style={{ ...T.font.appTitle, color: T.textDark }}>Dashboard</Text>
        </View>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {/* Header (flat) */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1 }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.85}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: T.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...T.shadowSm,
                }}
              >
                <Bell size={20} color={T.textDark} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.85}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...T.shadowSm,
                }}
              >
                {theme.logoUrl ? (
                  <Image source={{ uri: theme.logoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: T.textWhite, fontWeight: '900' }}>{adminName.charAt(0).toUpperCase()}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 14 }}>{greeting}</Text>
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 26, letterSpacing: -0.8, marginTop: 4 }}>
            {adminName} ({roleLabel})
          </Text>
          <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Stat cards (2x2 grid) */}
        <View style={{ paddingHorizontal: T.px, marginTop: 14, flexDirection: 'column', gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {statChips.slice(0, 2).map((s, i) => {
              const Icon = s.Icon;
              return (
                <View key={i} style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={primary} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '800', marginTop: 10 }}>{s.l.toUpperCase()}</Text>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 26, marginTop: 2 }}>{s.n}</Text>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {statChips.slice(2, 4).map((s, i) => {
              const Icon = s.Icon;
              return (
                <View key={i} style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={primary} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '800', marginTop: 10 }}>{s.l.toUpperCase()}</Text>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 26, marginTop: 2 }}>{s.n}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: T.px, paddingTop: 16 }}>
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, ...T.shadowSm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>Today's Attendance</Text>
              <View style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                <Text style={{ color: primary, fontSize: 10, fontWeight: '900' }}>LIVE</Text>
              </View>
            </View>
            <Text style={{ color: primary, fontWeight: '900', fontSize: 44, letterSpacing: -2, textAlign: 'center', marginTop: 12 }}>{pct}%</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 }}>% present today</Text>
            <View style={{ height: 8, backgroundColor: T.primaryTint, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${pct}%`, backgroundColor: T.success, borderRadius: 4 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ color: T.success, fontWeight: '800' }}>Present {present}</Text>
              <Text style={{ color: T.danger, fontWeight: '800' }}>Absent {absent}</Text>
              <Text style={{ color: T.warning, fontWeight: '800' }}>Late {late}</Text>
            </View>
          </View>

          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 12, ...T.shadowSm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>New Requests</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                  <Text style={{ color: primary, fontWeight: '900', fontSize: 12 }}>{stats?.pendingRequests ?? 0}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('PendingRequests')} activeOpacity={0.85}>
                  <Text style={{ color: primary, fontWeight: '800', fontSize: 13 }}>View All</Text>
                </TouchableOpacity>
              </View>
            </View>
            {recent.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => navigation.navigate('PendingRequests')}
                activeOpacity={0.85}
                style={{
                  backgroundColor: T.primaryLight,
                  borderRadius: 16,
                  padding: 12,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 12 }}>
                    {(r.studentName || '?')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: T.textDark, fontWeight: '800' }}>{r.studentName}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{r.className}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 2 }}>{r.parentName}</Text>
                </View>
                <ChevronRight size={18} color={T.textPlaceholder} strokeWidth={1.8} />
              </TouchableOpacity>
            ))}
            {recent.length === 0 ? <Text style={{ color: T.textMuted, marginTop: 12, textAlign: 'center' }}>No pending requests</Text> : null}
          </View>

          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18, marginTop: 18, marginBottom: 12 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {QUICK.filter((q) => canAccess((userData as any)?.role ?? '', q.screen)).map((q) => {
              const Icon = q.Icon;
              return (
                <TouchableOpacity
                  key={q.screen}
                  onPress={() => navigation.navigate(q.screen)}
                  style={{
                    width: (SCREEN_W - T.px * 2 - 12) / 2,
                    backgroundColor: T.card,
                    borderRadius: T.radius.xxl,
                    padding: 20,
                    marginBottom: 12,
                    ...T.shadowSm,
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={primary} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15, marginTop: 10 }}>{q.label}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{q.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 4, ...T.shadowSm }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>Fee Overview</Text>
            <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: T.success, fontWeight: '900', fontSize: 22 }}>₹{collected.toLocaleString()}</Text>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Collected</Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: T.inputBorder }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: T.danger, fontWeight: '900', fontSize: 22 }}>₹{due.toLocaleString()}</Text>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Pending</Text>
              </View>
            </View>
            <View style={{ height: 8, backgroundColor: T.primaryTint, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${collectedPct}%`, backgroundColor: T.success, borderRadius: 4 }} />
            </View>
            <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 8, textAlign: 'right' }}>{rateLabel}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
