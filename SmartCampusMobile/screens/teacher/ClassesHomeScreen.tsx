/**
 * Teacher — My Classes hub: class chips, summary cards, shortcuts to Attendance / Marks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { ClassService } from '../../services/ClassService';
import { LightButton } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

interface ClassItem {
  id: string;
  name: string;
  section?: string;
  room?: string;
  studentCount?: number;
}

export default function ClassesHomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState<{ present: number; absent: number; late: number } | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceTick, setAttendanceTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? []).map((c: any) => ({
        id: c.id,
        name: String(c.name ?? 'Class'),
        section: c.section,
        room: c.room,
        studentCount: c.studentCount ?? c._count?.students ?? 0,
      }));
      setClasses(list);
      setSelected((prev) => {
        if (prev && list.some((x) => x.id === prev.id)) return prev;
        return list[0] ?? null;
      });
    } catch {
      setClasses([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const fetchAttendance = async () => {
      if (!selected?.id) {
        setAttendance(null);
        return;
      }
      setAttendanceLoading(true);
      try {
        const date = new Date().toISOString().split('T')[0];
        const res = await apiClient.get(`/attendance/${selected.id}/${date}`);
        const summary = (res as any)?.data?.data?.summary ?? (res as any)?.data?.summary;
        if (cancelled) return;
        if (summary && typeof summary.present === 'number') {
          setAttendance({
            present: summary.present ?? 0,
            absent: summary.absent ?? 0,
            late: (summary.late ?? 0) + (summary.halfDay ?? 0),
          });
        } else {
          setAttendance(null);
        }
      } catch {
        if (!cancelled) setAttendance(null);
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    };
    fetchAttendance();
    return () => {
      cancelled = true;
    };
  }, [selected?.id, attendanceTick]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setAttendanceTick((t) => t + 1);
    setRefreshing(false);
  };

  const recentMarks = [
    { sub: 'Mathematics', label: 'Quiz', score: '82/100' },
    { sub: 'Science', label: 'Lab', score: '90/100' },
    { sub: 'English', label: 'Midterm', score: '76/100' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <Text style={{ ...T.font.appTitle, color: T.textDark }}>My Classes</Text>
        <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 6 }}>{classes.length} classes</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {classes.map((c) => {
            const active = selected?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelected(c)}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: active ? T.primary : T.card,
                  borderWidth: 1.5,
                  borderColor: active ? T.primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: active ? T.textWhite : T.textDark, fontWeight: '600', fontSize: 13 }}>
                  {c.name}
                  {c.section ? ` · ${c.section}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 120, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {loading && !selected ? (
          <Text style={{ color: T.textMuted, textAlign: 'center', marginTop: 24 }}>Loading classes…</Text>
        ) : selected ? (
          <>
            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 0, ...T.shadowSm }}>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 22 }}>{selected.name}</Text>
              <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 4 }}>
                Section {selected.section ?? '—'} · Room {selected.room ?? '—'}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: primary, fontWeight: '900', fontSize: 22 }}>{selected.studentCount ?? 0}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Students</Text>
                </View>
                <View style={{ width: 1, backgroundColor: T.inputBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: T.success, fontWeight: '900', fontSize: 22 }}>—</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Attendance</Text>
                </View>
                <View style={{ width: 1, backgroundColor: T.inputBorder }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: T.warning, fontWeight: '900', fontSize: 22 }}>—</Text>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Avg marks</Text>
                </View>
              </View>
            </View>

            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 16, ...T.shadowSm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 17 }}>Today's Attendance</Text>
                <Text style={{ color: T.textMuted, fontSize: 11 }}>{new Date().toLocaleDateString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-around', alignItems: 'center', minHeight: 24 }}>
                {attendanceLoading ? (
                  <>
                    <ActivityIndicator size="small" color={T.success} />
                    <ActivityIndicator size="small" color={T.danger} />
                    <ActivityIndicator size="small" color={T.warning} />
                  </>
                ) : (
                  <>
                    <Text style={{ color: T.success, fontWeight: '900' }}>
                      P {attendance ? attendance.present : '—'}
                    </Text>
                    <Text style={{ color: T.danger, fontWeight: '900' }}>
                      A {attendance ? attendance.absent : '—'}
                    </Text>
                    <Text style={{ color: T.warning, fontWeight: '900' }}>
                      L {attendance ? attendance.late : '—'}
                    </Text>
                  </>
                )}
              </View>
              <LightButton
                label="Mark Attendance"
                variant="primary"
                onPress={() => navigation.navigate('Attendance')}
                style={{ marginTop: 16 }}
                icon="checkmark-circle-outline"
                iconPosition="left"
              />
            </View>

            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 16, ...T.shadowSm }}>
              <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 17 }}>Recent Results</Text>
              {recentMarks.map((m, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingBottom: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: T.inputBorder }}>
                  <View>
                    <Text style={{ color: T.textDark, fontWeight: '700' }}>{m.sub}</Text>
                    <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{m.label}</Text>
                  </View>
                  <Text style={{ color: primary, fontWeight: '900' }}>{m.score}</Text>
                </View>
              ))}
              <LightButton
                label="Enter Marks"
                variant="outline"
                onPress={() => navigation.navigate('MarksEntry')}
                style={{ marginTop: 16 }}
                icon="create-outline"
                iconPosition="left"
              />
            </View>
          </>
        ) : (
          <Text style={{ color: T.textMuted, textAlign: 'center', marginTop: 24 }}>No classes assigned</Text>
        )}
      </ScrollView>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherClasses" />
    </View>
  );
}
