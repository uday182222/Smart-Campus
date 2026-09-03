/**
 * Admin / Principal dashboard — parent-style tab root header (T.bg, T.card, Lucide).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Animated, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Layers,
  UserPlus,
  Megaphone,
  ChevronRight,
  CheckCircle,
  Calendar,
  Bus,
  Building2,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';
import { useDrawer } from '../contexts/DrawerContext';
import { DashboardSkeleton } from '../components/ui';
import { T } from '../constants/theme';
import { apiClient } from '../services/apiClient';
import { canAccess } from '../utils/rolePermissions';
import { displayName } from '../utils/displayName';
import { AdminFloatingNav } from '../components/ui/AdminFloatingNav';

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

type QuickItem = {
  label: string;
  sub: string;
  Icon: LucideIcon;
  screen?: string;
  disabled?: boolean;
};

const QUICK: QuickItem[] = [
  { label: 'Events', sub: 'Calendar', Icon: Calendar, screen: 'Events' },
  { label: 'Transport', sub: 'Routes & buses', Icon: Bus, screen: 'TransportManagement' },
  { label: 'School Profile', sub: 'School settings', Icon: Building2, screen: 'SchoolProfile' },
  { label: 'Attendance', sub: 'Upcoming feature', Icon: CheckCircle, disabled: true },
  { label: 'Announcements', sub: 'Upcoming feature', Icon: Megaphone, disabled: true },
];

export default function ProductionAdminDashboard() {
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
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
  const [feeCollected, setFeeCollected] = useState(0);
  const [feePending, setFeePending] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const load = useCallback(async () => {
    try {
      const [statsRes, requestsRes, feesRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/registration/requests'),
        API.get('/admin/fees/management'),
      ]);
      const statsData = (statsRes?.data?.data ?? statsRes?.data) as AdminStats | undefined;
      if (statsData) setStats(statsData);
      const reqData = (requestsRes?.data?.data ?? requestsRes?.data) as PendingItem[] | undefined;
      const list = Array.isArray(reqData) ? reqData : [];
      setRecent(list.slice(0, 3));

      const feesRaw = (feesRes?.data?.data ?? feesRes?.data) as {
        summary?: { totalDue?: number; totalPaid?: number };
      } | null;
      setFeeCollected(feesRaw?.summary?.totalPaid ?? 0);
      setFeePending(feesRaw?.summary?.totalDue ?? 0);
    } catch (_e) {
      setStats(null);
      setRecent([]);
      setFeeCollected(0);
      setFeePending(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!loading) animateIn();
  }, [loading, animateIn]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const adminName = displayName(userData?.name, 'Administrator');
  const roleLabel = userData?.role === 'PRINCIPAL' ? 'Principal' : 'School Admin';
  const initials =
    adminName
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const collected = feeCollected;
  const due = feePending;
  const totalFees = collected + due || 1;
  const collectedPct = Math.min(100, (collected / totalFees) * 100);
  const rateLabel = `${Math.round(collectedPct)}% collection rate`;
  const todayLine = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const schoolName = theme.schoolName || 'School';
  const role = (userData as any)?.role ?? '';
  const quickItems = QUICK.filter((q) => q.disabled || !q.screen || canAccess(role, q.screen));

  if (loading && !stats) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: T.card,
                borderRadius: T.radius.full,
                paddingVertical: 6,
                paddingLeft: 6,
                paddingRight: 16,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>{greeting}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{adminName}</Text>
              </View>
            </View>
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
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: T.textDark,
              letterSpacing: -0.8,
              lineHeight: 34,
              marginTop: 18,
            }}
            numberOfLines={2}
          >
            {schoolName}
          </Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>{roleLabel}</Text>
        </View>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => openDrawer?.()}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: T.card,
                borderRadius: T.radius.full,
                paddingVertical: 6,
                paddingLeft: 6,
                paddingRight: 16,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>{greeting}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }} numberOfLines={1}>
                  {adminName}
                </Text>
              </View>
            </TouchableOpacity>
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
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: T.danger,
                  borderWidth: 2,
                  borderColor: T.bg,
                }}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: T.textDark,
              letterSpacing: -0.8,
              lineHeight: 34,
              marginTop: 18,
            }}
            numberOfLines={2}
          >
            {schoolName}
          </Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>{roleLabel}</Text>
        </View>

        {/* C52 — Fees Management (replaces Today's Attendance) */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: T.px, marginTop: 20 }}>
          <View
            style={{
              backgroundColor: T.card,
              borderRadius: T.radius.xxl,
              padding: 20,
              ...T.shadowSm,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>Fees Management</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700' }}>{todayLine}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: T.success, fontWeight: '900', fontSize: 22 }}>₹{collected.toLocaleString()}</Text>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Collected</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: T.danger, fontWeight: '900', fontSize: 22 }}>₹{due.toLocaleString()}</Text>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Pending</Text>
              </View>
            </View>

            <View style={{ height: 4, backgroundColor: T.inputBorder, borderRadius: 2, overflow: 'hidden', marginTop: 14 }}>
              <View style={{ height: 4, width: `${collectedPct}%`, backgroundColor: T.primary }} />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('FeeReport')}
              style={{
                backgroundColor: T.primary,
                borderRadius: T.radius.full,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 14,
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '800', fontSize: 13 }}>Open Fee Report</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: T.px,
            marginTop: 12,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ClassManagement')}
            style={{
              width: (SCREEN_W - T.px * 2 - 12) / 2,
              backgroundColor: T.card,
              borderRadius: T.radius.lg,
              padding: 14,
              ...T.shadowSm,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: T.radius.sm,
                backgroundColor: T.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Layers size={16} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 10, color: T.textPlaceholder, letterSpacing: 0.5, fontWeight: '600' }}>CLASSES</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark, letterSpacing: -1, lineHeight: 30 }}>
                {stats?.totalClasses ?? 0}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PendingRequests')}
            style={{
              width: (SCREEN_W - T.px * 2 - 12) / 2,
              backgroundColor: T.card,
              borderRadius: T.radius.lg,
              padding: 14,
              ...T.shadowSm,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: T.radius.sm,
                backgroundColor: T.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <UserPlus size={16} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 10, color: T.textPlaceholder, letterSpacing: 0.5, fontWeight: '600' }}>PENDING</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 }}>
              <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark, letterSpacing: -1, lineHeight: 30 }}>
                {stats?.pendingRequests ?? 0}
              </Text>
            </View>
          </TouchableOpacity>

          {/* C53 — former Teachers tile position (removed in C42); now Announcements */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Announcements')}
            style={{
              width: (SCREEN_W - T.px * 2 - 12) / 2,
              backgroundColor: T.card,
              borderRadius: T.radius.lg,
              padding: 14,
              ...T.shadowSm,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: T.radius.sm,
                backgroundColor: T.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Megaphone size={16} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 10, color: T.textPlaceholder, letterSpacing: 0.5, fontWeight: '600' }}>ANNOUNCEMENTS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: T.textDark, letterSpacing: -0.3, lineHeight: 22 }}>
                Broadcast
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <Animated.View style={{ opacity: fadeAnim, paddingTop: 16 }}>
          <View
            style={{
              backgroundColor: T.card,
              borderRadius: T.radius.xxl,
              padding: 20,
              ...T.shadowSm,
              marginHorizontal: T.px,
              marginTop: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>New Requests</Text>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 11 }}>{stats?.pendingRequests ?? 0}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('PendingRequests')} activeOpacity={0.85}>
                <Text style={{ color: T.primary, fontWeight: '800', fontSize: 13 }}>View All</Text>
              </TouchableOpacity>
            </View>

            {recent.map((r, idx) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => navigation.navigate('PendingRequests')}
                activeOpacity={0.85}
                style={{
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderBottomWidth: idx === recent.length - 1 ? 0 : 0.5,
                  borderBottomColor: T.inputBorder,
                  marginTop: 6,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 12 }}>
                    {(r.studentName || '?')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: T.textDark, fontWeight: '800' }}>{r.studentName}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>
                    {r.className} · {r.parentName}
                  </Text>
                </View>
                <ChevronRight size={18} color={T.textPlaceholder} strokeWidth={1.8} />
              </TouchableOpacity>
            ))}
            {recent.length === 0 ? <Text style={{ color: T.textMuted, marginTop: 12, textAlign: 'center' }}>No pending requests</Text> : null}
          </View>

          <View style={{ paddingHorizontal: T.px, marginTop: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>Quick Actions</Text>
          </View>

          <View style={{ paddingHorizontal: T.px, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {quickItems.map((q) => {
              const Icon = q.Icon;
              const disabled = !!q.disabled;
              return (
                <TouchableOpacity
                  key={q.label}
                  onPress={() => {
                    if (!disabled && q.screen) navigation.navigate(q.screen);
                  }}
                  disabled={disabled}
                  style={{
                    width: (SCREEN_W - T.px * 2 - 12) / 2,
                    backgroundColor: T.card,
                    borderRadius: T.radius.lg,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                    opacity: disabled ? 0.45 : 1,
                    ...T.shadowSm,
                  }}
                  activeOpacity={disabled ? 1 : 0.85}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: disabled ? T.inputBorder : T.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={disabled ? T.textPlaceholder : T.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={{ color: disabled ? T.textMuted : T.textDark, fontWeight: '700', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                    {q.label}
                  </Text>
                  <Text style={{ color: T.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' }}>{q.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginHorizontal: T.px, marginTop: 4, ...T.shadowSm }}>
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
        </Animated.View>
      </ScrollView>

      <AdminFloatingNav navigation={navigation} activeTab="AdminDashboard" />
    </View>
  );
}
