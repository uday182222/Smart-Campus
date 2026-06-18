/**
 * Super Admin Dashboard — light theme (T tokens), Lucide icons.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Plus, ChevronRight, Building2, Users, GraduationCap, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardSkeleton } from '../../components/ui';
import { T } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import { SuperAdminFloatingNav } from '../../components/ui/SuperAdminFloatingNav';

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
  const insets = useSafeAreaInsets();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: T.textDark }}>Smart Campus</Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Super Admin</Text>
        </View>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const most = stats?.mostActiveSchool;
  const recent = (stats?.recentSchools ?? []).slice(0, 5);
  const saName = userData?.name ?? 'Super Admin';
  const initials =
    saName
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SA';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Profile')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: T.card,
                borderRadius: T.radius.full,
                paddingVertical: 6,
                paddingLeft: 6,
                paddingRight: 16,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>Hi, Welcome Back!</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }} numberOfLines={1}>
                  {saName}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
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
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: T.danger,
                  borderWidth: 2,
                  borderColor: T.bg,
                }}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: T.textDark,
              letterSpacing: -0.8,
              lineHeight: 34,
              marginTop: 18,
            }}
            numberOfLines={1}
          >
            Smart Campus
          </Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>Super Admin</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingRight: T.px, gap: 12, marginTop: 16 }}
        >
          {[
            { value: stats?.totalSchools ?? 0, label: 'Schools', sub: 'across platform', Icon: Building2 },
            { value: stats?.totalStudents ?? 0, label: 'Students', sub: 'enrolled total', Icon: Users },
            { value: stats?.totalTeachers ?? 0, label: 'Teachers', sub: 'active staff', Icon: GraduationCap },
            { value: stats?.activeSchools ?? 0, label: 'Active', sub: 'running now', Icon: CheckCircle },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                minWidth: 140,
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 20,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <s.Icon size={22} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.primary, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>{s.value}</Text>
              <Text style={{ color: T.textDark, fontSize: 13, fontWeight: '700', marginTop: 4 }}>{s.label}</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{s.sub}</Text>
            </View>
          ))}
        </ScrollView>

        {most && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 12, paddingHorizontal: T.px }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: T.textDark }}>Most Active</Text>
              <Text style={{ fontSize: 12, color: T.textMuted }}>most active this month</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SchoolDetail', { schoolId: most.id })}
              style={{ paddingHorizontal: T.px, marginBottom: 12 }}
            >
              <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, borderLeftWidth: 4, borderLeftColor: T.primary, ...T.shadowSm }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: T.textDark }} numberOfLines={1}>
                  {most.name}
                </Text>
                <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
                  {most.studentCount} students{most.teacherCount != null ? ` · ${most.teacherCount} teachers` : ''}
                </Text>
                <View style={{ height: 4, backgroundColor: T.inputBorder, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: T.primary,
                      borderRadius: 2,
                      width: `${Math.max(
                        8,
                        Math.min(
                          100,
                          Math.round(((most.studentCount ?? 0) / Math.max(1, stats?.totalStudents ?? 0)) * 100)
                        )
                      )}%`,
                    }}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 12, paddingHorizontal: T.px }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: T.textDark }}>Recently Added</Text>
            <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>this month</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SchoolManagement')}>
            <Text style={{ color: T.primary, fontWeight: '600', fontSize: 13 }}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={{ paddingHorizontal: T.px }}>
            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 24, alignItems: 'center', ...T.shadowSm }}>
              <Text style={{ color: T.textMuted, fontSize: 14 }}>No schools yet.</Text>
            </View>
          </View>
        ) : (
          recent.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SchoolDetail', { schoolId: s.id })}
              style={{ paddingHorizontal: T.px, marginBottom: 10 }}
            >
              <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, flexDirection: 'row', alignItems: 'center', ...T.shadowSm }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: T.textWhite, fontWeight: '800', fontSize: 18 }}>{s.name.charAt(0)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: T.textDark, fontSize: 15 }} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2, fontVariant: ['tabular-nums'] }} numberOfLines={1}>
                    {s.schoolCode ?? '—'}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.primary, marginTop: 6, fontWeight: '700' }}>{s.studentCount} students</Text>
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <View style={{ backgroundColor: s.isActive ? T.successTint : T.dangerTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ color: s.isActive ? T.success : T.danger, fontSize: 11, fontWeight: '800' }}>{s.isActive ? 'Active' : 'Inactive'}</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <ChevronRight size={18} color={T.textMuted} strokeWidth={1.8} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={() => navigation.navigate('CreateSchool')}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          ...T.shadowLg,
        }}
      >
        <Plus size={24} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      <SuperAdminFloatingNav navigation={navigation} activeTab="SuperAdminDashboard" />
    </SafeAreaView>
  );
}
