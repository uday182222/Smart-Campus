/**
 * Super Admin — School Users list. DT theme, role-colored avatars and badges.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { DarkHeader } from '../../components/ui';
import { DT } from '../../constants/darkTheme';
import apiClient from '../../services/apiClient';

type Params = { schoolId: string };

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: DT.lime,
  TEACHER: '#00D4FF',
  PARENT: '#A855F7',
  BUS_HELPER: '#F97316',
  PRINCIPAL: '#F59E0B',
  OFFICE_STAFF: DT.textSecondary,
  STUDENT: '#22C55E',
  SUPER_ADMIN: DT.lime,
};

const FILTERS: Array<{ label: string; value: '' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'BUS_HELPER' }> = [
  { label: 'All', value: '' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Principal', value: 'PRINCIPAL' },
  { label: 'Teacher', value: 'TEACHER' },
  { label: 'Parent', value: 'PARENT' },
  { label: 'Bus Helper', value: 'BUS_HELPER' },
];

export default function SchoolUsersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: Params }, 'params'>>();
  const schoolId = route.params?.schoolId;
  const { accent } = useSuperAdminAccent();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'' | 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'BUS_HELPER'>('');

  const load = useCallback(async () => {
    if (!schoolId) return;
    try {
      const url = filter ? `/superadmin/schools/${schoolId}/users?role=${filter}` : `/superadmin/schools/${schoolId}/users`;
      const res = await apiClient.get<{ success: boolean; data: { users: UserRow[] } }>(url);
      const data = (res as any)?.data;
      setUsers(data?.users ?? []);
    } catch (_e) {
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const getInitials = (name: string) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const getRoleColor = (role: string) => ROLE_COLOR[role] || accent;

  if (!schoolId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
        <DarkHeader
          title="School Users"
          showBack
          onBackPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          accent={accent}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: DT.textSecondary }}>Invalid school</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <DarkHeader
        title="School Users"
        showBack
        onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        accent={accent}
      />
      <View style={{ paddingHorizontal: DT.px, marginTop: 16, flexDirection: 'row', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value || 'ALL'}
            onPress={() => setFilter(f.value)}
            style={{
              marginRight: 8,
              marginBottom: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filter === f.value ? accent : DT.card,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: filter === f.value ? '#1A1A1A' : DT.textSecondary }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: DT.px, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Ionicons name="people-outline" size={48} color={DT.textMuted} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: DT.textPrimary, marginTop: 16 }}>No users found</Text>
              <Text style={{ fontSize: 14, color: DT.textMuted, fontStyle: 'italic', marginTop: 4 }}>for this role</Text>
            </View>
          }
          renderItem={({ item }) => {
            const roleColor = getRoleColor(item.role);
            return (
              <View
                style={{
                  backgroundColor: DT.card,
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: roleColor + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: roleColor, fontWeight: '700', fontSize: 14 }}>{getInitials(item.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: DT.textPrimary }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: DT.textMuted, marginTop: 2 }}>{item.email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ backgroundColor: roleColor + '20', borderWidth: 1, borderColor: roleColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: roleColor }}>{item.role}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: DT.textMuted, marginTop: 4 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
