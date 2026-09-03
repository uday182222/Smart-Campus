/**
 * Teacher Enter Marks — dark + accent: exam setup, class/exam type chips, subject/max, student rows with marks input & grade badge, sticky save.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock, Download } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton } from '../../components/ui';
import { T, barBottomWithNav, scrollPadWithNavAndBar } from '../../constants/theme';
import { ClassService } from '../../services/ClassService';
import { apiClient } from '../../services/apiClient';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;
const EXAM_TYPES = ['Quiz', 'Assignment', 'Midterm', 'Final'];

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

function getGrade(marksStr: string, maxMarks: number, primary: string): { label: string; bg: string; text: string } {
  const n = parseFloat(marksStr);
  if (isNaN(n) || marksStr.trim() === '') return { label: '-', bg: T.primaryLight, text: T.textMuted };
  const pct = maxMarks > 0 ? (n / maxMarks) * 100 : 0;
  if (pct >= 90) return { label: 'A+', bg: T.successTint, text: T.success };
  if (pct >= 80) return { label: 'A', bg: T.successTint, text: T.success };
  if (pct >= 70) return { label: 'B', bg: T.primaryLight, text: T.primary };
  if (pct >= 60) return { label: 'C', bg: T.warningTint, text: T.warning };
  return { label: 'F', bg: T.dangerTint, text: T.danger };
}

function marksExceedsMax(value: string, maxMarks: number): boolean {
  if (!value.trim()) return false;
  const n = parseInt(value.replace(/[^0-9]/g, ''), 10);
  return !Number.isNaN(n) && n > maxMarks;
}

function parseMarksDigits(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

function apiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? 'Request failed';
}

type HistoryMark = {
  id?: string;
  marksObtained: number;
  maxMarks?: number;
  percentage?: string | number;
  exam?: {
    name?: string;
    subject?: string;
    examType?: string;
    date?: string;
    maxMarks?: number;
  };
};

function formatExamDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function percentageColor(pct: number): string {
  if (pct >= 75) return T.success;
  if (pct >= 40) return T.warning;
  return T.danger;
}

function formatExamTypeLabel(examType?: string): string {
  if (!examType) return 'Exam';
  return examType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function csvEscape(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function slugPart(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 40) || 'na';
}

export default function MarksEntryScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section?: string }>>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<Array<{ id: string; name: string; rollNumber?: string | null }>>([]);
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Quiz');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [savedMarkIds, setSavedMarkIds] = useState<Record<string, string>>({});
  const [examId, setExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [historyStudent, setHistoryStudent] = useState<{ id: string; name: string } | null>(null);
  const [historyMarks, setHistoryMarks] = useState<HistoryMark[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadExistingMarks = useCallback(async (eid: string) => {
    try {
      const res = await API.get(`/marks/${eid}`);
      const root = (res as any)?.data ?? res;
      const payload = root?.data ?? root;
      const list = Array.isArray(payload?.marks) ? payload.marks : [];
      const nextMap: Record<string, string> = {};
      const nextIds: Record<string, string> = {};
      for (const m of list) {
        const sid = m.studentId as string | undefined;
        if (!sid || m.marksObtained == null) continue;
        nextMap[sid] = String(m.marksObtained);
        if (m.id) nextIds[sid] = m.id;
      }
      setMarksMap(nextMap);
      setSavedMarkIds(nextIds);
    } catch (err: unknown) {
      Alert.alert('Error', apiErrorMessage(err));
    }
  }, []);

  const loadClasses = useCallback(async () => {
    setClassesError(null);
    setClassesLoading(true);
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? [])
        .filter((c: { isClassTeacher?: boolean }) => c.isClassTeacher === true)
        .map((c: any) => ({ id: c.id, name: `${c.name || ''} ${c.section || ''}`.trim(), section: c.section }));
      setClasses(list);
      if (list.length > 0) {
        setSelectedClassId((prev) => (prev && list.some((x) => x.id === prev) ? prev : list[0].id));
      } else {
        setSelectedClassId('');
      }
    } catch (err: unknown) {
      setClasses([]);
      setSelectedClassId('');
      setClassesError(apiErrorMessage(err));
    } finally {
      setClassesLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setStudentsError(null);
    try {
      const res = await ClassService.getTeacherClassStudents(selectedClassId);
      const list = (res.data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name ?? 'Student',
        rollNumber: s.rollNumber ?? s.metadata?.rollNumber ?? null,
      }));
      setStudents(list);
      setMarksMap({});
      setSavedMarkIds({});
      setExamId(null);
    } catch (err: unknown) {
      setStudents([]);
      setStudentsError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) loadStudents();
  }, [selectedClassId, loadStudents]);

  useEffect(() => {
    if (examId) loadExistingMarks(examId);
  }, [examId, loadExistingMarks]);

  const groupedHistory = useMemo(() => {
    const map = new Map<string, HistoryMark[]>();
    for (const m of historyMarks) {
      const subj = m.exam?.subject?.trim() || 'Other';
      if (!map.has(subj)) map.set(subj, []);
      map.get(subj)!.push(m);
    }
    return Array.from(map.entries());
  }, [historyMarks]);

  const openHistory = useCallback(async (student: { id: string; name: string }) => {
    setHistoryStudent(student);
    setHistoryLoading(true);
    setHistoryMarks([]);
    try {
      const res = await API.get(`/marks/student/${student.id}`);
      const root = (res as any)?.data ?? res;
      const payload = root?.data ?? root;
      const list = Array.isArray(payload?.marks) ? payload.marks : [];
      setHistoryMarks(list);
    } catch (err: unknown) {
      Alert.alert('Error', apiErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const saveAll = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Subject is required.');
      return;
    }
    const total = parseInt(totalMarks, 10) || 100;
    setSaving(true);
    let eid = examId;
    try {
      if (!eid) {
        const createRes = await API.post('/exams', {
          classId: selectedClassId,
          name: subject.trim(),
          subject: subject.trim(),
          examType: examType.toLowerCase(),
          date: new Date().toISOString().split('T')[0],
          maxMarks: total,
          passingMarks: Math.floor(total * 0.4),
        });
        const data = (createRes as any)?.data ?? createRes;
        const examPayload = data?.data ?? data;
        eid = examPayload?.exam?.id ?? examPayload?.id ?? data?.exam?.id ?? data?.id;
        if (!eid) throw new Error('Failed to create exam');
        setExamId(eid);
      }

      let succeeded = 0;
      let failed = 0;

      for (const s of students) {
        const val = marksMap[s.id]?.trim();
        if (val === '') continue;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > total) continue;
        const marksObtained = num;
        const existingMarkId = savedMarkIds[s.id];

        try {
          if (existingMarkId) {
            await API.put(`/marks/${existingMarkId}`, { marksObtained, remarks: null });
          } else {
            await API.post('/marks', {
              examId: eid,
              studentId: s.id,
              marksObtained,
              remarks: null,
            });
          }
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }

      if (eid) await loadExistingMarks(eid);

      if (succeeded === 0 && failed === 0) {
        Alert.alert('Info', 'Enter at least one mark before saving.');
      } else if (failed === 0) {
        Alert.alert('Success', `Marks saved for ${succeeded} students.`);
      } else if (succeeded > 0) {
        Alert.alert('Partial save', `Saved ${succeeded}. Failed ${failed} — please retry.`);
      } else {
        Alert.alert('Error', `Failed ${failed} — please retry.`);
      }
    } catch (err: unknown) {
      Alert.alert('Error', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const total = parseInt(totalMarks, 10) || 100;
  const markedCount = students.filter((s) => marksMap[s.id]?.trim() !== '').length;
  const hasInvalidMarks = students.some((s) => marksExceedsMax(marksMap[s.id] ?? '', total));
  const isRestricted = !classesLoading && !classesError && classes.length === 0;
  const canExport = !isRestricted && students.length > 0 && markedCount > 0;
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const classLabel = selectedClass?.name?.trim() || 'class';
  const examLabel = subject.trim() || examType || 'exam';

  const exportMarksCsv = async () => {
    if (!canExport) {
      Alert.alert('No Data', 'Enter marks before exporting.');
      return;
    }
    try {
      const headers = ['Roll Number', 'Student Name', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade'];
      const rows = students
        .filter((s) => marksMap[s.id]?.trim() !== '')
        .map((s) => {
          const markVal = marksMap[s.id]?.trim() ?? '';
          const obtained = parseFloat(markVal);
          const pct = !Number.isNaN(obtained) && total > 0 ? Math.round((obtained / total) * 100) : '';
          const grade = getGrade(markVal, total, primary).label;
          return [
            csvEscape(s.rollNumber ?? ''),
            csvEscape(s.name),
            csvEscape(Number.isNaN(obtained) ? '' : obtained),
            csvEscape(total),
            csvEscape(pct),
            csvEscape(grade),
          ].join(',');
        });
      const csvContent = [headers.join(','), ...rows].join('\n');
      const dateStr = new Date().toISOString().slice(0, 10);
      const title = `marks-${slugPart(classLabel)}-${slugPart(examLabel)}-${dateStr}.csv`;
      await Share.share({ message: csvContent, title });
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Enter Marks</Text>
          <TouchableOpacity
            onPress={exportMarksCsv}
            disabled={!canExport}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canExport ? 1 : 0.35,
              ...T.shadowSm,
            }}
          >
            <Download size={20} color={canExport ? T.textDark : T.textPlaceholder} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {classesError ? (
          <View style={{ marginTop: 12, backgroundColor: T.dangerTint, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: T.danger, fontSize: 13, fontWeight: '600' }}>{classesError}</Text>
            <TouchableOpacity onPress={loadClasses} style={{ marginTop: 8 }}>
              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isRestricted ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
            contentContainerStyle={{ paddingHorizontal: T.px, gap: 8, paddingVertical: 4 }}
          >
            {classes.map((c) => {
              const isActive = selectedClassId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedClassId(c.id)}
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
        ) : null}
      </View>

      {isRestricted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Lock size={40} color={T.textPlaceholder} strokeWidth={1.8} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: T.textDark, marginTop: 16 }}>Marks entry restricted</Text>
          <Text style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
            Only class teachers can enter marks. You are not assigned as a class teacher for any class.
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: scrollPadWithNavAndBar(insets.bottom) }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 8, ...T.shadowSm }}>
              <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15 }}>Exam Setup</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {EXAM_TYPES.map((t) => {
                  const isActive = examType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setExamType(t)}
                      style={{
                        backgroundColor: isActive ? T.primary : T.card,
                        borderRadius: 999,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderWidth: 1.5,
                        borderColor: isActive ? T.primary : T.inputBorder,
                      }}
                    >
                      <Text style={{ color: isActive ? '#FFFFFF' : T.textDark, fontWeight: isActive ? '900' : '600', fontSize: 13 }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TextInput
                  style={{
                    flex: 2,
                    backgroundColor: T.card,
                    borderRadius: T.radius.lg,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: T.textDark,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: T.inputBorder,
                  }}
                  placeholder="Subject"
                  placeholderTextColor={T.textPlaceholder}
                  value={subject}
                  onChangeText={setSubject}
                />
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: T.card,
                    borderRadius: T.radius.lg,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: T.textDark,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: T.inputBorder,
                  }}
                  placeholder="Max"
                  placeholderTextColor={T.textPlaceholder}
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={{ color: T.textDark, fontSize: 20, fontWeight: '900', marginTop: 16 }}>Students</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2, marginBottom: 12 }}>Enter marks for each student</Text>

            {studentsError ? (
              <View style={{ backgroundColor: T.dangerTint, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ color: T.danger, fontSize: 13, fontWeight: '600' }}>{studentsError}</Text>
                <TouchableOpacity onPress={loadStudents} style={{ marginTop: 8 }}>
                  <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {loading ? (
              <View style={{ gap: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ backgroundColor: T.card, borderRadius: 14, height: 64, marginBottom: 8, ...T.shadowSm }} />
                ))}
              </View>
            ) : (
              students.map((s) => {
                const grade = getGrade(marksMap[s.id] ?? '', total, primary);
                const markVal = marksMap[s.id] ?? '';
                const overMax = marksExceedsMax(markVal, total);
                return (
                  <View key={s.id} style={{ marginBottom: 10 }}>
                    <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, flexDirection: 'row', alignItems: 'center', ...T.shadowSm }}>
                      <TouchableOpacity
                        onPress={() => openHistory(s)}
                        activeOpacity={0.85}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{getInitials(s.name)}</Text>
                        </View>
                        <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15, flex: 1, marginLeft: 12 }} numberOfLines={1}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={{
                          width: 72,
                          height: 48,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: overMax ? T.danger : T.inputBorder,
                          color: overMax ? T.danger : T.primary,
                          fontWeight: '900',
                          fontSize: 20,
                          textAlign: 'center',
                        }}
                        placeholder="0"
                        placeholderTextColor={T.textPlaceholder}
                        value={markVal}
                        onChangeText={(t) => {
                          const cleaned = parseMarksDigits(t);
                          if (cleaned === '') {
                            setMarksMap((m) => ({ ...m, [s.id]: '' }));
                            return;
                          }
                          const n = parseInt(cleaned, 10);
                          if (!Number.isNaN(n) && n > total) return;
                          setMarksMap((m) => ({ ...m, [s.id]: cleaned }));
                        }}
                        keyboardType="numeric"
                      />
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: grade.bg, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                        <Text style={{ color: grade.text, fontWeight: '900', fontSize: 12 }}>{grade.label}</Text>
                      </View>
                    </View>
                    {overMax ? (
                      <Text style={{ color: T.danger, fontSize: 11, marginTop: 4, marginLeft: 4 }}>
                        Cannot exceed {total} marks
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              bottom: barBottomWithNav(insets.bottom),
              left: 0,
              right: 0,
              backgroundColor: T.card,
              paddingTop: 12,
              paddingHorizontal: T.px,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: T.inputBorder,
              zIndex: 50,
              ...T.shadowLg,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: T.textMuted, fontSize: 14 }}>{markedCount} students marked</Text>
              <LightButton
                label="Save All Marks"
                onPress={saveAll}
                variant="primary"
                icon="checkmark-circle-outline"
                iconPosition="left"
                fullWidth={false}
                style={{ paddingHorizontal: 24 }}
                loading={saving}
                disabled={hasInvalidMarks}
              />
            </View>
          </View>
        </>
      )}
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherClasses" />

      <Modal visible={!!historyStudent} transparent animationType="slide" onRequestClose={() => setHistoryStudent(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setHistoryStudent(null)}>
          <Pressable style={{ backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' }} onPress={(e) => e.stopPropagation()}>
            <View style={{ width: 40, height: 4, backgroundColor: T.inputBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>
              {historyStudent?.name ?? 'Student'}
            </Text>

            {historyLoading ? (
              <ActivityIndicator color={T.primary} style={{ marginVertical: 32 }} />
            ) : groupedHistory.length === 0 ? (
              <Text style={{ color: T.textMuted, fontSize: 14, textAlign: 'center', marginVertical: 32 }}>
                No previous marks recorded
              </Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {groupedHistory.map(([subj, marks]) => (
                  <View key={subj} style={{ marginBottom: 20 }}>
                    <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 16, marginBottom: 10 }}>{subj}</Text>
                    {marks.map((m) => {
                      const max = m.exam?.maxMarks ?? m.maxMarks ?? 100;
                      const obtained = m.marksObtained ?? 0;
                      const pct = max > 0 ? (obtained / max) * 100 : 0;
                      const pctText = m.percentage != null ? String(m.percentage) : pct.toFixed(0);
                      return (
                        <View
                          key={m.id ?? `${subj}-${m.exam?.name}-${m.exam?.date}`}
                          style={{
                            backgroundColor: T.bg,
                            borderRadius: T.radius.lg,
                            padding: 14,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: T.inputBorder,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 14, flex: 1 }}>
                              {m.exam?.name ?? 'Exam'}
                            </Text>
                            <View style={{ backgroundColor: T.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 11 }}>
                                {formatExamTypeLabel(m.exam?.examType)}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text style={{ color: percentageColor(pct), fontWeight: '800', fontSize: 16 }}>
                              {obtained}/{max} ({pctText}%)
                            </Text>
                            <Text style={{ color: T.textMuted, fontSize: 12 }}>{formatExamDate(m.exam?.date)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setHistoryStudent(null)}
              style={{
                marginTop: 16,
                backgroundColor: T.primary,
                borderRadius: T.radius.full,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '700', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
