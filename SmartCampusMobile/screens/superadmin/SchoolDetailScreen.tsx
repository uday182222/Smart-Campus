/**
 * Super Admin — School Detail: DT theme, no shadows, admin credentials, danger zone.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { DarkHeader, StatCard3D, DarkButton } from '../../components/ui';
import { DT } from '../../constants/darkTheme';
import apiClient from '../../services/apiClient';

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
  const { accent } = useSuperAdminAccent();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
        <DarkHeader showBack accent={accent} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  const school = data?.school;
  const counts = data?.counts;
  const admin = data?.admin;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <View style={{ backgroundColor: DT.card, paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: DT.px }}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: DT.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={DT.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 30, fontWeight: '900', color: DT.textPrimary, letterSpacing: -0.5, marginTop: 12 }}>{school?.name}</Text>
        <Text style={{ fontSize: 14, color: accent, fontStyle: 'italic', fontVariant: ['tabular-nums'], marginTop: 4 }}>{school?.schoolCode ?? '—'}</Text>
        <View style={{ marginTop: 8 }}>
          <View style={{ backgroundColor: school?.isActive ? accent : DT.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: school?.isActive ? '#1A1A1A' : DT.textSecondary }}>{school?.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: DT.px, paddingBottom: 40, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        {counts && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            <View style={{ minWidth: 130, marginRight: 12 }}>
              <StatCard3D value={counts.students} label="Students" accent={accent} delay={0} />
            </View>
            <View style={{ minWidth: 130, marginRight: 12 }}>
              <StatCard3D value={counts.teachers} label="Teachers" accent={accent} delay={100} />
            </View>
            <View style={{ minWidth: 130, marginRight: 12 }}>
              <StatCard3D value={counts.classes} label="Classes" accent={accent} delay={200} />
            </View>
            <View style={{ minWidth: 130 }}>
              <StatCard3D value={counts.pendingRequests} label="Pending" accent={accent} delay={300} />
            </View>
          </ScrollView>
        )}

        <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginTop: 24, marginBottom: 8 }}>admin credentials</Text>
        <View style={{ backgroundColor: DT.card, borderRadius: DT.radius.lg, padding: 20 }}>
          {admin ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DT.border }}>
                <Text style={{ color: DT.textPrimary, flex: 1 }}>{admin.email}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const credentials = admin.email;
                    Alert.alert('Credentials', credentials);
                  }}
                >
                  <Ionicons name="copy-outline" size={20} color={accent} />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12 }}>
                <DarkButton label="Reset Password" variant="outline-accent" icon="refresh-outline" iconPosition="left" accent={accent} onPress={handleResetPassword} />
                <View style={{ marginTop: 8 }}>
                  <DarkButton label="Remove Admin" variant="outline-danger" icon="person-remove-outline" iconPosition="left" onPress={handleDeleteAdmin} />
                </View>
              </View>
            </>
          ) : (
            <Text style={{ color: DT.textSecondary, fontSize: 14 }}>No admin user for this school.</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: DT.textPrimary }}>Users</Text>
          <View style={{ minWidth: 140 }}>
            <DarkButton label="View All →" variant="ghost" icon="arrow-forward" iconPosition="right" fullWidth={false} onPress={() => navigation.navigate('SchoolUsers', { schoolId })} />
          </View>
        </View>
        <View style={{ backgroundColor: DT.card, borderRadius: 12, padding: 12 }}>
          {previewUsers.length > 0 ? (
            previewUsers.map((u) => (
              <View key={u.id} style={{ backgroundColor: DT.card2, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: accent + '40', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: accent, fontWeight: '700', fontSize: 14 }}>{(u.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DT.textPrimary, fontWeight: '700', fontSize: 14 }}>{u.name || '—'}</Text>
                  <Text style={{ color: DT.textMuted, fontSize: 12, marginTop: 2 }}>{u.email || '—'}</Text>
                </View>
                <View style={{ borderWidth: 1, borderColor: accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: accent, fontSize: 11, fontWeight: '600' }}>{u.role}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: DT.textMuted, fontSize: 14, fontStyle: 'italic' }}>No users yet</Text>
          )}
        </View>

        <View style={{ marginTop: 24, marginBottom: 40, backgroundColor: '#1A0A0A', borderRadius: DT.radius.lg, padding: 20, borderWidth: 1, borderColor: '#3A1A1A' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: DT.danger }}>Danger Zone</Text>
          <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginTop: 4 }}>Irreversible actions</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <Text style={{ color: DT.textPrimary }}>School active</Text>
            <Switch value={school?.isActive ?? false} onValueChange={toggleStatus} trackColor={{ false: DT.border, true: accent }} thumbColor="#FFFFFF" />
          </View>
          <View style={{ marginTop: 12 }}>
            <DarkButton label="Delete School" variant="danger" icon="trash-outline" iconPosition="left" onPress={handleDeleteSchool} />
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!resetPasswordModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: DT.card, borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: DT.textPrimary, textAlign: 'center' }}>New Password</Text>
            <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>⚠️ Save this — shown only once</Text>
            <View style={{ backgroundColor: DT.input, borderRadius: 12, padding: 12, marginTop: 16 }}>
              <Text style={{ fontVariant: ['tabular-nums'], color: DT.textPrimary, fontSize: 16 }}>{resetPasswordModal?.newPassword}</Text>
            </View>
            <DarkButton label="Done" variant="accent" icon="checkmark" iconPosition="right" accent={accent} onPress={() => setResetPasswordModal(null)} style={{ marginTop: 20 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: DT.card, borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: DT.textPrimary, textAlign: 'center' }}>Delete School</Text>
            <Text style={{ fontSize: 13, color: DT.textMuted, marginTop: 8, textAlign: 'center' }}>Type the school name to confirm: "{data?.school.name}"</Text>
            <TextInput
              style={{ backgroundColor: DT.input, borderRadius: DT.radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: DT.textPrimary, marginTop: 16, borderWidth: 1, borderColor: DT.border }}
              placeholder="School name"
              placeholderTextColor={DT.textMuted}
              value={deleteConfirmName}
              onChangeText={setDeleteConfirmName}
            />
            <DarkButton label="Delete Permanently" variant="danger" icon="trash-outline" iconPosition="left" onPress={confirmDeleteSchool} style={{ marginTop: 20 }} />
            <DarkButton label="Cancel" variant="ghost" icon="close-outline" iconPosition="left" onPress={() => setDeleteModalVisible(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
