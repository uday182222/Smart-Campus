/**
 * Super Admin — School Users list. Light theme, tokenized role badges.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Users } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { SuperAdminFloatingNav } from '../../components/ui/SuperAdminFloatingNav';

type Params = { schoolId: string };

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

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
  const insets = useSafeAreaInsets();
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

  const getRoleTint = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: T.primaryLight, fg: T.primary };
      case 'TEACHER':
        return { bg: T.successTint, fg: T.success };
      case 'PARENT':
        return { bg: T.warningTint, fg: T.warning };
      case 'BUS_HELPER':
        return { bg: T.primaryLight, fg: T.primary };
      case 'PRINCIPAL':
        return { bg: T.primaryLight, fg: T.primary };
      default:
        return { bg: T.card, fg: T.textMuted };
    }
  };

  if (!schoolId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
              }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
            >
              <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Users</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: T.textMuted }}>Invalid school</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Users</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: T.px, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value || 'ALL'}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 16,
              height: 36,
              borderRadius: 18,
              backgroundColor: filter === f.value ? T.primary : T.card,
              borderWidth: 1.5,
              borderColor: filter === f.value ? T.primary : T.inputBorder,
              alignItems: 'center',
              justifyContent: 'center',
              ...(filter === f.value ? T.shadowSm : {}),
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: filter === f.value ? T.textWhite : T.textDark }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Users size={34} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: T.textDark }}>No users found</Text>
              <Text style={{ fontSize: 14, color: T.textMuted, marginTop: 6 }}>for this role</Text>
            </View>
          }
          renderItem={({ item }) => {
            const roleTint = getRoleTint(item.role);
            return (
              <View
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 14,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...T.shadowSm,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: roleTint.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1.5, borderColor: T.inputBorder }}>
                  <Text style={{ color: roleTint.fg, fontWeight: '900', fontSize: 14 }}>{getInitials(item.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: T.textDark }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }} numberOfLines={1}>
                    {item.email}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ backgroundColor: roleTint.bg, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: roleTint.fg }}>{item.role}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <SuperAdminFloatingNav navigation={navigation} activeTab="SchoolUsers" />
    </SafeAreaView>
  );
}
