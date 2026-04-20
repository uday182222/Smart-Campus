/**
 * Parent Dashboard — Lucide + theme tokens; API logic unchanged.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Star,
  FileText,
  TrendingUp,
  Calendar,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useDrawer } from '../contexts/DrawerContext';
import { useActiveChild } from '../contexts/ActiveChildContext';
import ParentService from '../services/ParentService';
import { apiClient } from '../services/apiClient';
import { T } from '../constants/theme';
import { DashboardSkeleton } from '../components/ui';
import { FloatingNav } from '../components/ui/FloatingNav';

const API = apiClient as any;

const getInitials = (name: string) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const getDayLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();

const getWeekDays = () => {
  const today = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 1 + i);
    return {
      date: d.getDate(),
      day: getDayLabel(d),
      isToday: i === 1,
      full: d,
    };
  });
};

export default function ProductionParentDashboard() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();
  const { setDrawerNavigation } = useDrawer();
  const { children, activeChild, setActiveChild, loadChildren } = useActiveChild();

  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);

  const studentId = activeChild?.studentId ?? children[0]?.studentId;
  const selectedChild = activeChild ?? children[0];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    const rootNav = navigation.getParent?.()?.getParent?.() ?? navigation.getParent?.() ?? navigation;
    setDrawerNavigation(rootNav);
    return () => setDrawerNavigation(null);
  }, [navigation, setDrawerNavigation]);

  const loadDashboard = useCallback(async (sid: string) => {
    if (!sid) return;
    try {
      const raw = await ParentService.getDashboard(sid);
      setData(raw?.data ?? raw);
    } catch {
      setData(null);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const res = await API.get('/events', { params: { month, year } }).catch(() => null);
      const d = (res as any)?.data ?? res;
      const list = Array.isArray(d) ? d : d?.events ?? d?.data ?? [];
      setEvents(Array.isArray(list) ? list.slice(0, 5) : []);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    const sid = activeChild?.studentId ?? children[0]?.studentId;
    if (sid) {
      setLoading(true);
      loadDashboard(sid).finally(() => setLoading(false));
    } else {
      setData(null);
      setLoading(false);
    }
  }, [activeChild?.studentId, children, loadDashboard]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!loading) animateIn();
  }, [loading, animateIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChildren();
    if (studentId) await loadDashboard(studentId);
    await loadEvents();
    setRefreshing(false);
    animateIn();
  }, [loadChildren, studentId, loadDashboard, loadEvents, animateIn]);

  const student = data?.student;
  const attendance = data?.attendance ?? {};
  const homework = data?.homework ?? {};
  const marks = data?.marks ?? {};
  const attPct = Math.round(attendance.percentage ?? 0);
  const homeworkPending = homework.pending ?? 0;
  const avgGrade = Math.round(marks.average ?? 0);
  const recentHomework = (homework.recent ?? []).slice(0, 3);

  const parentInitials = getInitials(userData?.name || '');
  const childName = student?.name || selectedChild?.name || 'Your Child';
  const weekDays = getWeekDays();

  const todayKey = new Date().toISOString().split('T')[0];
  const getEventDate = (ev: any): Date | null => {
    const raw = ev?.date ?? ev?.startDate ?? ev?.start ?? ev?.time ?? null;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const dashUpcoming = (data as any)?.upcomingEvents;
  const upcomingEvents =
    Array.isArray(dashUpcoming) && dashUpcoming.length > 0
      ? dashUpcoming.slice(0, 2)
      : [...events]
          .map((ev: any) => ({ ev, d: getEventDate(ev) }))
          .filter((x) => x.d)
          .sort((a, b) => (a.d as Date).getTime() - (b.d as Date).getTime())
          .filter((x) => {
            if (!x.d) return false;
            const mid = new Date(todayKey + 'T00:00:00');
            return (x.d as Date).getTime() >= mid.getTime();
          })
          .map((x) => x.ev)
          .slice(0, 2);

  const getAttendanceBadge = (pct: number) => {
    if (pct >= 85) return { label: 'GOOD', color: T.success };
    if (pct >= 70) return { label: 'FAIR', color: T.warning };
    return { label: 'LOW', color: T.danger };
  };
  const badge = getAttendanceBadge(attPct);

  const hwStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED':
        return { label: 'Done', bg: T.successTint, color: T.success, Icon: CheckCircle };
      case 'OVERDUE':
        return { label: 'Overdue', bg: T.dangerTint, color: T.danger, Icon: AlertCircle };
      default:
        return { label: 'Pending', bg: T.primaryLight, color: T.primary, Icon: Clock };
    }
  };

  if (loading && !data && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <LinearGradient
          colors={[T.primary, `${T.primary}DD`]}
          style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: T.px }}
        >
          <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 22 }}>Dashboard</Text>
        </LinearGradient>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
        }
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profile')}
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
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{parentInitials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>Hi, Welcome Back!</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{userData?.name || 'Parent'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
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
          >
            How is {childName.split(' ')[0]}
            {'\n'}
            doing today?
          </Text>

          {children.length >= 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {children.map((child) => {
                const on = activeChild?.studentId === child.studentId;
                return (
                  <TouchableOpacity
                    key={child.studentId}
                    onPress={() => setActiveChild(child)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: T.radius.full,
                      backgroundColor: on ? T.primary : T.card,
                      borderWidth: 1.5,
                      borderColor: on ? T.primary : T.inputBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: on ? T.textWhite : T.textDark,
                      }}
                    >
                      {child.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: T.px,
            marginTop: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('ParentAcademic' as never, {
                screen: 'Attendance',
                params: { fromCrossTab: true },
                merge: true,
              } as never)
            }
            style={{
              flex: 1.1,
              backgroundColor: T.primary,
              borderRadius: T.radius.xl,
              padding: 18,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <View
              style={{
                position: 'absolute',
                bottom: -28,
                right: -28,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: -18,
                right: 14,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: T.radius.full,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: 'flex-start',
                marginBottom: 12,
              }}
            >
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.9)' }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.4 }}>
                {badge.label}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.8 }}>
              ATTENDANCE
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 }}>
              <Text style={{ fontSize: 48, fontWeight: '800', color: T.textWhite, letterSpacing: -2, lineHeight: 52 }}>
                {attPct}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '400', color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>%</Text>
            </View>
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>this month</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('ParentAcademic' as never, {
                  screen: 'ReportCard',
                  params: { fromCrossTab: true },
                  merge: true,
                } as never)
              }
              style={{ backgroundColor: T.card, borderRadius: T.radius.lg, padding: 14, ...T.shadowSm }}
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
                <Star size={16} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 10, color: T.textPlaceholder, letterSpacing: 0.5, fontWeight: '600' }}>AVG GRADE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark, letterSpacing: -1, lineHeight: 30 }}>
                  {avgGrade}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: T.textPlaceholder, marginBottom: 2 }}>/100</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('ParentAcademic' as never, {
                  screen: 'Homework',
                  params: { fromCrossTab: true },
                  merge: true,
                } as never)
              }
              style={{ backgroundColor: T.card, borderRadius: T.radius.lg, padding: 14, ...T.shadowSm }}
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
                <FileText size={16} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 10, color: T.textPlaceholder, letterSpacing: 0.5, fontWeight: '600' }}>HOMEWORK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 3 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark, letterSpacing: -1, lineHeight: 30 }}>
                  {homeworkPending}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: T.textPlaceholder, marginBottom: 2 }}> due</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: T.px, marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark }}>Schedule</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ParentAcademic' as never, {
                  screen: 'Calendar',
                  params: { fromCrossTab: true },
                  merge: true,
                } as never)
              }
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: T.card,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Calendar size={15} color={T.primary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 5 }}>
            {weekDays.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 9,
                  borderRadius: T.radius.full,
                  backgroundColor: d.isToday ? T.primary : T.card,
                  borderWidth: 1.5,
                  borderColor: d.isToday ? T.primary : T.inputBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '600',
                    color: d.isToday ? 'rgba(255,255,255,0.7)' : T.textPlaceholder,
                  }}
                >
                  {d.day.slice(0, 3)}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: d.isToday ? '800' : '600',
                    color: d.isToday ? T.textWhite : T.textPlaceholder,
                    marginTop: 3,
                  }}
                >
                  {d.date}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: T.px, marginTop: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark }}>Recent Homework</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ParentAcademic' as never, {
                  screen: 'Homework',
                  params: { fromCrossTab: true },
                  merge: true,
                } as never)
              }
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: T.primary }}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentHomework.length === 0 ? (
            <View style={{ backgroundColor: T.card, borderRadius: T.radius.lg, padding: 24, alignItems: 'center', ...T.shadowSm }}>
              <BookOpen size={32} color={T.textPlaceholder} strokeWidth={1.5} />
              <Text style={{ color: T.textPlaceholder, fontSize: 13, fontWeight: '500', marginTop: 10 }}>No homework assigned yet</Text>
            </View>
          ) : (
            recentHomework.map((hw: any, i: number) => {
              const st = hwStatus(hw.status);
              const StatusIcon = st.Icon;
              return (
                <View
                  key={hw.id || hw.title || String(i)}
                  style={{
                    backgroundColor: T.card,
                    borderRadius: T.radius.lg,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 10,
                    ...T.shadowSm,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: T.radius.md,
                      backgroundColor: T.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp size={20} color={T.primary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{hw.title}</Text>
                    <Text style={{ fontSize: 11, color: T.textPlaceholder, marginTop: 3 }}>
                      {hw.subject} · Due{' '}
                      {hw.dueDate
                        ? new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : '—'}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: st.bg,
                      borderRadius: T.radius.sm,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <StatusIcon size={12} color={st.color} strokeWidth={1.8} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: st.color }}>{st.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </Animated.View>

        {upcomingEvents.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: T.px, marginTop: 22 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark, marginBottom: 12 }}>Upcoming</Text>
            {upcomingEvents.map((ev: any, i: number) => (
              <View
                key={ev.id || ev.title || String(i)}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.lg,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 10,
                  ...T.shadowSm,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: T.radius.md,
                    backgroundColor: T.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={20} color={T.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{ev.title}</Text>
                  <Text style={{ fontSize: 11, color: T.textPlaceholder, marginTop: 3 }}>
                    {getEventDate(ev)?.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    }) ?? ev.date ?? ev.startDate ?? '—'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: T.primaryLight,
                    borderRadius: T.radius.sm,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '700', color: T.primary }}>{ev.type || 'EVENT'}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <FloatingNav navigation={navigation} activeTab="ParentHome" />
    </View>
  );
}
