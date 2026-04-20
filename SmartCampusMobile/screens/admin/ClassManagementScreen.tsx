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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Plus, Pencil, Trash2, Grid3X3 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';

const { width } = Dimensions.get('window');
const PAD = 20;
const GAP = 12;
const CARD_WIDTH = (width - PAD * 2 - GAP) / 2;

interface ClassRow {
  id: string;
  name: string;
  section: string;
  schoolId: string;
  roomNumber?: string;
  studentCount?: number;
}

export default function ClassManagementScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const primaryTint = T.primaryLight;
  const insets = useSafeAreaInsets();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Access restricted to Admin only.</Text>
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

  const schoolId = (userData as any)?.schoolId ?? '';

  const loadClasses = async () => {
    try {
      const res = await apiClient.get<{ data?: { classes?: ClassRow[] } }>('/classes');
      const classes = (res as any).data?.classes ?? [];
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

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Classes</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('Notifications');
                } catch (_e) {}
              }}
            >
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('AdminProfile');
                } catch (_e) {}
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>
                {((userData as any)?.name ?? 'A').toString().charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 10 }}>{list.length} classes this year</Text>
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
          contentContainerStyle={{ paddingBottom: 140, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          renderItem={({ item }) => (
            <View style={{ width: CARD_WIDTH, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginBottom: 4, ...T.shadowSm }}>
              <View style={{ position: 'absolute', top: 12, right: 12, flexDirection: 'row', zIndex: 1 }}>
                <Pressable onPress={() => openEdit(item)} style={{ marginRight: 8 }}>
                  <Pencil size={18} color={primary} strokeWidth={1.8} />
                </Pressable>
                <Pressable onPress={() => deleteClass(item)}>
                  <Trash2 size={18} color={T.danger} strokeWidth={1.8} />
                </Pressable>
              </View>
              <Text style={{ color: primary, fontSize: 26, fontWeight: '900', letterSpacing: -1 }}>{item.name}</Text>
              <View style={{ alignSelf: 'flex-start', backgroundColor: primaryTint, borderWidth: 1.5, borderColor: T.inputBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 8 }}>
                <Text style={{ color: primary, fontSize: 11, fontWeight: '900' }}>Sec {item.section}</Text>
              </View>
              {item.roomNumber ? (
                <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>Room {item.roomNumber}</Text>
              ) : null}
              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>
                {(item as any).studentCount ?? 0} students
              </Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        onPress={openAdd}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
          ...T.shadowLg,
        }}
      >
        <Plus size={22} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable
            style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}
            // intentional — blocks tap-through
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
    </View>
  );
}
