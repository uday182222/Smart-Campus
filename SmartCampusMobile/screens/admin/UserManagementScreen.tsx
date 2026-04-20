/**
 * Admin — User management. Gradient header, search, role chips, AD role colors.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Search,
  UserPlus,
  Pencil,
  Users,
  GraduationCap,
  User,
  Bus,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { LightButton, LightInput } from '../../components/ui';
import { AD } from '../../constants/adminDesign';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';

const ROLE_FILTERS = ['', 'ADMIN', 'TEACHER', 'PARENT', 'BUS_HELPER'] as const;
const ROLE_LABELS: Record<string, string> = {
  '': 'All',
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  BUS_HELPER: 'Bus Helper',
};

function roleMeta(role: string) {
  const r = role as keyof typeof AD.roleColors;
  if (AD.roleColors[r]) return AD.roleColors[r];
  return { bg: '#F1F5F9', text: '#6B7280', icon: 'account' as const };
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  phone?: string;
}

export default function UserManagementScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const insets = useSafeAreaInsets();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Access restricted to Admin only.</Text>
      </View>
    );
  }
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'TEACHER' | 'PARENT' | 'STUDENT' | 'OFFICE_STAFF' | 'BUS_HELPER' | 'ADMIN';
    phone: string;
  }>({ name: '', email: '', password: '', role: 'TEACHER', phone: '' });
  const [saving, setSaving] = useState(false);

  const schoolId = (userData as any)?.schoolId ?? '';

  const buildQuery = (params: Record<string, string>) =>
    Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

  const loadUsers = async () => {
    try {
      const queryParams: Record<string, string> = {};
      if (schoolId) queryParams.schoolId = schoolId;
      if (roleFilter) queryParams.role = roleFilter;
      if (search) queryParams.search = search;
      const qs = buildQuery(queryParams);
      const res = await apiClient.get<{ data?: { users?: UserRow[] } }>(`/admin/users${qs ? `?${qs}` : ''}`);
      const users = (res as any).data?.users ?? [];
      setList(Array.isArray(users) ? users : []);
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [schoolId, roleFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'TEACHER', phone: '' });
    setModalVisible(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingId(u.id);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: (u.role as any) || 'TEACHER',
      phone: (u as any).phone || '',
    });
    setModalVisible(true);
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/admin/user/${editingId}`, { name: form.name, phone: form.phone || undefined });
        Alert.alert('Success', 'User updated.');
      } else {
        await apiClient.post('/admin/user', {
          name: form.name,
          email: form.email,
          role: form.role,
          schoolId,
          phone: form.phone || undefined,
        });
        Alert.alert('Success', 'User created.');
      }
      setModalVisible(false);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Request failed.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminName = (userData as any)?.name ?? 'Admin';
  const adminInitials =
    (adminName || 'A')
      .split(' ')
      .map((n: string) => n?.[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'A';

  const roleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield;
      case 'TEACHER':
        return GraduationCap;
      case 'PARENT':
        return User;
      case 'BUS_HELPER':
        return Bus;
      default:
        return Users;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Manage Users</Text>
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
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>{adminInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            marginTop: 12,
            backgroundColor: T.card,
            borderRadius: T.radius.xxl,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            flexDirection: 'row',
            alignItems: 'center',
            ...T.shadowSm,
          }}
        >
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput
            style={{ flex: 1, color: T.textDark, marginLeft: 10, fontSize: 15 }}
            placeholder="Search users..."
            placeholderTextColor={T.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadUsers()}
          />
        </View>

        {/* Role chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 12, paddingRight: 8, gap: 8 }}>
          {ROLE_FILTERS.map((r) => {
            const active = roleFilter === r;
            return (
              <TouchableOpacity
                key={r || 'all'}
                onPress={() => setRoleFilter(r)}
                activeOpacity={0.85}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: active ? primary : T.card,
                  borderWidth: 1.5,
                  borderColor: active ? primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...T.shadowSm,
                }}
              >
                <Text style={{ color: active ? T.textWhite : T.textDark, fontWeight: '900', fontSize: 13 }}>{ROLE_LABELS[r]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.textMuted }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
          renderItem={({ item }) => {
            const meta = roleMeta(item.role);
            const Icon = roleIcon(item.role);
            return (
              <Pressable
                onPress={() => openEdit(item)}
                style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', ...T.shadowSm }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>{item.name}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{item.email}</Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: T.primaryLight,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginTop: 8,
                    }}
                  >
                    <Text style={{ color: T.primary, fontSize: 10, fontWeight: '900' }}>{item.role}</Text>
                  </View>
                </View>
                <Pencil size={18} color={primary} strokeWidth={1.8} />
              </Pressable>
            );
          }}
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
        <UserPlus size={22} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable
            style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' }}
            // intentional — blocks tap-through
            onPress={() => {}}
          >
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 22, marginBottom: 20 }}>{editingId ? 'Edit User' : 'New User'}</Text>
            <LightInput label="Name" placeholder="Full name" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} />
            <LightInput label="Email" placeholder="Email" value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} editable={!editingId} />
            {!editingId && (
              <>
                <LightInput label="Password" placeholder="Optional" value={form.password} onChangeText={(t) => setForm((f) => ({ ...f, password: t }))} isPassword />
                <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '900', marginBottom: 8 }}>Role</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {(['ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'BUS_HELPER', 'OFFICE_STAFF'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setForm((f) => ({ ...f, role: r }))}
                      style={{
                        height: 36,
                        paddingHorizontal: 14,
                        borderRadius: 18,
                        backgroundColor: form.role === r ? primary : T.card,
                        borderWidth: 1.5,
                        borderColor: form.role === r ? primary : T.inputBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: form.role === r ? T.textWhite : T.textDark, fontWeight: '900', fontSize: 12 }}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <LightInput label="Phone" placeholder="Optional" value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} keyboardType="phone-pad" />
            <LightButton label={editingId ? 'Save changes' : 'Create user'} variant="primary" onPress={saveUser} loading={saving} style={{ marginTop: 16 }} />
            <LightButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
