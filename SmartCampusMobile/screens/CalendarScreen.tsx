/**
 * Calendar — dark + accent: month nav, DateStrip, events for selected date, tap date → bottom sheet.
 * Teacher/Parent: GET /events?month=&year=; tap date → GET /events/date/:date (classes + events + homework).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useAccentColor } from '../hooks/useAccentColor';
import { LightHeader, DateStrip, LightButton } from '../components/ui';
import { LT } from '../constants/lightTheme';
import { apiClient } from '../services/apiClient';

const API = apiClient as any;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  date?: string;
  type?: string;
  category?: string;
  time?: string;
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  Holiday: '#EF4444',
  Exam: '#3B82F6',
  Meeting: '#A855F7',
  Event: '#2B5CE6',
  holiday: '#EF4444',
  exam: '#3B82F6',
  meeting: '#A855F7',
  event: '#2B5CE6',
  HOLIDAY: '#EF4444',
  EXAM: '#3B82F6',
  MEETING: '#A855F7',
  EVENT: '#2B5CE6',
  REMINDER: '#F59E0B',
};

export default function CalendarScreen() {
  const accent = useAccentColor();
  const { userData } = useAuth();
  const navigation = useNavigation<any>();
  const schoolId = userData?.schoolId ?? '';
  const isTeacher = (userData?.role ?? '').toLowerCase() === 'teacher';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [markedDates, setMarkedDates] = useState<string[]>([]);
  const [dateDetailVisible, setDateDetailVisible] = useState(false);
  const [dateDetailData, setDateDetailData] = useState<{
    events: Array<{ id: string; title: string; description?: string; type: string }>;
    classes: Array<{ id: string; name: string; section: string; subject: string; startTime: string; endTime: string; room: string }>;
    homeworkDue: Array<{ id: string; title: string; subject: string; className: string }>;
    reminders: unknown[];
  } | null>(null);
  const [dateDetailLoading, setDateDetailLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const month = viewMonth.getMonth() + 1;
      const year = viewMonth.getFullYear();
      const res = await API.get('/events', { params: { month, year } });
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.events ?? data?.data ?? [];
      const mapped = list.map((e: any) => ({
        id: e.id,
        title: e.title ?? 'Event',
        description: e.description ?? '',
        startDate: e.date ?? e.startDate ?? e.start ?? '',
        date: (e.date ?? e.startDate ?? e.start)?.toString?.().split?.('T')[0],
        type: e.type ?? 'EVENT',
        category: (e.type ?? 'event').toLowerCase(),
        time: e.time,
      }));
      setEvents(mapped);
      const withEvents = new Set<string>(
        (list as any[]).map((e: any) => (e.date ?? e.startDate ?? e.start)?.toString?.().split?.('T')[0]).filter(Boolean)
      );
      setMarkedDates(Array.from(withEvents));
    } catch (_e) {
      setEvents([]);
    } finally {
      setRefreshing(false);
    }
  }, [viewMonth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const openDateDetail = useCallback(async (date: Date) => {
    setSelectedDate(date);
    setDateDetailVisible(true);
    setDateDetailLoading(true);
    setDateDetailData(null);
    const dateStr = date.toISOString().split('T')[0];
    try {
      const res = await API.get(`/events/date/${dateStr}`);
      const raw = (res as any)?.data?.data ?? (res as any)?.data ?? {};
      setDateDetailData({
        events: raw.events ?? [],
        classes: raw.classes ?? [],
        homeworkDue: raw.homeworkDue ?? [],
        reminders: raw.reminders ?? [],
      });
    } catch (_e) {
      setDateDetailData({ events: [], classes: [], homeworkDue: [], reminders: [] });
    } finally {
      setDateDetailLoading(false);
    }
  }, []);

  const dayStart = new Date(selectedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(selectedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const dateStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter((e) => {
    const s = (e.startDate ?? '').toString().split('T')[0];
    return s === dateStr;
  });

  const upcomingStart = new Date(selectedDate);
  upcomingStart.setDate(upcomingStart.getDate() + 1);
  const upcomingEnd = new Date(upcomingStart);
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);
  const upcomingEvents = events
    .filter((e) => {
      const d = new Date(e.startDate);
      return d >= upcomingStart && d <= upcomingEnd;
    })
    .slice(0, 10);

  const monthYearLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const getTypeColor = (ev: CalendarEvent) => {
    const t = (ev.type ?? ev.category ?? 'event') as string;
    const key = t.charAt(0).toUpperCase() + t.slice(1);
    return EVENT_TYPE_COLOR[key] ?? EVENT_TYPE_COLOR[t] ?? accent;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF2FF' }} edges={['top']}>
      <LightHeader title="Calendar" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => setViewMonth((d) => { const x = new Date(d); x.setMonth(x.getMonth() - 1); return x; })}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-back" size={22} color={accent} />
          </TouchableOpacity>
          <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 20 }}>{monthYearLabel}</Text>
          <TouchableOpacity
            onPress={() => setViewMonth((d) => { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; })}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="chevron-forward" size={22} color={accent} />
          </TouchableOpacity>
        </View>

        <DateStrip
          selectedDate={selectedDate}
          onDateSelect={(date) => openDateDetail(date)}
          markedDates={markedDates}
        />

        <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 20, marginTop: 24 }}>{dayEvents.length} Events</Text>
        <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>on this day</Text>

        {dayEvents.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="calendar-outline" size={48} color={accent} />
            <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 12 }}>No events today</Text>
            <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 4 }}>enjoy a quiet day</Text>
          </View>
        ) : (
          dayEvents.map((ev) => {
            const typeColor = getTypeColor(ev);
            const start = new Date(ev.startDate);
            const timeStr = ev.time ?? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <View
                key={ev.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: typeColor,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: typeColor + '26', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="calendar-outline" size={18} color={typeColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16 }}>{ev.title}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{timeStr}</Text>
                  </View>
                  <View style={{ backgroundColor: typeColor + '26', borderWidth: 1, borderColor: typeColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: typeColor, fontSize: 11, fontWeight: '700' }}>{(ev.type ?? ev.category ?? 'Event').toString()}</Text>
                  </View>
                </View>
                {ev.description ? <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 8 }}>{ev.description}</Text> : null}
              </View>
            );
          })
        )}

        <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 20, marginTop: 32 }}>Upcoming</Text>
        <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>next 7 days</Text>
        {upcomingEvents.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic' }}>No upcoming events</Text>
          </View>
        ) : (
          upcomingEvents.map((ev) => {
            const typeColor = getTypeColor(ev);
            const start = new Date(ev.startDate);
            const timeStr = ev.time ?? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <View
                key={ev.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: typeColor,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: typeColor + '26', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="calendar-outline" size={18} color={typeColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16 }}>{ev.title}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{start.toLocaleDateString()} · {timeStr}</Text>
                  </View>
                  <View style={{ backgroundColor: typeColor + '26', borderWidth: 1, borderColor: typeColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: typeColor, fontSize: 11, fontWeight: '700' }}>{(ev.type ?? ev.category ?? 'Event').toString()}</Text>
                  </View>
                </View>
                {ev.description ? <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 8 }}>{ev.description}</Text> : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Date details bottom sheet (tap date on strip) */}
      <Modal
        visible={dateDetailVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDateDetailVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setDateDetailVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: SCREEN_HEIGHT * 0.7,
                padding: 24,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#E2E8F0',
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />
              {dateDetailLoading ? (
                <Text style={{ color: '#94A3B8', textAlign: 'center', paddingVertical: 24 }}>Loading...</Text>
              ) : dateDetailData ? (
                <ScrollView showsVerticalScrollIndicator={false} style={{ paddingBottom: 24 }}>
                  <Text style={{ color: LT.textPrimary, fontSize: 22, fontWeight: '900' }}>
                    {selectedDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
                    {isTeacher && (
                      <View
                        style={{
                          backgroundColor: accent + '26',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>
                          {dateDetailData.classes.length} Classes
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        backgroundColor: (EVENT_TYPE_COLOR.EVENT || accent) + '26',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: EVENT_TYPE_COLOR.EVENT || accent, fontSize: 12, fontWeight: '700' }}>
                        {dateDetailData.events.length} Events
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#F59E0B26',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>
                        {dateDetailData.homeworkDue.length} Due
                      </Text>
                    </View>
                  </View>
                  {isTeacher && dateDetailData.classes.length > 0 && (
                    <>
                      <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 16, marginBottom: 8 }}>
                        Classes
                      </Text>
                      {dateDetailData.classes.map((cls) => (
                        <View
                          key={cls.id}
                          style={{
                            backgroundColor: '#EEF2FF',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 6,
                            borderLeftWidth: 3,
                            borderLeftColor: accent,
                          }}
                        >
                          <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 15 }}>
                            {cls.name} {cls.section}
                          </Text>
                          <Text style={{ color: accent, fontSize: 12, marginTop: 4 }}>{cls.subject}</Text>
                          <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                            {cls.startTime} – {cls.endTime} · {cls.room}
                          </Text>
                        </View>
                      ))}
                    </>
                  )}
                  {dateDetailData.events.length > 0 && (
                    <>
                      <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 16, marginBottom: 8 }}>
                        Events
                      </Text>
                      {dateDetailData.events.map((ev) => {
                        const typeColor = EVENT_TYPE_COLOR[ev.type] ?? accent;
                        return (
                          <View
                            key={ev.id}
                            style={{
                              backgroundColor: '#EEF2FF',
                              borderRadius: 12,
                              padding: 12,
                              marginBottom: 6,
                              borderLeftWidth: 3,
                              borderLeftColor: typeColor,
                            }}
                          >
                            <View
                              style={{
                                alignSelf: 'flex-start',
                                backgroundColor: typeColor + '26',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                              }}
                            >
                              <Text style={{ color: typeColor, fontSize: 11, fontWeight: '700' }}>{ev.type}</Text>
                            </View>
                            <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 15, marginTop: 6 }}>
                              {ev.title}
                            </Text>
                            {ev.description ? (
                              <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                                {ev.description}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </>
                  )}
                  {dateDetailData.homeworkDue.length > 0 && (
                    <>
                      <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 16, marginBottom: 8 }}>
                        Homework Due
                      </Text>
                      {dateDetailData.homeworkDue.map((hw) => (
                        <View
                          key={hw.id}
                          style={{
                            backgroundColor: '#EEF2FF',
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="book-outline" size={20} color={accent} style={{ marginRight: 10 }} />
                          <View>
                            <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 14 }}>{hw.title}</Text>
                            <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>{hw.className}</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                  {(dateDetailData.events.length === 0 &&
                    dateDetailData.classes.length === 0 &&
                    dateDetailData.homeworkDue.length === 0) && (
                    <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 16 }}>
                      Nothing scheduled this day
                    </Text>
                  )}
                  <LightButton
                    label="Close"
                    variant="ghost"
                    onPress={() => setDateDetailVisible(false)}
                    style={{ marginTop: 20 }}
                  />
                </ScrollView>
              ) : null}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
