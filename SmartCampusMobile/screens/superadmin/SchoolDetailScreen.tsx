/**
 * Super Admin — School Detail: light theme (T tokens), admin credentials, danger zone.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Copy, RefreshCw, UserX, Trash2, Check, X, Users } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { SuperAdminFloatingNav } from '../../components/ui/SuperAdminFloatingNav';

interface SchoolDetailData {
  school: {
    id: string;
    name: string;
    schoolCode: string | null;
    address: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
    isActive: boolean;
    registrationOpen: boolean;
    createdAt: string;
  };
  counts: { students: number; teachers: number; classes: number; pendingRequests: number };
  admin: { email: string; name: string } | null;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export default function SchoolDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const schoolId = route.params?.schoolId;
  const [data, setData] = useState<SchoolDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<{ email: string; newPassword: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<UserRow[]>([]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [detailRes, usersRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: SchoolDetailData }>(`/superadmin/schools/${schoolId}`),
        apiClient.get<{ success: boolean; data: { users: UserRow[] } }>(`/superadmin/schools/${schoolId}/users`).catch(() => ({ data: { users: [] } })),
      ]);
      setData((detailRes as any)?.data ?? null);
      const users = (usersRes as any)?.data?.users ?? [];
      setPreviewUsers(users.slice(0, 3));
    } catch (_e) {
      setData(null);
      setPreviewUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleStatus = async (isActive: boolean) => {
    if (!schoolId) return;
    try {
      await apiClient.patch(`/superadmin/schools/${schoolId}/status`, { isActive });
      setData((prev) => (prev ? { ...prev, school: { ...prev.school, isActive } } : null));
    } catch (_e) {}
  };

  const handleResetPassword = async () => {
    if (!schoolId) return;
    try {
      const res = await apiClient.post<{ success: boolean; data: { email: string; newPassword: string } }>(`/superadmin/schools/${schoolId}/reset-admin-password`);
      const d = (res as any)?.data;
      if (d) setResetPasswordModal({ email: d.email, newPassword: d.newPassword });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeleteAdmin = () => {
    Alert.alert('Delete Admin', 'Remove admin credentials for this school? They will no longer be able to log in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!schoolId) return;
          try {
            await apiClient.delete(`/superadmin/schools/${schoolId}/admin`);
            setData((prev) => (prev ? { ...prev, admin: null } : null));
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed');
          }
        },
      },
    ]);
  };

  const handleDeleteSchool = () => {
    if (!data?.school.name) return;
    setDeleteConfirmName('');
    setDeleteModalVisible(true);
  };

  const confirmDeleteSchool = async () => {
    if (deleteConfirmName?.trim() !== data?.school.name) {
      Alert.alert('Error', 'School name did not match.');
      return;
    }
    try {
      await apiClient.delete(`/superadmin/schools/${schoolId}`);
      setDeleteModalVisible(false);
      navigation.navigate('SchoolManagement');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to delete');
    }
  };

  if (!schoolId || (loading && !data)) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: T.textDark }}>School</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const school = data?.school;
  const counts = data?.counts;
  const admin = data?.admin;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: T.px, backgroundColor: T.bg }}>
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
        <Text style={{ fontSize: 22, fontWeight: '900', color: T.textDark, letterSpacing: -0.4, marginTop: 12 }} numberOfLines={2}>
          {school?.name}
        </Text>
        <Text style={{ fontSize: 13, color: T.textMuted, fontVariant: ['tabular-nums'], marginTop: 6 }} numberOfLines={1}>
          {school?.schoolCode ?? '—'}
        </Text>

        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              backgroundColor: school?.isActive ? T.successTint : T.dangerTint,
              borderRadius: 14,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1.5,
              borderColor: T.inputBorder,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: school?.isActive ? T.success : T.danger }}>
              {school?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        {counts && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: T.px, gap: 12 }}>
            {[
              { value: counts.students, label: 'Students' },
              { value: counts.teachers, label: 'Teachers' },
              { value: counts.classes, label: 'Classes' },
              { value: counts.pendingRequests, label: 'Pending' },
            ].map((s) => (
              <View key={s.label} style={{ width: 140, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
                <Text style={{ color: T.primary, fontSize: 26, fontWeight: '900' }}>{s.value}</Text>
                <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 6, fontWeight: '800' }}>{s.label}</Text>
                <Text style={{ color: T.textPlaceholder, fontSize: 10, marginTop: 2 }}>this school</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8, marginTop: 24, marginBottom: 8 }}>
          ADMIN CREDENTIALS
        </Text>
        <View style={{ backgroundColor: T.primaryLight, borderRadius: T.radius.xxl, padding: 16, borderWidth: 1.5, borderColor: T.primary, ...T.shadowSm }}>
          {admin ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>EMAIL</Text>
                  <Text style={{ color: T.textDark, fontSize: 15, fontWeight: '700', marginTop: 6 }}>{admin.email}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const credentials = admin.email;
                    Alert.alert('Credentials', credentials);
                  }}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
                >
                  <Copy size={18} color={T.primary} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleResetPassword}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: T.radius.full,
                    backgroundColor: T.card,
                    borderWidth: 1.5,
                    borderColor: T.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...T.shadowSm,
                  }}
                >
                  <RefreshCw size={18} color={T.primary} strokeWidth={1.8} />
                  <Text style={{ color: T.primary, fontWeight: '800' }}>Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDeleteAdmin}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: T.radius.full,
                    backgroundColor: T.card,
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    ...T.shadowSm,
                  }}
                >
                  <UserX size={18} color={T.danger} strokeWidth={1.8} />
                  <Text style={{ color: T.danger, fontWeight: '800' }}>Remove Admin</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={{ color: T.textMuted, fontSize: 14 }}>No admin user for this school.</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: T.textDark }}>Users</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SchoolUsers', { schoolId })}>
            <Text style={{ color: T.primary, fontWeight: '800', fontSize: 13 }}>View All →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 12, ...T.shadowSm }}>
          {previewUsers.length > 0 ? (
            previewUsers.map((u) => (
              <View key={u.id} style={{ backgroundColor: T.bg, borderRadius: T.radius.xxl, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1.5, borderColor: T.inputBorder }}>
                  <Text style={{ color: T.primary, fontWeight: '900', fontSize: 14 }}>{(u.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: T.textDark, fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
                    {u.name || '—'}
                  </Text>
                  <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {u.email || '—'}
                  </Text>
                </View>
                <View style={{ borderWidth: 1.5, borderColor: T.inputBorder, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color={T.primary} strokeWidth={1.8} />
                  <Text style={{ color: T.primary, fontSize: 11, fontWeight: '800' }}>{u.role}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: T.textMuted, fontSize: 14 }}>No users yet</Text>
          )}
        </View>

        <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '700', letterSpacing: 0.8, marginTop: 24, marginBottom: 8 }}>
          DANGER ZONE
        </Text>
        <View style={{ marginBottom: 40, backgroundColor: T.dangerTint, borderRadius: T.radius.xxl, padding: 16, borderWidth: 1.5, borderColor: T.danger, ...T.shadowSm }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: T.danger }}>Danger Zone</Text>
          <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Irreversible actions</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <Text style={{ color: T.textDark, fontWeight: '700' }}>School active</Text>
            <Switch value={school?.isActive ?? false} onValueChange={toggleStatus} trackColor={{ false: T.inputBorder, true: T.primary }} thumbColor="#FFFFFF" />
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDeleteSchool}
            style={{
              marginTop: 12,
              height: 48,
              borderRadius: T.radius.full,
              backgroundColor: T.danger,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              ...T.shadowSm,
            }}
          >
            <Trash2 size={18} color={T.textWhite} strokeWidth={1.8} />
            <Text style={{ color: T.textWhite, fontWeight: '900' }}>Delete School</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={!!resetPasswordModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, ...T.shadowLg }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: T.textDark, textAlign: 'center' }}>New Password</Text>
            <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 8, textAlign: 'center' }}>Save this — shown only once</Text>
            <View style={{ backgroundColor: T.bg, borderRadius: T.radius.lg, padding: 12, marginTop: 16, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ fontVariant: ['tabular-nums'], color: T.textDark, fontSize: 16, fontWeight: '800' }}>{resetPasswordModal?.newPassword}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setResetPasswordModal(null)}
              style={{ marginTop: 20, height: 48, borderRadius: T.radius.full, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...T.shadowSm }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>Done</Text>
              <Check size={18} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, ...T.shadowLg }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: T.textDark, textAlign: 'center' }}>Delete School</Text>
            <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 8, textAlign: 'center' }}>Type the school name to confirm: "{data?.school.name}"</Text>
            <TextInput
              style={{ backgroundColor: T.bg, borderRadius: T.radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: T.textDark, marginTop: 16, borderWidth: 1.5, borderColor: T.inputBorder }}
              placeholder="School name"
              placeholderTextColor={T.textPlaceholder}
              value={deleteConfirmName}
              onChangeText={setDeleteConfirmName}
            />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={confirmDeleteSchool}
              style={{ marginTop: 20, height: 48, borderRadius: T.radius.full, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...T.shadowSm }}
            >
              <Trash2 size={18} color={T.textWhite} strokeWidth={1.8} />
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>Delete Permanently</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setDeleteModalVisible(false)}
              style={{ marginTop: 10, height: 48, borderRadius: T.radius.full, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
            >
              <X size={18} color={T.textDark} strokeWidth={1.8} />
              <Text style={{ color: T.textDark, fontWeight: '900' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SuperAdminFloatingNav navigation={navigation} activeTab="SchoolManagement" />
    </SafeAreaView>
  );
}
