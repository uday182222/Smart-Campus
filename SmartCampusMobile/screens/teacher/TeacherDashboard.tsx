/**
 * Teacher Dashboard — premium gradient header, stats, schedule, quick actions, DateStrip, events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Users, FileText, CheckCircle, TrendingUp, BookOpen, MessageSquare, Clock, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useDrawer } from '../../contexts/DrawerContext';
import { DateStrip } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

interface TodayClass {
  id: string;
  className: string;
  section: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface DashboardData {
  todayClasses: TodayClass[];
  totalStudents: number;
  pendingHomework?: number;
  unreadMessages: number;
  upcomingEvents?: Array<{ id: string; title: string; date: string; type: string }>;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  Holiday: '#EF4444',
  Exam: '#3B82F6',
  Meeting: '#A855F7',
  Event: '#2B5CE6',
  HOLIDAY: '#EF4444',
  EXAM: '#3B82F6',
};

export default function TeacherDashboard() {
  const { userData } = useAuth();
  const navigation = useNavigation<any>();
  const { setDrawerNavigation, openDrawer } = useDrawer();
  const insets = useSafeAreaInsets();
  const teacherName = userData?.name ?? 'Teacher';
  const initials =
    teacherName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'T';

  const tabNav = navigation.getParent();

  useEffect(() => {
    const rootNav = navigation.getParent()?.getParent?.() ?? navigation.getParent?.() ?? navigation;
    setDrawerNavigation(rootNav);
    return () => setDrawerNavigation(null);
  }, [navigation, setDrawerNavigation]);

  const goTab = (tab: string, screen: string) => tabNav?.navigate(tab, { screen });

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [eventsMarkedDates, setEventsMarkedDates] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await API.get('/teacher/dashboard');
      const raw = (res as any)?.data ?? (res as any)?.data?.data ?? res ?? {};
      setData({
        todayClasses: raw.todayClasses ?? [],
        totalStudents: raw.totalStudents ?? 0,
        pendingHomework: raw.pendingHomework ?? raw.pendingGrading ?? 0,
        unreadMessages: raw.unreadMessages ?? 0,
        upcomingEvents: raw.upcomingEvents ?? [],
      });
    } catch (_e) {
      setData({
        todayClasses: [],
        totalStudents: 0,
        pendingHomework: 0,
        unreadMessages: 0,
        upcomingEvents: [],
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const m = selectedDate.getMonth() + 1;
    const y = selectedDate.getFullYear();
    API.get('/events', { params: { month: m, year: y } })
      .then((res: any) => {
        const list = res?.data?.data ?? res?.data ?? [];
        const dates = (Array.isArray(list) ? list : []).map((e: any) => (e.date || e.startDate || '').toString().split('T')[0]);
        setEventsMarkedDates([...new Set(dates)].filter(Boolean));
      })
      .catch(() => {});
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

  const todayClasses = data?.todayClasses ?? [];
  const classesToday = todayClasses.length;
  const pendingGrading = data?.pendingHomework ?? 0;
  const unreadMessages = data?.unreadMessages ?? 0;
  const totalStudents = data?.totalStudents ?? 0;
  const now = new Date();

  const getStatus = (c: TodayClass) => {
    const [sh, sm] = (c.startTime || '08:00').split(':').map(Number);
    const [eh, em] = (c.endTime || '09:00').split(':').map(Number);
    const start = new Date(now);
    start.setHours(sh, sm || 0, 0, 0);
    const end = new Date(now);
    end.setHours(eh, em || 0, 0, 0);
    if (now >= start && now <= end) return { isLive: true };
    return { isLive: false };
  };

  const markedDates = [...(data?.upcomingEvents ?? []).map((e) => e.date).filter(Boolean), ...eventsMarkedDates].filter(Boolean);
  const uniqueMarked = [...new Set(markedDates)] as string[];
  const monthYear = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const quick = [
    { label: 'Attendance', sub: "Today's class", Icon: CheckCircle, tab: 'TeacherClasses', screen: 'Attendance' },
    { label: 'Marks', sub: 'Exam results', Icon: TrendingUp, tab: 'TeacherClasses', screen: 'MarksEntry' },
    { label: 'Homework', sub: 'Assign & review', Icon: BookOpen, tab: 'TeacherHomework', screen: 'Homework' },
    { label: 'Remarks', sub: 'Student note', Icon: MessageSquare, tab: 'TeacherStudents', screen: 'Remarks' },
  ];

  const formatUntil = (endTime: string) => {
    if (!endTime) return '';
    const [h, m] = endTime.split(':');
    return `Until ${h}:${m || '00'}`;
  };

  if (loading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={T.primary} />}
      >
        {/* Header (avatar pill + bell) */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={openDrawer}
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
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>{getGreeting().replace(' 👋', '').replace('👋', '')}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }} numberOfLines={1}>
                  {teacherName}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => goTab('TeacherStudents', 'Messages')}
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
              {unreadMessages > 0 ? (
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
              ) : null}
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
            You have {classesToday} classes{'\n'}today
          </Text>
        </View>

        {/* Stat cards */}
        <View style={{ paddingHorizontal: T.px, marginTop: 16, flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
          <View
            style={{
              flex: 1,
              backgroundColor: T.primary,
              borderRadius: T.radius.xl,
              padding: 18,
              justifyContent: 'space-between',
              ...T.shadowMd,
            }}
          >
            <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: T.radius.full, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.textWhite, opacity: 0.9 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: T.textWhite, letterSpacing: 0.4 }}>TODAY</Text>
            </View>
            <Text style={{ marginTop: 10, fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.9 }}>CLASSES</Text>
            <Text style={{ fontSize: 48, fontWeight: '800', color: T.textWhite, letterSpacing: -2, marginTop: 4 }}>{classesToday}</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>scheduled today</Text>
          </View>

          <View style={{ flex: 1, gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, ...T.shadowSm }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ marginTop: 10, fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 0.8 }}>STUDENTS</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark, marginTop: 2 }}>{totalStudents}</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, ...T.shadowSm }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ marginTop: 10, fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 0.8 }}>PENDING HW</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: T.textDark }}>{pendingGrading}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: T.textMuted }}>tasks</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's schedule */}
        <View style={{ paddingHorizontal: T.px, marginTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark }}>Today's Schedule</Text>
            <View style={{ backgroundColor: T.primaryLight, borderRadius: T.radius.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: T.primary }}>
                {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            {todayClasses.length === 0 ? (
              <View style={{ backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, ...T.shadowSm }}>
                <Text style={{ color: T.textMuted }}>No classes scheduled today</Text>
              </View>
            ) : (
              todayClasses.map((c, idx) => {
                const live = getStatus(c).isLive;
                const borderColor = live ? T.primary : T.inputBorder;
                const label = live ? 'NOW' : idx === 0 ? 'NEXT' : 'LATER';
                return (
                  <View
                    key={c.id}
                    style={{
                      backgroundColor: T.card,
                      borderRadius: T.radius.xxl,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      marginBottom: 10,
                      borderLeftWidth: 4,
                      borderLeftColor: borderColor,
                      ...T.shadowSm,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ minWidth: 44, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: live ? T.primary : T.textMuted }}>{label}</Text>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: T.textMuted, marginTop: 2 }}>{c.startTime}</Text>
                      </View>
                      <View style={{ width: 1, height: 36, backgroundColor: T.inputBorder }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{c.subject}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '500', color: T.textMuted, marginTop: 3 }}>
                          {c.className} {c.section} · Room {c.room || '—'}
                        </Text>
                        <View
                          style={{
                            alignSelf: 'flex-start',
                            marginTop: 8,
                            backgroundColor: T.primaryLight,
                            borderWidth: 1.5,
                            borderColor: T.inputBorder,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 999,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: T.primary }}>{c.subject}</Text>
                        </View>
                      </View>
                      <View
                        style={
                          live
                            ? {
                                backgroundColor: T.successTint,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderWidth: 1.5,
                                borderColor: T.success,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }
                            : {
                                backgroundColor: T.primaryLight,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderWidth: 1.5,
                                borderColor: T.inputBorder,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                              }
                        }
                      >
                        {live ? <Clock size={14} color={T.success} strokeWidth={1.8} /> : null}
                        <Text style={{ fontSize: 10, fontWeight: '700', color: live ? T.success : T.primary }}>{live ? 'LIVE' : formatUntil(c.endTime)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Class schedule strip */}
        <View style={{ paddingHorizontal: T.px, marginTop: 6 }}>
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, ...T.shadowSm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark }}>Class Schedule</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: T.textMuted }}>{monthYear}</Text>
            </View>
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} markedDates={uniqueMarked} accent={T.primary} />
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ paddingHorizontal: T.px, marginTop: 18 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark, marginBottom: 14 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
            {quick.map((q) => (
              <TouchableOpacity
                key={q.label}
                onPress={() => goTab(q.tab, q.screen)}
                activeOpacity={0.85}
                style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, alignItems: 'center', ...T.shadowSm }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: T.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <q.Icon size={20} color={T.primary} strokeWidth={1.8} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: T.textDark, marginTop: 10, textAlign: 'center' }}>{q.label}</Text>
                <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 3, textAlign: 'center' }}>{q.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: T.px, marginTop: 22 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark, marginBottom: 14 }}>Upcoming Events</Text>
        {(data?.upcomingEvents?.length ?? 0) > 0 ? (
          (data!.upcomingEvents!).slice(0, 6).map((e) => {
            const typeColor = EVENT_TYPE_COLOR[e.type] ?? T.primary;
            return (
              <View
                key={e.id}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 16,
                  marginBottom: 10,
                  borderLeftWidth: 4,
                  borderLeftColor: typeColor,
                  ...T.shadowSm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={18} color={typeColor} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: T.textDark }}>{e.title}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: T.textMuted, marginTop: 3 }}>{e.date}</Text>
                  </View>
                  <View style={{ backgroundColor: `${typeColor}22`, borderWidth: 1, borderColor: `${typeColor}55`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: typeColor }}>{e.type}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, ...T.shadowSm }}>
            <Text style={{ color: T.textMuted }}>No upcoming events</Text>
          </View>
        )}
        </View>
      </ScrollView>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherHome" />
    </View>
  );
}
