/**
 * Teacher — My Students: gradient header, class chips, search, detail sheet, message parent.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton } from '../../components/ui';
import { T } from '../../constants/theme';
import { TD, cardShadow, darkenHex } from '../../constants/teacherDesign';
import { ClassService } from '../../services/ClassService';

interface Student {
  id: string;
  name: string;
  email?: string;
  rollNumber?: string;
  parentId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
}

function getInitials(name: string) {
  return name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
}

const { height: SCREEN_H } = Dimensions.get('window');

export default function MyStudentsScreen() {
  const navigation = useNavigation<any>();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const loadClasses = useCallback(async () => {
    const res = await ClassService.getTeacherClasses();
    if (res.success && res.data?.length) {
      const list = (res.data as any[]).map((c: any) => {
        const name = String(c.name ?? '').trim();
        const section = String(c.section ?? '').trim();
        const normalized = section ? section.toUpperCase() : '';
        const alreadyHasSection =
          !!normalized &&
          (name.toUpperCase().endsWith(`-${normalized}`) ||
            name.toUpperCase().endsWith(` ${normalized}`) ||
            name.toUpperCase().includes(`-${normalized}`));
        const displayName = !section ? name : alreadyHasSection ? name : `${name} - ${section}`;
        return { id: c.id, name: displayName.trim() };
      });
      setClasses(list);
      if (list.length > 0 && !selectedClassId) setSelectedClassId(list[0].id);
    }
  }, [selectedClassId]);

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await ClassService.getTeacherClassStudents(selectedClassId);
      if (res.success && res.data) {
        setStudents((res.data as any[]).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber ?? s.roll,
          parentId: s.parentId ?? null,
          parentName: s.parentName ?? null,
          parentPhone: s.parentPhone ?? null,
          parentEmail: s.parentEmail ?? null,
        })));
      } else setStudents([]);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const filtered = students.filter(
    (s) => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name ?? 'Class';

  const primaryLight = `${primary}26`;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 4 }}>
            {canGoBack ? (
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26, paddingHorizontal: 20 }}>My Students</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4, paddingTop: 16 }}
          >
            {classes.map((c) => {
              const isActive = selectedClassId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedClassId(c.id)}
                  style={{
                    height: 36,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'transparent',
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: 'rgba(255,255,255,0.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
            <TextInput
              style={{ flex: 1, color: '#FFFFFF', fontSize: 15, marginLeft: 10 }}
              placeholder="Search students..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View style={{ height: 16, backgroundColor: T.bg }} />

      <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginHorizontal: 20, marginTop: 16, marginBottom: 12 }}>
        {filtered.length} Students
      </Text>

      {loading ? (
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ backgroundColor: TD.card, borderRadius: 16, height: 88, marginBottom: 8 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={48} color={TD.textMuted} />
              <Text style={{ color: TD.textDark, fontWeight: '800', marginTop: 16 }}>No students in this class</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedStudent(item)}
              style={[{ backgroundColor: TD.card, borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }, cardShadow]}
            >
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 18 }}>{getInitials(item.name)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 16 }}>{item.name}</Text>
                <View style={{ alignSelf: 'flex-start', backgroundColor: primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 6 }}>
                  <Text style={{ color: primary, fontSize: 11, fontWeight: '800' }}>{selectedClassName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Ionicons name="person-outline" size={12} color={TD.textMuted} />
                  <Text style={{ color: TD.textMuted, fontSize: 12, marginLeft: 4 }} numberOfLines={1}>
                    {item.parentName ?? '—'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={primary} />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedStudent} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setSelectedStudent(null)}>
          <Pressable
            style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: SCREEN_H * 0.88 }}
            // intentional — blocks tap-through
            onPress={() => {}}
          >
            <View style={{ width: 40, height: 4, backgroundColor: TD.cardBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            {selectedStudent && (
              <>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 24 }}>{getInitials(selectedStudent.name)}</Text>
                  </View>
                  <Text style={{ color: TD.textDark, fontWeight: '900', fontSize: 22, marginTop: 12, textAlign: 'center' }}>{selectedStudent.name}</Text>
                  <Text style={{ color: TD.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                    {selectedClassName}
                    {selectedStudent.rollNumber ? ` · Roll ${selectedStudent.rollNumber}` : ''}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                  {[
                    { n: '—', l: 'Attendance%' },
                    { n: '—', l: 'HW Done' },
                    { n: '—', l: 'Avg Grade' },
                  ].map((s, i) => (
                    <View key={i} style={{ flex: 1, backgroundColor: primaryLight, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: primary, fontWeight: '900', fontSize: 22 }}>{s.n}</Text>
                      <Text style={{ color: TD.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{s.l}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ marginTop: 16, backgroundColor: '#F5F6FA', borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: TD.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 }}>PARENT CONTACT</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="call" size={16} color={primary} />
                    <Text style={{ color: TD.textDark, fontSize: 15, marginLeft: 10 }}>{selectedStudent.parentPhone ?? '—'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <Ionicons name="mail" size={16} color={primary} />
                    <Text style={{ color: TD.textDark, fontSize: 15, marginLeft: 10, flex: 1 }} numberOfLines={2}>
                      {selectedStudent.parentEmail ?? '—'}
                    </Text>
                  </View>
                </View>
                <LightButton
                  label="Message Parent"
                  onPress={() => {
                    const parentId = selectedStudent.parentId ?? '';
                    setSelectedStudent(null);
                    navigation.getParent()?.navigate('TeacherStudents', { screen: 'Messages', params: { toUserId: parentId } });
                  }}
                  variant="primary"
                  icon="chatbubble-outline"
                  iconPosition="left"
                  style={{ marginTop: 16 }}
                />
                <LightButton label="Close" onPress={() => setSelectedStudent(null)} variant="outline" style={{ marginTop: 8 }} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
