/**
 * Super Admin — All Schools: light theme (T tokens), search, filter chips, FAB.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Building2, ChevronRight, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { SuperAdminFloatingNav } from '../../components/ui/SuperAdminFloatingNav';

interface SchoolRow {
  id: string;
  name: string;
  schoolCode: string | null;
  isActive: boolean;
  _count?: { users: number; registrationRequests: number };
}

export default function SchoolManagementScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: { schools: SchoolRow[] } }>('/superadmin/schools');
      const data = (res as any)?.data;
      setSchools(data?.schools ?? []);
    } catch (_e) {
      setSchools([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await apiClient.patch(`/superadmin/schools/${id}/status`, { isActive });
      setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
    } catch (_e) {}
  };

  const filtered = schools.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.schoolCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && s.isActive) || (filter === 'inactive' && !s.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
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
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Schools</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: T.card,
            borderRadius: T.radius.full,
            height: 48,
            paddingHorizontal: 16,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            ...T.shadowSm,
          }}
        >
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: T.textDark, paddingVertical: 0, marginLeft: 10 }}
            placeholder="Search schools"
            placeholderTextColor={T.textPlaceholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8, gap: 8 }}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 16,
                height: 36,
                borderRadius: 18,
                backgroundColor: filter === f ? T.primary : T.card,
                borderWidth: 1.5,
                borderColor: filter === f ? T.primary : T.inputBorder,
                alignItems: 'center',
                justifyContent: 'center',
                ...(filter === f ? T.shadowSm : {}),
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: filter === f ? T.textWhite : T.textDark }}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Building2 size={34} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: T.textDark }}>No schools yet</Text>
              <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, textAlign: 'center' }}>Create your first school to get started</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CreateSchool')}
                style={{
                  marginTop: 16,
                  backgroundColor: T.primary,
                  borderRadius: T.radius.full,
                  paddingHorizontal: 18,
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...T.shadowSm,
                }}
              >
                <Text style={{ color: T.textWhite, fontWeight: '800' }}>Add First School</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SchoolDetail', { schoolId: item.id })} style={{ marginBottom: 12 }}>
              <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 16 }}>{item.name?.charAt(0) ?? 'S'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: T.textDark }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
                        {item.schoolCode ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: item.isActive ? T.successTint : T.dangerTint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: T.inputBorder }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: item.isActive ? T.success : T.danger }}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 12, color: T.textMuted }}>{item._count?.users ?? 0} users</Text>
                    <Text style={{ fontSize: 12, color: T.textMuted }}>{item._count?.registrationRequests ?? 0} requests</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Switch
                      value={item.isActive}
                      onValueChange={(v) => toggleStatus(item.id, v)}
                      trackColor={{ false: T.inputBorder, true: T.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <ChevronRight size={18} color={T.textPlaceholder} strokeWidth={1.8} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('CreateSchool')}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 90,
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
        <Plus size={24} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <SuperAdminFloatingNav navigation={navigation} activeTab="SchoolManagement" />
    </SafeAreaView>
  );
}
