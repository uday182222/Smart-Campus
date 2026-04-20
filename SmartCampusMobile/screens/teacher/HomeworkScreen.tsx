/**
 * Teacher Homework — dark + primary: Assigned | Submissions tabs, class chips, homework cards, FAB.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Plus, Calendar as CalendarIcon, Users as UsersIcon, FileText as FileTextIcon, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, Pressable3D } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import { ClassService } from '../../services/ClassService';
import { T } from '../../constants/theme';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

interface ClassItem {
  id: string;
  name: string;
  section?: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status?: string;
  submissionCount?: number;
  totalStudents?: number;
  className?: string;
}

interface SubmissionItem {
  id: string;
  studentId: string;
  studentName?: string;
  homeworkId: string;
  homeworkTitle?: string;
  submittedAt?: string;
  grade?: string;
  status?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export default function HomeworkScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [tab, setTab] = useState<'assigned' | 'submissions'>('assigned');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await ClassService.getTeacherClasses();
      if (res.success && res.data?.length) {
        const list = (res.data as any[]).map((c: any) => ({
          id: c.id,
          name: `${c.name || ''} ${c.section || ''}`.trim() || c.id,
        }));
        setClasses(list);
        if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load teacher classes', e);
      setClasses([]);
    }
  }, [selectedClassId]);

  const loadHomework = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await API.get(`/homework/${selectedClassId}`);
      const data = (res as any)?.data ?? res;
      const list = (data?.homework ?? []).map((h: any) => ({
        id: h.id,
        title: h.title,
        subject: h.subject,
        dueDate: h.dueDate ?? h.due,
        status: h.status,
        submissionCount: h.submissionCount ?? h._count?.submissions ?? 0,
        totalStudents: h.totalStudents ?? 0,
        className: data?.className,
      }));
      setHomework(list);
    } catch (_e) {
      setHomework([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await API.get(`/homework/${selectedClassId}`);
      const data = (res as any)?.data ?? res;
      const hwList = data?.homework ?? [];
      const all: SubmissionItem[] = [];
      for (const hw of hwList.slice(0, 10)) {
        try {
          const subRes = await API.get(`/homework/${hw.id}/submissions`);
          const subData = (subRes as any)?.data ?? subRes;
          const list = (subData?.submissions ?? subData ?? []).map((s: any) => ({
            id: s.id,
            studentId: s.studentId,
            studentName: s.student?.name ?? s.studentName,
            homeworkId: hw.id,
            homeworkTitle: hw.title,
            submittedAt: s.submittedAt ?? s.createdAt,
            grade: s.grade,
            status: s.status,
          }));
          all.push(...list);
        } catch (_) {}
      }
      setSubmissions(all);
    } catch (_e) {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      if (tab === 'assigned') loadHomework();
      else loadSubmissions();
    }
  }, [selectedClassId, tab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (tab === 'assigned') loadHomework().then(() => setRefreshing(false));
    else loadSubmissions().then(() => setRefreshing(false));
  };

  const getStatusStyle = (due: string) => {
    const d = new Date(due);
    const now = new Date();
    if (d < now) return { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626', label: 'Overdue' };
    if ((d.getTime() - now.getTime()) / 86400000 < 2) return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706', label: 'Due Soon' };
    return { bg: '#DCFCE7', border: '#22C55E', text: '#15803D', label: 'Active' };
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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Homework</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: T.card, borderRadius: T.radius.full, padding: 4, marginTop: 14, borderWidth: 1.5, borderColor: T.inputBorder, ...T.shadowSm }}>
          <TouchableOpacity
            onPress={() => setTab('assigned')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: T.radius.full,
              backgroundColor: tab === 'assigned' ? T.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: tab === 'assigned' ? T.textWhite : T.textMuted, fontWeight: '900', fontSize: 13 }}>Assigned</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('submissions')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: T.radius.full,
              backgroundColor: tab === 'submissions' ? T.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: tab === 'submissions' ? T.textWhite : T.textMuted, fontWeight: '900', fontSize: 13 }}>Submissions</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 8, paddingHorizontal: T.px }}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
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
                ...T.shadowSm,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFFFFF' : T.textDark }}>{c.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 8, paddingBottom: 120 }}>
        {loading ? (
          <View style={{ gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: 20, height: 140, marginBottom: 12 }} />
            ))}
          </View>
        ) : tab === 'assigned' ? (
          <FlatList
            style={{ flex: 1 }}
            data={homework}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={28} color={T.primary} strokeWidth={1.8} />
                </View>
                <Text style={{ color: T.textDark, fontWeight: '700', marginTop: 16, fontSize: 16 }}>No homework assigned</Text>
                <LightButton label="Create First" onPress={() => navigation.navigate('HomeworkCreate')} variant="primary" style={{ marginTop: 16 }} />
              </View>
            }
            renderItem={({ item }) => {
              const sub = item.submissionCount ?? 0;
              const total = item.totalStudents ?? 1;
              const pct = total > 0 ? Math.round((sub / total) * 100) : 0;
              const statusStyle = getStatusStyle(item.dueDate);
              return (
                <Pressable3D onPress={() => navigation.navigate('HomeworkCreate', { homeworkId: item.id })}>
                  <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ backgroundColor: primary + '26', borderWidth: 1, borderColor: primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: primary, fontSize: 12, fontWeight: '700' }}>{item.subject}</Text>
                      </View>
                      <View style={{ backgroundColor: statusStyle.bg, borderWidth: 1, borderColor: statusStyle.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: '700' }}>{statusStyle.label}</Text>
                      </View>
                    </View>
                    <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginTop: 8, letterSpacing: -0.3 }}>{item.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CalendarIcon size={14} color={T.textPlaceholder} strokeWidth={1.8} />
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginLeft: 6 }}>
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <UsersIcon size={14} color={T.textPlaceholder} strokeWidth={1.8} />
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginLeft: 6 }}>{sub}/{total} submitted</Text>
                      </View>
                    </View>
                    <View style={{ height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                      <View style={{ height: 3, backgroundColor: primary, borderRadius: 2, width: `${pct}%` }} />
                    </View>
                  </View>
                </Pressable3D>
              );
            }}
          />
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={submissions}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <FileTextIcon size={28} color={T.textPlaceholder} strokeWidth={1.8} />
                </View>
                <Text style={{ color: T.textDark, fontWeight: '700', marginTop: 16 }}>No submissions yet</Text>
                <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 8 }}>Submissions will appear here</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{getInitials(item.studentName ?? 'S')}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15 }}>{item.studentName ?? 'Student'}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>{item.homeworkTitle}</Text>
                  </View>
                  {item.grade ? (
                    <View style={{ backgroundColor: primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>{item.grade}</Text>
                    </View>
                  ) : (
                    <LightButton
                      label="Grade"
                      onPress={() => navigation.navigate('HomeworkCreate', { homeworkId: item.homeworkId, mode: 'grade' })}
                      variant="outline"
                      fullWidth={false}
                      style={{ paddingHorizontal: 12 }}
                    />
                  )}
                </View>
                <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
                  submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '—'}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('HomeworkCreate')}
        style={{
          position: 'absolute',
          bottom: 110,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...T.shadowLg,
        }}
        activeOpacity={0.85}
      >
        <Plus size={24} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>
      <TeacherFloatingNav navigation={navigation} activeTab="TeacherHomework" />
    </View>
  );
}
