/**
 * Super Admin — All Schools: DT theme, no shadows, search, filter chips, PulsingFAB.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { DarkHeader, Pressable3D, PulsingFAB, DarkButton } from '../../components/ui';
import { DT } from '../../constants/darkTheme';
import apiClient from '../../services/apiClient';

interface SchoolRow {
  id: string;
  name: string;
  schoolCode: string | null;
  isActive: boolean;
  _count?: { users: number; registrationRequests: number };
}

export default function SchoolManagementScreen() {
  const navigation = useNavigation<any>();
  const { accent } = useSuperAdminAccent();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <DarkHeader
        title="All Schools"
        showBack
        onBackPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        accent={accent}
      />

      <View style={{ paddingHorizontal: DT.px, marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DT.card, borderRadius: DT.radius.md, height: 48, paddingHorizontal: 16 }}>
          <Ionicons name="search-outline" size={20} color={DT.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: DT.textPrimary, paddingVertical: 0 }}
            placeholder="Search schools"
            placeholderTextColor={DT.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 8 }} contentContainerStyle={{ paddingRight: 20 }}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                marginRight: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === f ? accent : DT.card,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: filter === f ? '#1A1A1A' : DT.textSecondary }}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: DT.px, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: DT.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="business-outline" size={32} color={DT.textMuted} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: DT.textPrimary }}>No schools yet</Text>
              <Text style={{ fontSize: 13, color: DT.textMuted, fontStyle: 'italic', marginTop: 4 }}>Create your first school to get started</Text>
              <View style={{ marginTop: 16 }}>
                <DarkButton label="Add First School" variant="accent" icon="add" iconPosition="left" accent={accent} onPress={() => navigation.navigate('CreateSchool')} fullWidth={false} />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable3D onPress={() => navigation.navigate('SchoolDetail', { schoolId: item.id })} style={{ marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: DT.card,
                  borderRadius: DT.radius.lg,
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: accent,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: DT.textPrimary, flex: 1 }}>{item.name}</Text>
                  <View
                    style={{
                      backgroundColor: item.isActive ? accent + '20' : 'rgba(51,51,51,0.5)',
                      borderWidth: item.isActive ? 1 : 0,
                      borderColor: item.isActive ? accent : 'transparent',
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: item.isActive ? accent : DT.textSecondary }}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: accent, fontStyle: 'italic', fontVariant: ['tabular-nums'] }}>{item.schoolCode ?? '—'}</Text>
                  <Text style={{ fontSize: 12, color: DT.textMuted, marginLeft: 8 }}>{item._count?.users ?? 0} users</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic' }}>{item._count?.registrationRequests ?? 0} requests</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Switch
                      value={item.isActive}
                      onValueChange={(v) => toggleStatus(item.id, v)}
                      trackColor={{ false: DT.border, true: accent }}
                      thumbColor="#FFFFFF"
                    />
                    <Text style={{ color: DT.textSecondary, fontSize: 13, marginLeft: 8 }}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SchoolDetail', { schoolId: item.id })}
                      style={{ backgroundColor: accent + '20', borderRadius: 10, padding: 8, marginLeft: 8 }}
                    >
                      <Ionicons name="chevron-forward" size={16} color={accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Pressable3D>
          )}
        />
      )}

      <PulsingFAB accent={accent} onPress={() => navigation.navigate('CreateSchool')} />
    </SafeAreaView>
  );
}
