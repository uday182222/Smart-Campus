/**
 * Teacher — upload / edit class weekly timetable (A17).
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { apiClient } from '../../services/apiClient';
import { ClassService } from '../../services/ClassService';
import { T, barBottomWithNav, scrollPadWithNavAndBar } from '../../constants/theme';
import { LightButton } from '../../components/ui';
import { getDefaultTimetableDay } from '../../components/ui/TimetableDayView';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const PERIOD_SLOTS = [
  { periodNumber: 1, startTime: '08:00', endTime: '08:45' },
  { periodNumber: 2, startTime: '08:45', endTime: '09:30' },
  { periodNumber: 3, startTime: '09:45', endTime: '10:30' },
  { periodNumber: 4, startTime: '10:30', endTime: '11:15' },
  { periodNumber: 5, startTime: '11:30', endTime: '12:15' },
  { periodNumber: 6, startTime: '12:15', endTime: '13:00' },
] as const;

type PeriodDraft = {
  dayOfWeek: number;
  periodNumber: number;
  subject: string;
  teacherId: string | null;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
};

type ClassItem = {
  id: string;
  name: string;
  section?: string;
  roomNumber?: string | null;
};

function periodKey(dayOfWeek: number, periodNumber: number) {
  return `${dayOfWeek}-${periodNumber}`;
}

function buildEmptyWeek(roomNumber?: string | null): Map<string, PeriodDraft> {
  const map = new Map<string, PeriodDraft>();
  for (let day = 1; day <= 6; day++) {
    for (const slot of PERIOD_SLOTS) {
      map.set(periodKey(day, slot.periodNumber), {
        dayOfWeek: day,
        periodNumber: slot.periodNumber,
        subject: '',
        teacherId: null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomNumber: roomNumber ?? null,
      });
    }
  }
  return map;
}

function mergePeriodsIntoMap(periods: any[], roomNumber?: string | null): Map<string, PeriodDraft> {
  const map = buildEmptyWeek(roomNumber);
  for (const p of periods) {
    const key = periodKey(p.dayOfWeek, p.periodNumber);
    const slot = PERIOD_SLOTS.find((s) => s.periodNumber === p.periodNumber);
    map.set(key, {
      dayOfWeek: p.dayOfWeek,
      periodNumber: p.periodNumber,
      subject: p.subject ?? '',
      teacherId: p.teacher?.id ?? p.teacherId ?? null,
      startTime: p.startTime ?? slot?.startTime ?? '08:00',
      endTime: p.endTime ?? slot?.endTime ?? '08:45',
      roomNumber: p.roomNumber ?? roomNumber ?? null,
    });
  }
  return map;
}

export default function TimetableEditScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedDay, setSelectedDay] = useState(getDefaultTimetableDay);
  const [periodMap, setPeriodMap] = useState<Map<string, PeriodDraft>>(() => buildEmptyWeek());
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? []).map((c: any) => ({
        id: c.id,
        name: String(c.name ?? 'Class'),
        section: c.section,
        roomNumber: c.roomNumber ?? c.room ?? null,
      }));
      setClasses(list);
      setSelectedClass((prev) => {
        if (prev && list.some((x) => x.id === prev.id)) return prev;
        return list[0] ?? null;
      });
    } catch {
      setClasses([]);
      setSelectedClass(null);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadTimetable = useCallback(async (cls: ClassItem) => {
    setLoadingTimetable(true);
    try {
      const res = await API.get(`/timetable/class/${cls.id}`);
      const data = (res as any)?.data ?? res;
      const payload = data?.data ?? data;
      const periods = Array.isArray(payload?.periods) ? payload.periods : [];
      setPeriodMap(mergePeriodsIntoMap(periods, cls.roomNumber));
    } catch {
      setPeriodMap(buildEmptyWeek(cls.roomNumber));
    } finally {
      setLoadingTimetable(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClass) loadTimetable(selectedClass);
  }, [selectedClass, loadTimetable]);

  const dayRows = useMemo(() => {
    return PERIOD_SLOTS.map((slot) => {
      const key = periodKey(selectedDay, slot.periodNumber);
      return periodMap.get(key) ?? {
        dayOfWeek: selectedDay,
        periodNumber: slot.periodNumber,
        subject: '',
        teacherId: null,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomNumber: selectedClass?.roomNumber ?? null,
      };
    });
  }, [periodMap, selectedDay, selectedClass?.roomNumber]);

  const updatePeriod = (periodNumber: number, patch: Partial<PeriodDraft>) => {
    const key = periodKey(selectedDay, periodNumber);
    setPeriodMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) ?? {
        dayOfWeek: selectedDay,
        periodNumber,
        subject: '',
        teacherId: null,
        startTime: PERIOD_SLOTS[periodNumber - 1].startTime,
        endTime: PERIOD_SLOTS[periodNumber - 1].endTime,
        roomNumber: selectedClass?.roomNumber ?? null,
      };
      next.set(key, { ...existing, ...patch });
      return next;
    });
  };

  const saveTimetable = () => {
    if (!selectedClass) return;
    Alert.alert(
      'Replace timetable?',
      'This will replace the entire weekly timetable for this class.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const periods = Array.from(periodMap.values())
                .filter((p) => p.subject.trim().length > 0)
                .map((p) => ({
                  dayOfWeek: p.dayOfWeek,
                  periodNumber: p.periodNumber,
                  subject: p.subject.trim(),
                  teacherId: p.teacherId,
                  startTime: p.startTime.trim(),
                  endTime: p.endTime.trim(),
                  roomNumber: p.roomNumber?.trim() || null,
                }));

              await API.put(`/timetable/class/${selectedClass.id}`, { periods });
              Alert.alert('Saved', 'Timetable updated successfully.');
              await loadTimetable(selectedClass);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Failed to save timetable.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Manage Timetable</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: scrollPadWithNavAndBar(insets.bottom) }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 14, marginBottom: 10 }}>Class</Text>
        {loadingClasses ? (
          <ActivityIndicator color={primary} />
        ) : classes.length === 0 ? (
          <Text style={{ color: T.textMuted, fontSize: 14 }}>No assigned classes.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {classes.map((cls) => {
              const active = selectedClass?.id === cls.id;
              const label = cls.section ? `${cls.name} ${cls.section}` : cls.name;
              return (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => setSelectedClass(cls)}
                  style={{
                    height: 36,
                    paddingHorizontal: 16,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? T.primary : T.card,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: T.inputBorder,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: active ? T.textWhite : T.textDark }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 14, marginTop: 20, marginBottom: 10 }}>Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {DAY_LABELS.map((label, idx) => {
            const day = idx + 1;
            const active = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? T.primary : T.card,
                  borderWidth: active ? 0 : 1.5,
                  borderColor: T.inputBorder,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: active ? T.textWhite : T.textDark }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loadingTimetable ? (
          <ActivityIndicator color={primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={{ marginTop: 20 }}>
            {dayRows.map((row) => (
              <View
                key={row.periodNumber}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 16,
                  marginBottom: 12,
                  ...T.shadowSm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: T.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: T.primary, fontWeight: '800', fontSize: 14 }}>{row.periodNumber}</Text>
                  </View>
                  <Text style={{ marginLeft: 10, color: T.textMuted, fontSize: 12, fontWeight: '600' }}>
                    Period {row.periodNumber}
                  </Text>
                </View>

                <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>Subject</Text>
                <TextInput
                  value={row.subject}
                  onChangeText={(text) => updatePeriod(row.periodNumber, { subject: text })}
                  placeholder="e.g. Mathematics"
                  placeholderTextColor={T.textPlaceholder}
                  style={{
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: T.textDark,
                    fontSize: 15,
                    fontWeight: '600',
                    marginBottom: 12,
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>Start</Text>
                    <TextInput
                      value={row.startTime}
                      onChangeText={(text) => updatePeriod(row.periodNumber, { startTime: text })}
                      placeholder="08:00"
                      placeholderTextColor={T.textPlaceholder}
                      style={{
                        borderWidth: 1.5,
                        borderColor: T.inputBorder,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: T.textDark,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>End</Text>
                    <TextInput
                      value={row.endTime}
                      onChangeText={(text) => updatePeriod(row.periodNumber, { endTime: text })}
                      placeholder="08:45"
                      placeholderTextColor={T.textPlaceholder}
                      style={{
                        borderWidth: 1.5,
                        borderColor: T.inputBorder,
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        color: T.textDark,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    />
                  </View>
                </View>

                <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 6 }}>Room</Text>
                <TextInput
                  value={row.roomNumber ?? ''}
                  onChangeText={(text) => updatePeriod(row.periodNumber, { roomNumber: text || null })}
                  placeholder="Room number"
                  placeholderTextColor={T.textPlaceholder}
                  style={{
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: T.textDark,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                />
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: barBottomWithNav(insets.bottom),
          backgroundColor: T.card,
          paddingHorizontal: T.px,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: T.inputBorder,
          zIndex: 50,
          ...T.shadowLg,
        }}
      >
        <LightButton
          label="Save Timetable"
          onPress={saveTimetable}
          variant="primary"
          loading={saving}
          disabled={!selectedClass || saving}
          style={{ backgroundColor: primary } as any}
        />
      </View>

      <TeacherFloatingNav navigation={navigation} activeTab="TeacherMore" />
    </View>
  );
}
