/**
 * Teacher Remarks — gradient header, add card, type chips, previous list.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { TD, cardShadow, darkenHex } from '../../constants/teacherDesign';
import { ClassService } from '../../services/ClassService';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

interface RemarkRow {
  id: string;
  content: string;
  remarkType: string;
  createdAt: string;
  student?: { name: string };
  className?: string;
}

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

export default function RemarksScreen() {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const { userData } = useAuth();
  const navigation = useNavigation<any>();
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [remarks, setRemarks] = useState<RemarkRow[]>([]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'positive' | 'neutral' | 'concern'>('neutral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await ClassService.getTeacherClasses();
      const list = (res.data ?? []).map((c: any) => ({ id: c.id, name: `${c.name || ''} ${c.section || ''}`.trim() }));
      setClasses(list);
      if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
    } catch (_e) {
      setClasses([]);
    }
  }, [selectedClassId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await ClassService.getTeacherClassStudents(selectedClassId);
      const list = (res.data ?? []).map((s: any) => ({ id: s.id, name: s.name ?? 'Student' }));
      setStudents(list);
      if (list.length > 0 && !selectedStudentId) setSelectedStudentId(list[0].id);
    } catch (_e) {
      setStudents([]);
    }
  }, [selectedClassId, selectedStudentId]);

  const loadRemarks = useCallback(async () => {
    if (!selectedStudentId) {
      setRemarks([]);
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/remarks/student/${selectedStudentId}`);
      const data = (res as any)?.data ?? res;
      const list = data?.remarks ?? [];
      setRemarks(Array.isArray(list) ? list : []);
    } catch (_e) {
      setRemarks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) loadStudents();
  }, [selectedClassId, loadStudents]);

  useEffect(() => {
    loadRemarks();
  }, [selectedStudentId, loadRemarks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRemarks();
    setRefreshing(false);
  };

  const saveRemark = async () => {
    if (!content.trim() || !selectedStudentId) {
      Alert.alert('Error', 'Select a student and enter remark text.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/remarks', {
        studentId: selectedStudentId,
        teacherId: (userData as any)?.id ?? (userData as any)?.userId,
        content: content.trim(),
        type,
      });
      setContent('');
      loadRemarks();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save remark.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const typeStyle = (t: 'positive' | 'neutral' | 'concern', active: boolean) => {
    if (t === 'positive')
      return {
        bg: active ? '#DCFCE7' : TD.bg,
        border: TD.success,
        text: TD.success,
        icon: 'thumbs-up-outline' as const,
        label: 'Positive',
      };
    if (t === 'concern')
      return {
        bg: active ? '#FEE2E2' : TD.bg,
        border: TD.danger,
        text: TD.danger,
        icon: 'alert-circle-outline' as const,
        label: 'Concern',
      };
    return {
      bg: active ? `${primary}22` : TD.bg,
      border: primary,
      text: primary,
      icon: 'remove-circle-outline' as const,
      label: 'Neutral',
    };
  };

  const classLabel = classes.find((c) => c.id === selectedClassId)?.name ?? '';

  const stripColor = (rt: string) => {
    const x = (rt || '').toLowerCase();
    if (x.includes('positive') || x === 'positive') return TD.success;
    if (x.includes('concern') || x === 'concern') return TD.danger;
    return primary;
  };

  const badgeFor = (rt: string) => {
    const x = (rt || '').toLowerCase();
    if (x.includes('positive') || x === 'positive') return { bg: '#DCFCE7', c: TD.success, label: 'Positive', icon: 'thumbs-up-outline' as const };
    if (x.includes('concern') || x === 'concern') return { bg: '#FEE2E2', c: TD.danger, label: 'Concern', icon: 'alert-circle-outline' as const };
    return { bg: `${primary}22`, c: primary, label: 'Neutral', icon: 'remove-circle-outline' as const };
  };

  return (
    <View style={{ flex: 1, backgroundColor: TD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26 }}>Remarks</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>note student behaviour</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[{ backgroundColor: TD.card, borderRadius: 20, padding: 20 }, cardShadow]}>
          <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>Add Remark</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
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
                    backgroundColor: isActive ? primary : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: isActive ? primary : TD.cardBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#FFFFFF' : TD.textDark }}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => setShowStudentPicker(true)}
            style={{
              marginTop: 12,
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: TD.cardBorder,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="person-outline" size={20} color={primary} style={{ marginRight: 10 }} />
            <Text style={{ color: selectedStudent ? TD.textDark : TD.textMuted, fontSize: 16, flex: 1 }} numberOfLines={1}>
              {selectedStudent?.name ?? 'Select student'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={TD.textMuted} />
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {(['positive', 'neutral', 'concern'] as const).map((t) => {
              const active = type === t;
              const st = typeStyle(t, active);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: st.bg,
                    borderWidth: 2,
                    borderColor: st.border,
                    borderRadius: 999,
                    paddingVertical: 10,
                    paddingHorizontal: 6,
                  }}
                >
                  <Ionicons name={st.icon} size={16} color={st.text} />
                  <Text style={{ color: st.text, fontWeight: '800', fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            <LightInput
              label=""
              placeholder="Write your remark about this student..."
              value={content}
              onChangeText={setContent}
              multiline
              style={{ minHeight: 88 } as any}
            />
          </View>

          <LightButton label="Add Remark" onPress={saveRemark} variant="secondary" icon="checkmark-circle" iconPosition="left" style={{ marginTop: 12 }} loading={saving} />
        </View>

        <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 20, marginTop: 24, marginBottom: 12 }}>Previous Remarks</Text>

        <FlatList
          data={remarks}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          renderItem={({ item }) => {
            const sc = stripColor(item.remarkType);
            const bd = badgeFor(item.remarkType);
            return (
              <View style={[{ backgroundColor: TD.card, borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden' }, cardShadow]}>
                <View style={{ width: 4, backgroundColor: sc, borderRadius: 2 }} />
                <View style={{ flex: 1, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 12 }}>{getInitials(item.student?.name ?? 'S')}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ color: TD.textDark, fontWeight: '800' }}>{item.student?.name ?? 'Student'}</Text>
                      <Text style={{ color: TD.textMuted, fontSize: 11, marginTop: 2 }}>{classLabel}</Text>
                    </View>
                    <View style={{ backgroundColor: bd.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={bd.icon} size={12} color={bd.c} />
                      <Text style={{ color: bd.c, fontSize: 10, fontWeight: '900', marginLeft: 4 }}>{bd.label}</Text>
                    </View>
                  </View>
                  <Text style={{ color: TD.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 8 }}>{item.content}</Text>
                  <Text style={{ color: TD.textMuted, fontSize: 11, marginTop: 6 }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </ScrollView>

      <Modal visible={showStudentPicker} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setShowStudentPicker(false)}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: 400 }}>
            <View style={{ width: 40, height: 4, backgroundColor: TD.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Select Student</Text>
            <ScrollView>
              {students.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setSelectedStudentId(s.id);
                    setShowStudentPicker(false);
                  }}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: TD.cardBorder }}
                >
                  <Text style={{ color: TD.textDark, fontSize: 16 }}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
