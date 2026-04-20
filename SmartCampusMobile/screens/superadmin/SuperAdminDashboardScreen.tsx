/**
 * Super Admin Dashboard — DT theme, no shadows on dark cards, PulsingFAB.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import {
  DarkHeader,
  StatCard3D,
  Pressable3D,
  PulsingFAB,
  DashboardSkeleton,
  DarkButton,
} from '../../components/ui';
import { DT } from '../../constants/darkTheme';
import apiClient from '../../services/apiClient';

interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalTeachers: number;
  mostActiveSchool: { id: string; name: string; schoolCode: string | null; studentCount: number; teacherCount?: number } | null;
  recentSchools: Array<{
    id: string;
    name: string;
    schoolCode: string | null;
    createdAt: string;
    isActive: boolean;
    studentCount: number;
  }>;
}

export default function SuperAdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const { accent } = useSuperAdminAccent();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; data: DashboardStats }>('/superadmin/stats');
      const data = (res as any)?.data?.data ?? (res as any)?.data;
      if (data) setStats(data);
    } catch (_e) {
      setStats(null);
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

  if (loading && !stats) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
        <DarkHeader title="Smart Campus" accent={accent} />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const most = stats?.mostActiveSchool;
  const recent = (stats?.recentSchools ?? []).slice(0, 5);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DT.bg }} edges={['top']}>
      <DarkHeader title="Smart Campus" accent={accent} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: DT.px, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
      >
        <View style={{ marginTop: 24, marginBottom: 24 }}>
          <Text style={{ color: DT.textSecondary, fontSize: 14, fontStyle: 'italic' }}>Welcome back,</Text>
          <Text style={{ color: DT.textPrimary, fontSize: 42, fontWeight: '900', letterSpacing: -1.5 }}>
            {userData?.name ?? 'Super Admin'}
          </Text>
          <View
            style={{
              backgroundColor: DT.lime,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 4,
              alignSelf: 'flex-start',
              marginTop: 8,
            }}
          >
            <Text style={{ color: '#1A1A1A', fontSize: 11, fontWeight: '800' }}>SUPER ADMIN</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, marginBottom: 8 }}>
          <View style={{ minWidth: 150, marginRight: 12 }}>
            <StatCard3D value={stats?.totalSchools ?? 0} label="Schools" sublabel="across platform" accent={accent} delay={0} />
          </View>
          <View style={{ minWidth: 150, marginRight: 12 }}>
            <StatCard3D value={stats?.totalStudents ?? 0} label="Students" sublabel="enrolled total" accent={accent} delay={150} />
          </View>
          <View style={{ minWidth: 150, marginRight: 12 }}>
            <StatCard3D value={stats?.totalTeachers ?? 0} label="Teachers" sublabel="active staff" accent={accent} delay={300} />
          </View>
          <View style={{ minWidth: 150 }}>
            <StatCard3D value={stats?.activeSchools ?? 0} label="Active" sublabel="running now" accent={accent} delay={450} />
          </View>
        </ScrollView>

        {most && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 32, marginBottom: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: DT.textPrimary }}>Most Active</Text>
              <Text style={{ fontSize: 13, color: DT.textMuted, fontStyle: 'italic' }}>most active this month</Text>
            </View>
            <Pressable3D onPress={() => navigation.navigate('SchoolDetail', { schoolId: most.id })} style={{ marginBottom: 24 }}>
              <View
                style={{
                  backgroundColor: DT.card,
                  borderRadius: DT.radius.lg,
                  padding: 20,
                  borderLeftWidth: 3,
                  borderLeftColor: accent,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: DT.textPrimary }} numberOfLines={1}>{most.name}</Text>
                <Text style={{ fontSize: 12, color: DT.textMuted, fontStyle: 'italic', marginTop: 4 }}>
                  {most.studentCount} students{most.teacherCount != null ? ` · ${most.teacherCount} teachers` : ''}
                </Text>
                <View style={{ height: 4, backgroundColor: DT.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                  <View style={{ height: 4, backgroundColor: accent, borderRadius: 2, width: '100%' }} />
                </View>
              </View>
            </Pressable3D>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 32, marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: DT.textPrimary }}>Recently Added</Text>
            <Text style={{ fontSize: 13, color: DT.textMuted, fontStyle: 'italic', marginTop: 2 }}>this month</Text>
          </View>
          <DarkButton label="View All →" variant="ghost" icon="arrow-forward" iconPosition="right" fullWidth={false} onPress={() => navigation.navigate('SchoolManagement')} />
        </View>

        {recent.length === 0 ? (
          <View style={{ backgroundColor: DT.card, borderRadius: DT.radius.lg, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: DT.textSecondary, fontSize: 14 }}>No schools yet.</Text>
          </View>
        ) : (
          recent.map((s) => (
            <Pressable3D key={s.id} onPress={() => navigation.navigate('SchoolDetail', { schoolId: s.id })} style={{ marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: DT.card,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderLeftWidth: 2,
                  borderLeftColor: accent,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: '#1A1A1A', fontWeight: '800', fontSize: 16 }}>{s.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: DT.textPrimary, fontSize: 15 }}>{s.name}</Text>
                  <Text style={{ fontSize: 12, color: accent, fontStyle: 'italic', marginTop: 2, fontVariant: ['tabular-nums'] }}>{s.schoolCode ?? '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                  <View style={{ backgroundColor: s.isActive ? accent : '#333333', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: s.isActive ? '#1A1A1A' : DT.textSecondary, fontSize: 11, fontWeight: '700' }}>{s.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: DT.textMuted, fontStyle: 'italic', marginTop: 4 }}>{s.studentCount} students</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={accent} />
              </View>
            </Pressable3D>
          ))
        )}
      </ScrollView>

      <PulsingFAB accent={accent} onPress={() => navigation.navigate('CreateSchool')} />
    </SafeAreaView>
  );
}
