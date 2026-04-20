/**
 * Teacher Attendance — dark + accent: class selector, date picker, P/A/L buttons, sticky save.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton } from '../../components/ui';
import { ClassService } from '../../services/ClassService';
import { AttendanceService } from '../../services/AttendanceService';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'not_marked';

interface StudentRow {
  id: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
}

interface ClassOption {
  id: string;
  name: string;
  studentCount?: number;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

export default function AttendanceScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? []).map((c: any) => ({
        id: c.id,
        name: `${c.name || ''} ${c.section || ''}`.trim() || `Class ${c.id}`,
        studentCount: c.studentCount ?? c._count?.students,
      }));
      setClasses(list);
      if (list.length > 0 && !selectedClass) setSelectedClass(list[0]);
    } catch (_e) {
      setClasses([]);
    }
  }, [selectedClass]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        ClassService.getTeacherClassStudents(selectedClass.id),
        AttendanceService.getInstance().getClassAttendance(selectedClass.id, selectedDate).catch(() => []),
      ]);
      const rawList = studentsRes.data ?? [];
      const attendanceList = Array.isArray(attendanceRes)
        ? attendanceRes
        : (attendanceRes as any)?.data?.attendance ?? (attendanceRes as any)?.attendance ?? [];
      const attendanceMap = new Map(
        attendanceList.map((a: any) => [a.studentId, a.status === 'present' || a.status === 'absent' || a.status === 'late' ? a.status : 'not_marked'])
      );
      const rows: StudentRow[] = (rawList as any[]).map((s: any, i: number) => ({
        id: s.id,
        name: s.name ?? `Student ${i + 1}`,
        rollNumber: String(s.rollNumber ?? s.roll ?? i + 1),
        status: (attendanceMap.get(s.id) as AttendanceStatus) || 'not_marked',
      }));
      setStudents(rows);
    } catch (_e) {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass, selectedDate, fetchStudents]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));
  };

  const saveAttendance = async () => {
    if (!selectedClass) return;
    const unmarked = students.filter((s) => s.status === 'not_marked').length;
    if (unmarked > 0) {
      Alert.alert(
        'Incomplete',
        `${unmarked} student(s) not marked. Mark all as present and save?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Present',
            onPress: () => {
              setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' as AttendanceStatus })));
              setTimeout(performSave, 100);
            },
          },
        ]
      );
      return;
    }
    await performSave();
  };

  const performSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        studentName: s.name,
        classId: selectedClass.id,
        className: selectedClass.name,
        date: selectedDate,
        status: s.status,
        remarks: '',
        markedBy: '',
        subject: '',
      }));
      const result = await AttendanceService.getInstance().markAttendance(records as any);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Success', 'Attendance saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else throw new Error(result.message);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const present = students.filter((s) => s.status === 'present').length;
  const absent = students.filter((s) => s.status === 'absent').length;
  const late = students.filter((s) => s.status === 'late').length;
  const marked = present + absent + late;

  const dateLabel =
    selectedDate.toDateString() === new Date().toDateString()
      ? 'Today'
      : selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => (canGoBack ? navigation.goBack() : null)}
            disabled={!canGoBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canGoBack ? 1 : 0,
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Mark Attendance</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
          >
            <ChevronLeft size={18} color={T.primary} strokeWidth={1.8} />
          </TouchableOpacity>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={{
              flex: 1,
              marginHorizontal: 10,
              backgroundColor: T.card,
              borderRadius: T.radius.full,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              paddingVertical: 10,
              paddingHorizontal: 14,
              alignItems: 'center',
              ...T.shadowSm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarIcon size={16} color={T.primary} strokeWidth={1.8} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: T.textDark }}>
                {dateLabel}, {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
              </Text>
            </View>
          </Pressable>
          <TouchableOpacity
            onPress={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d);
            }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
          >
            <ChevronRight size={18} color={T.primary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
          contentContainerStyle={{ paddingHorizontal: T.px, gap: 8, paddingVertical: 4 }}
        >
          {classes.map((c) => {
            const isActive = selectedClass?.id === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedClass(c)}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: isActive ? T.primary : T.card,
                  borderWidth: 1.5,
                  borderColor: isActive ? T.primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? T.textWhite : T.textDark }}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', paddingHorizontal: T.px, marginTop: 16, gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: T.successTint, borderRadius: T.radius.xl, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}>
            <CheckCircle size={18} color={T.success} strokeWidth={1.8} />
            <Text style={{ color: T.success, fontSize: 28, fontWeight: '900', marginTop: 6 }}>{present}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Present</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.dangerTint, borderRadius: T.radius.xl, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)' }}>
            <XCircle size={18} color={T.danger} strokeWidth={1.8} />
            <Text style={{ color: T.danger, fontSize: 28, fontWeight: '900', marginTop: 6 }}>{absent}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Absent</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.warningTint, borderRadius: T.radius.xl, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)' }}>
            <Clock size={18} color={T.warning} strokeWidth={1.8} />
            <Text style={{ color: T.warning, fontSize: 28, fontWeight: '900', marginTop: 6 }}>{late}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Late</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: T.px, marginTop: 16 }}>
          <Text style={{ color: T.textDark, fontSize: 20, fontWeight: '900' }}>{students.length} Students</Text>
          <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2, marginBottom: 12 }}>Tap P / A / L to mark</Text>

          {loading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, height: 72, marginBottom: 8 }} />
              ))}
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: T.card, borderRadius: T.radius.xl, padding: 16, marginBottom: 10, ...T.shadowSm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: T.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>{getInitials(item.name)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 16 }}>{item.name}</Text>
                      <Text style={{ color: T.textMuted, fontSize: 12 }}>{item.rollNumber}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['present', 'absent', 'late'] as const).map((status) => {
                        const isSelected = item.status === status;
                        const bg = { present: T.successTint, absent: T.dangerTint, late: T.warningTint }[status];
                        const colors = { present: T.success, absent: T.danger, late: T.warning }[status];
                        return (
                          <TouchableOpacity
                            key={status}
                            onPress={() => updateStatus(item.id, status)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: isSelected ? bg : T.card,
                              borderWidth: 1.5,
                              borderColor: isSelected ? colors : T.inputBorder,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: colors, fontWeight: '900', fontSize: 13 }}>
                              {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'L'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <Modal transparent animationType="fade">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowDatePicker(false)}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
              {(() => {
                try {
                  const DateTimePicker = require('@react-native-community/datetimepicker').default;
                  return (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_: any, d?: Date) => {
                        setShowDatePicker(Platform.OS !== 'ios');
                        if (d) setSelectedDate(d);
                      }}
                      textColor={T.textDark}
                    />
                  );
                } catch (_e) {
                  return <Text style={{ color: '#94A3B8', marginBottom: 12 }}>{selectedDate.toLocaleDateString()}</Text>;
                }
              })()}
              <LightButton label="Done" variant="primary" onPress={() => setShowDatePicker(false)} />
            </View>
          </Pressable>
        </Modal>
      )}

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: T.card,
          paddingTop: 12,
          paddingHorizontal: T.px,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: T.inputBorder,
          ...T.shadowLg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 14 }}>
            {marked} of {students.length} marked
          </Text>
          <LightButton
            label="Save Attendance"
            onPress={saveAttendance}
            variant="primary"
            icon="checkmark-circle-outline"
            iconPosition="left"
            fullWidth={false}
            style={{ paddingHorizontal: 24 }}
            loading={saving}
          />
        </View>
      </View>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherClasses" />
    </View>
  );
}
