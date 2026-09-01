/**
 * Admin — User management (parent-style stack header, T tokens, Lucide).
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
import { Search, UserPlus, Pencil, User, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { LightButton, LightInput } from '../../components/ui';
import { T, fabBottomWithNav, scrollPadWithNav } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { AdminFloatingNav } from '../../components/ui/AdminFloatingNav';

const ROLE_FILTERS = ['ADMIN', 'TEACHER', 'PARENT', 'BUS_HELPER'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  BUS_HELPER: 'Bus Helper',
};

interface ParentChild {
  id: string;
  name: string;
  className: string;
  section: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
  phone?: string;
  status?: string;
  children?: ParentChild[];
}

type ParentListEntry = UserRow & { displayChildren: ParentChild[] };

interface ParentSection {
  key: string;
  title: string;
  parents: ParentListEntry[];
}

function buildParentSections(parents: UserRow[]): ParentSection[] {
  const sectionMap = new Map<string, ParentSection>();

  const ensure = (key: string, title: string) => {
    if (!sectionMap.has(key)) sectionMap.set(key, { key, title, parents: [] });
    return sectionMap.get(key)!;
  };

  for (const p of parents) {
    const children = p.children ?? [];
    if (children.length === 0) {
      ensure('unassigned', 'Unassigned').parents.push({ ...p, displayChildren: [] });
      continue;
    }

    const byClass = new Map<string, ParentChild[]>();
    for (const c of children) {
      const key = c.className?.trim() ? `${c.className}|${c.section || ''}` : 'unassigned';
      if (!byClass.has(key)) byClass.set(key, []);
      byClass.get(key)!.push(c);
    }

    for (const [key, kids] of byClass) {
      if (key === 'unassigned') {
        ensure('unassigned', 'Unassigned').parents.push({ ...p, displayChildren: kids });
      } else {
        const title = `${kids[0].className}${kids[0].section ? ` · ${kids[0].section}` : ''}`;
        ensure(key, title).parents.push({ ...p, displayChildren: kids });
      }
    }
  }

  const sections = Array.from(sectionMap.values());
  sections.sort((a, b) => {
    if (a.key === 'unassigned') return 1;
    if (b.key === 'unassigned') return -1;
    return a.title.localeCompare(b.title);
  });
  return sections;
}

function renderUserCard(
  item: UserRow,
  displayChildren: ParentChild[] | undefined,
  onPress: () => void,
) {
  const children = displayChildren ?? item.children;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: T.card,
        borderRadius: T.radius.xxl,
        padding: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        ...T.shadowSm,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: T.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User size={20} color={T.primary} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 16 }}>{item.name}</Text>
        <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{item.email}</Text>
        {children && children.length > 0 ? (
          <View style={{ marginTop: 8, gap: 4 }}>
            {children.map((c) => (
              <Text key={c.id} style={{ color: T.textBody, fontSize: 12 }}>
                {c.name}
                {c.className ? ` · ${c.className}${c.section ? ` ${c.section}` : ''}` : ''}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          <View
            style={{
              backgroundColor: T.primaryLight,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: T.primary, fontSize: 11, fontWeight: '700' }}>{item.role}</Text>
          </View>
          {item.status === 'INACTIVE' ? (
            <View
              style={{
                backgroundColor: T.dangerTint,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: T.danger, fontSize: 11, fontWeight: '700' }}>Inactive</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pencil size={18} color={T.textMuted} strokeWidth={1.8} />
    </Pressable>
  );
}

export default function UserManagementScreen() {
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>User Management</Text>
          </View>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>Access restricted</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: T.px }}>
          <Text style={{ color: T.textBody, textAlign: 'center' }}>Access restricted to Admin only.</Text>
        </View>
      </View>
    );
  }
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ADMIN');
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
  const [deactivating, setDeactivating] = useState(false);

  const schoolId = (userData as any)?.schoolId ?? '';
  const currentUserId = userData?.id ?? '';

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
    } catch (_e) {
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
      phone: u.phone || '',
    });
    setModalVisible(true);
  };

  const confirmDeactivate = () => {
    if (!editingId) return;
    const target = list.find((u) => u.id === editingId);
    const displayName = target?.name || form.name || 'this user';
    Alert.alert(
      `Deactivate ${displayName}?`,
      'They will no longer be able to log in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => deactivateUser(editingId),
        },
      ],
    );
  };

  const deactivateUser = async (userId: string) => {
    setDeactivating(true);
    try {
      await apiClient.delete(`/admin/user/${userId}`);
      setModalVisible(false);
      setEditingId(null);
      await loadUsers();
      Alert.alert('Done', 'User deactivated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to deactivate user.');
    } finally {
      setDeactivating(false);
    }
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

  const listCount = filtered.length;
  const parentSections = roleFilter === 'PARENT' ? buildParentSections(filtered) : [];
  const showParentGroups = roleFilter === 'PARENT';

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
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>User Management</Text>
        </View>
        <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>
          {listCount} {listCount === 1 ? 'account' : 'accounts'} shown
        </Text>

        <View
          style={{
            marginTop: 14,
            backgroundColor: T.card,
            borderRadius: T.radius.full,
            paddingHorizontal: 16,
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
            style={{ flex: 1, color: T.textDark, marginLeft: 10, fontSize: 15, fontWeight: '500' }}
            placeholder="Search users…"
            placeholderTextColor={T.textPlaceholder}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadUsers()}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 12, paddingRight: 8, gap: 8 }}>
          {ROLE_FILTERS.map((r) => {
            const active = roleFilter === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRoleFilter(r)}
                activeOpacity={0.85}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: active ? T.primary : T.card,
                  borderWidth: 1.5,
                  borderColor: active ? T.primary : T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(active ? T.shadowSm : {}),
                }}
              >
                <Text style={{ color: active ? T.textWhite : T.textDark, fontWeight: '800', fontSize: 13 }}>{ROLE_LABELS[r]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 14 }}>Loading…</Text>
        </View>
      ) : showParentGroups ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: scrollPadWithNav(insets.bottom), paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
        >
          {parentSections.length === 0 ? (
            <Text style={{ color: T.textMuted, textAlign: 'center', marginTop: 24 }}>No parents found</Text>
          ) : (
            parentSections.map((section) => (
              <View key={section.key} style={{ marginBottom: 8 }}>
                <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16, marginBottom: 4 }}>
                  {section.title}
                </Text>
                <Text style={{ color: T.textMuted, fontSize: 12, marginBottom: 12 }}>
                  {section.parents.length} {section.parents.length === 1 ? 'parent' : 'parents'}
                </Text>
                {section.parents.map((item) => (
                  <View key={`${section.key}-${item.id}`}>
                    {renderUserCard(item, item.displayChildren, () => openEdit(item))}
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: scrollPadWithNav(insets.bottom), paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
          renderItem={({ item }) => renderUserCard(item, undefined, () => openEdit(item))}
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
        <UserPlus size={22} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable
            style={{ backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' }}
            onPress={() => {}}
          >
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 22, marginBottom: 20 }}>{editingId ? 'Edit user' : 'New user'}</Text>
            <LightInput label="Name" placeholder="Full name" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} />
            <LightInput label="Email" placeholder="Email" value={form.email} onChangeText={(t) => setForm((f) => ({ ...f, email: t }))} editable={!editingId} />
            {!editingId && (
              <>
                <LightInput label="Password" placeholder="Optional" value={form.password} onChangeText={(t) => setForm((f) => ({ ...f, password: t }))} isPassword />
                <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '800', marginBottom: 8 }}>Role</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {(['ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'BUS_HELPER', 'OFFICE_STAFF'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setForm((f) => ({ ...f, role: r }))}
                      style={{
                        height: 36,
                        paddingHorizontal: 14,
                        borderRadius: 18,
                        backgroundColor: form.role === r ? T.primary : T.card,
                        borderWidth: 1.5,
                        borderColor: form.role === r ? T.primary : T.inputBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: form.role === r ? T.textWhite : T.textDark, fontWeight: '800', fontSize: 12 }}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <LightInput label="Phone" placeholder="Optional" value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))} keyboardType="phone-pad" />
            <LightButton label={editingId ? 'Save changes' : 'Create user'} variant="primary" onPress={saveUser} loading={saving} style={{ marginTop: 16 }} />
            {editingId && editingId !== currentUserId ? (
              <TouchableOpacity
                onPress={confirmDeactivate}
                disabled={deactivating}
                style={{
                  marginTop: 12,
                  borderWidth: 1.5,
                  borderColor: T.danger,
                  backgroundColor: 'transparent',
                  borderRadius: T.radius.full,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: deactivating ? 0.6 : 1,
                }}
              >
                <Text style={{ color: T.danger, fontWeight: '800', fontSize: 15 }}>
                  {deactivating ? 'Deactivating…' : 'Deactivate User'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <LightButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ marginTop: 8 }} />
          </Pressable>
        </Pressable>
      </Modal>

      <AdminFloatingNav navigation={navigation} activeTab="UserManagement" />
    </View>
  );
}
