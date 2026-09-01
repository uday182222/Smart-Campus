/**
 * Admin — Classes. Gradient header, 2-col grid, FAB, add/edit sheet (PD).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Pressable,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Pencil, Trash2, Grid3X3, ChevronLeft, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { LightButton, LightInput } from '../../components/ui';
import { T, fabBottomWithNav, scrollPadWithNav } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { AdminFloatingNav } from '../../components/ui/AdminFloatingNav';

const { width } = Dimensions.get('window');
const PAD = 20;
const GAP = 12;
const CARD_WIDTH = (width - PAD * 2 - GAP) / 2;

interface TeacherAssignment {
  id: string;
  teacherId: string;
  subject: string;
  isClassTeacher: boolean;
  teacher?: { id: string; name: string; email?: string };
}

interface ClassRow {
  id: string;
  name: string;
  section: string;
  schoolId: string;
  roomNumber?: string;
  currentStudents?: number;
  teachers?: TeacherAssignment[];
}

interface ClassStudentRow {
  id: string;
  name: string;
  rollNumber?: string;
  photo?: string | null;
}

function studentCountFromClass(c: ClassRow): number {
  if (typeof c.currentStudents === 'number') return c.currentStudents;
  return 0;
}

function studentInitials(name: string): string {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  );
}

function classTeacherName(c: ClassRow): string | null {
  const ct = c.teachers?.find((t) => t.isClassTeacher);
  return ct?.teacher?.name ?? null;
}

export default function ClassManagementScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const insets = useSafeAreaInsets();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Classes</Text>
          </View>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>Access restricted</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: T.px }}>
          <Text style={{ color: T.textBody, textAlign: 'center' }}>Access restricted to Admin only.</Text>
        </View>
      </View>
    );
  }

  const [list, setList] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', section: 'A', academicYear: '', roomNumber: '' });
  const [saving, setSaving] = useState(false);
  const [teacherSheetOpen, setTeacherSheetOpen] = useState(false);
  const [teacherSheetClass, setTeacherSheetClass] = useState<ClassRow | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<TeacherAssignment[]>([]);
  const [teacherSheetLoading, setTeacherSheetLoading] = useState(false);
  const [assigningTeacherId, setAssigningTeacherId] = useState<string | null>(null);
  const [studentSheetOpen, setStudentSheetOpen] = useState(false);
  const [studentSheetClass, setStudentSheetClass] = useState<ClassRow | null>(null);
  const [studentSheetList, setStudentSheetList] = useState<ClassStudentRow[]>([]);
  const [studentSheetLoading, setStudentSheetLoading] = useState(false);

  const schoolId = (userData as any)?.schoolId ?? '';

  const loadClasses = async () => {
    try {
      const res = await apiClient.get<{ data?: { classes?: ClassRow[] } }>('/classes');
      const classes = (res as any).data?.classes ?? [];
      if (__DEV__ && Array.isArray(classes) && classes.length > 0) {
        console.log('[ClassManagement] sample class from GET /classes:', classes[0]);
      }
      setList(Array.isArray(classes) ? classes : []);
    } catch (_e) {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [schoolId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const openStudentSheet = async (c: ClassRow) => {
    setStudentSheetClass(c);
    setStudentSheetOpen(true);
    setStudentSheetLoading(true);
    setStudentSheetList([]);
    try {
      const res = await apiClient.get(`/classes/${c.id}/students`);
      const payload = (res as any)?.data ?? res;
      const students = Array.isArray(payload) ? payload : payload?.data ?? [];
      setStudentSheetList(Array.isArray(students) ? students : []);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load students.');
      setStudentSheetOpen(false);
    } finally {
      setStudentSheetLoading(false);
    }
  };

  const openClassTeacherSheet = async (c: ClassRow) => {
    setTeacherSheetClass(c);
    setTeacherSheetOpen(true);
    setTeacherSheetLoading(true);
    setTeacherOptions([]);
    try {
      const res = await apiClient.get(`/classes/${c.id}`);
      const data = (res as any)?.data ?? res;
      const payload = data?.data ?? data;
      const teachers = payload?.class?.teachers ?? payload?.teachers ?? c.teachers ?? [];
      setTeacherOptions(Array.isArray(teachers) ? teachers : []);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to load teachers.');
      setTeacherSheetOpen(false);
    } finally {
      setTeacherSheetLoading(false);
    }
  };

  const assignClassTeacher = async (teacherId: string) => {
    if (!teacherSheetClass) return;
    setAssigningTeacherId(teacherId);
    try {
      await apiClient.patch(`/classes/${teacherSheetClass.id}/class-teacher`, { teacherId });
      setTeacherSheetOpen(false);
      setTeacherSheetClass(null);
      await loadClasses();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? err?.message ?? 'Failed to assign class teacher.');
    } finally {
      setAssigningTeacherId(null);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', section: 'A', academicYear: new Date().getFullYear().toString(), roomNumber: '' });
    setModalVisible(true);
  };

  const openEdit = (c: ClassRow) => {
    setEditingId(c.id);
    setForm({ name: c.name, section: c.section || 'A', academicYear: '', roomNumber: (c as any).roomNumber || '' });
    setModalVisible(true);
  };

  const saveClass = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Class name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/classes/${editingId}`, { name: form.name, section: form.section, roomNumber: form.roomNumber || undefined });
        Alert.alert('Success', 'Class updated.');
      } else {
        await apiClient.post('/classes', { name: form.name, schoolId, section: form.section, roomNumber: form.roomNumber || undefined });
        Alert.alert('Success', 'Class created.');
      }
      setModalVisible(false);
      loadClasses();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = (c: ClassRow) => {
    Alert.alert('Delete Class', `Delete ${c.name} ${c.section}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/classes/${c.id}`);
            loadClasses();
          } catch (_e) {
            Alert.alert('Error', 'Failed to delete class.');
          }
        },
      },
    ]);
  };

  const yearLabel = new Date().getFullYear();
  const currentClassTeacherId = teacherOptions.find((t) => t.isClassTeacher)?.teacherId;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
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
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Classes</Text>
        </View>
        <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>
          {list.length} {list.length === 1 ? 'class' : 'classes'} · {yearLabel}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.textMuted }}>Loading...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
            <Grid3X3 size={34} color={T.primary} strokeWidth={1.8} />
          </View>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginTop: 16 }}>No classes yet</Text>
          <LightButton label="Add first class" variant="primary" onPress={openAdd} style={{ marginTop: 16 }} fullWidth={false} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: T.px, justifyContent: 'space-between', marginBottom: GAP }}
          contentContainerStyle={{ paddingBottom: scrollPadWithNav(insets.bottom), paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
          renderItem={({ item }) => {
            const ctName = classTeacherName(item);
            return (
              <View style={{ width: CARD_WIDTH, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginBottom: 4, ...T.shadowSm }}>
                <View style={{ position: 'absolute', top: 12, right: 12, flexDirection: 'row', zIndex: 1 }}>
                  <Pressable onPress={() => openEdit(item)} style={{ marginRight: 8 }}>
                    <Pencil size={18} color={T.primary} strokeWidth={1.8} />
                  </Pressable>
                  <Pressable onPress={() => deleteClass(item)}>
                    <Trash2 size={18} color={T.danger} strokeWidth={1.8} />
                  </Pressable>
                </View>
                <Text style={{ color: T.primary, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>{item.name}</Text>
                <View
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: T.primaryLight,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: T.primary, fontSize: 11, fontWeight: '800' }}>Sec {item.section}</Text>
                </View>
                {item.roomNumber ? (
                  <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>Room {item.roomNumber}</Text>
                ) : null}
                <TouchableOpacity onPress={() => openStudentSheet(item)} activeOpacity={0.85} style={{ marginTop: 4 }}>
                  <Text style={{ color: T.textMuted, fontSize: 12 }}>
                    {studentCountFromClass(item)} students
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openClassTeacherSheet(item)} activeOpacity={0.85} style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: T.textMuted }}>Class teacher</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      marginTop: 2,
                      color: ctName ? T.textDark : T.warning,
                    }}
                    numberOfLines={1}
                  >
                    {ctName ?? 'No class teacher'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity
        onPress={openAdd}
        style={{
          position: 'absolute',
          bottom: fabBottomWithNav(insets.bottom),
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          elevation: 10,
          shadowColor: T.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Plus size={22} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable
            style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}
            onPress={() => {}}
          >
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 22, marginBottom: 16 }}>{editingId ? 'Edit Class' : 'New Class'}</Text>
            <LightInput label="Class name" placeholder="e.g. Grade 5" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} />
            <LightInput label="Section" placeholder="A" value={form.section} onChangeText={(t) => setForm((f) => ({ ...f, section: t }))} />
            <LightInput label="Room (optional)" placeholder="Room 101" value={form.roomNumber} onChangeText={(t) => setForm((f) => ({ ...f, roomNumber: t }))} />
            <LightInput
              label={`Academic year (optional)`}
              placeholder={String(yearLabel)}
              value={form.academicYear}
              onChangeText={(t) => setForm((f) => ({ ...f, academicYear: t }))}
              keyboardType="number-pad"
            />
            <LightButton label={editingId ? 'Save class' : 'Create class'} variant="primary" onPress={saveClass} loading={saving} />
            <LightButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={teacherSheetOpen} transparent animationType="slide" onRequestClose={() => setTeacherSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setTeacherSheetOpen(false)}>
          <Pressable style={{ backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }} onPress={(e) => e.stopPropagation()}>
            <View style={{ width: 40, height: 4, backgroundColor: T.inputBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginBottom: 4 }}>Class teacher</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>
              {teacherSheetClass ? `${teacherSheetClass.name} ${teacherSheetClass.section}` : ''}
            </Text>

            {teacherSheetLoading ? (
              <ActivityIndicator color={T.primary} style={{ marginVertical: 24 }} />
            ) : teacherOptions.length === 0 ? (
              <Text style={{ color: T.textMuted, textAlign: 'center', marginVertical: 24 }}>No teachers assigned to this class.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {teacherOptions.map((t) => {
                  const isCurrent = t.teacherId === currentClassTeacherId || t.isClassTeacher;
                  const busy = assigningTeacherId === t.teacherId;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => assignClassTeacher(t.teacherId)}
                      disabled={!!assigningTeacherId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: T.inputBorder,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15 }}>{t.teacher?.name ?? 'Teacher'}</Text>
                        <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{t.subject}</Text>
                      </View>
                      {busy ? (
                        <ActivityIndicator color={T.primary} size="small" />
                      ) : isCurrent ? (
                        <Check size={20} color={T.primary} strokeWidth={2} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setTeacherSheetOpen(false)}
              style={{
                marginTop: 16,
                backgroundColor: T.primaryLight,
                borderRadius: T.radius.full,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={studentSheetOpen} transparent animationType="slide" onRequestClose={() => setStudentSheetOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setStudentSheetOpen(false)}>
          <Pressable style={{ backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }} onPress={(e) => e.stopPropagation()}>
            <View style={{ width: 40, height: 4, backgroundColor: T.inputBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginBottom: 4 }}>Students</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>
              {studentSheetClass ? `${studentSheetClass.name} ${studentSheetClass.section}` : ''}
            </Text>

            {studentSheetLoading ? (
              <ActivityIndicator color={T.primary} style={{ marginVertical: 24 }} />
            ) : studentSheetList.length === 0 ? (
              <Text style={{ color: T.textMuted, textAlign: 'center', marginVertical: 24 }}>No students in this class yet.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {studentSheetList.map((s) => (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: T.inputBorder,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: T.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 12 }}>{studentInitials(s.name)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 15 }}>{s.name}</Text>
                      <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>
                        Roll {s.rollNumber?.trim() ? s.rollNumber : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setStudentSheetOpen(false)}
              style={{
                marginTop: 16,
                backgroundColor: T.primaryLight,
                borderRadius: T.radius.full,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <AdminFloatingNav navigation={navigation} activeTab="SchoolProfile" />
    </View>
  );
}
