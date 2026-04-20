/**
 * Teacher Enter Marks — dark + accent: exam setup, class/exam type chips, subject/max, student rows with marks input & grade badge, sticky save.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton } from '../../components/ui';
import { T } from '../../constants/theme';
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
  if (pct >= 70) return { label: 'B', bg: primary, text: '#FFFFFF' };
  if (pct >= 60) return { label: 'C', bg: T.warningTint, text: T.warning };
  return { label: 'F', bg: T.dangerTint, text: T.danger };
}

export default function MarksEntryScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section?: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('Quiz');
  const [totalMarks, setTotalMarks] = useState('100');
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [examId, setExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? []).map((c: any) => ({ id: c.id, name: `${c.name || ''} ${c.section || ''}`.trim(), section: c.section }));
      setClasses(list);
      if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
    } catch (_e) {
      setClasses([]);
    }
  }, [selectedClassId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await ClassService.getTeacherClassStudents(selectedClassId);
      const list = (res.data ?? []).map((s: any) => ({ id: s.id, name: s.name ?? 'Student' }));
      setStudents(list);
      setMarksMap({});
      setExamId(null);
    } catch (_e) {
      setStudents([]);
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

  const saveAll = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Subject is required.');
      return;
    }
    const total = parseInt(totalMarks, 10) || 100;
    setSaving(true);
    try {
      let eid = examId;
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
        eid = data?.exam?.id ?? data?.id;
        if (!eid) throw new Error('Failed to create exam');
        setExamId(eid);
      }
      for (const s of students) {
        const val = marksMap[s.id]?.trim();
        if (val === '') continue;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) continue;
        await API.post('/marks', {
          examId: eid,
          studentId: s.id,
          marksObtained: Math.min(num, total),
          remarks: null,
        });
      }
      Alert.alert('Success', 'Marks saved.');
      setMarksMap({});
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const total = parseInt(totalMarks, 10) || 100;
  const markedCount = students.filter((s) => marksMap[s.id]?.trim() !== '').length;

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
          <View style={{ width: 44, height: 44 }} />
        </View>

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
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
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

        {loading ? (
          <View style={{ gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ backgroundColor: T.card, borderRadius: 14, height: 64, marginBottom: 8, ...T.shadowSm }} />
            ))}
          </View>
        ) : (
          students.map((s) => {
            const grade = getGrade(marksMap[s.id] ?? '', total, primary);
            return (
              <View key={s.id} style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...T.shadowSm }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{getInitials(s.name)}</Text>
                </View>
                <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15, flex: 1, marginLeft: 12 }} numberOfLines={1}>
                  {s.name}
                </Text>
                <TextInput
                  style={{
                    width: 72,
                    height: 48,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: T.inputBorder,
                    color: T.primary,
                    fontWeight: '900',
                    fontSize: 20,
                    textAlign: 'center',
                  }}
                  placeholder="0"
                  placeholderTextColor={T.textPlaceholder}
                  value={marksMap[s.id] ?? ''}
                  onChangeText={(t) => setMarksMap((m) => ({ ...m, [s.id]: t }))}
                  keyboardType="numeric"
                />
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: grade.bg, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}>
                  <Text style={{ color: grade.text, fontWeight: '900', fontSize: 12 }}>{grade.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

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
          />
        </View>
      </View>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherClasses" />
    </View>
  );
}
