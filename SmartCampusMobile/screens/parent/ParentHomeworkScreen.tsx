/**
 * Parent Homework — premium filters + assignment cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';

const API = apiClient as any;
const FILTERS = ['All', 'Pending', 'Submitted', 'Overdue'] as const;

function subjectStyle(sub: string): { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string } {
  const s = (sub || '').toLowerCase();
  if (s.includes('math')) return { icon: 'calculator-variant', color: '#2563EB' };
  if (s.includes('sci')) return { icon: 'flask-outline', color: '#16A34A' };
  if (s.includes('eng')) return { icon: 'alphabetical', color: '#EA580C' };
  return { icon: 'book-open-variant', color: '#6366F1' };
}

export default function ParentHomeworkScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const stackIndex = useNavigationState((s) => (s && typeof s.index === 'number' ? s.index : 0));
  const fromCrossTab = !!route.params?.fromCrossTab;
  const showBack = navigation.canGoBack() || stackIndex > 0 || fromCrossTab;
  const onBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (stackIndex > 0) {
      navigation.goBack();
      return;
    }
    if (fromCrossTab) {
      navigation.navigate('ParentHome' as never, { screen: 'ParentDashboard' } as never);
    }
  };
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const { activeChild, children } = useActiveChild();
  const studentId = activeChild?.studentId ?? children[0]?.studentId;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`/parent/homework/${studentId}`);
      const data = (res as any)?.data ?? res;
      setList(Array.isArray(data) ? data : data?.homework ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = list.filter((h) => {
    const status = (h.submissionStatus ?? h.status ?? '').toUpperCase();
    if (filter === 'All') return true;
    if (filter === 'Pending') return status === 'PENDING';
    if (filter === 'Submitted') return status === 'SUBMITTED';
    if (filter === 'Overdue') return status === 'OVERDUE';
    return true;
  });

  const childName = activeChild?.name ?? children[0]?.name ?? 'Child';

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showBack ? (
              <TouchableOpacity
                onPress={onBackPress}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <ArrowLeft size={20} color={T.primary} strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Homework</Text>
          </View>
          <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{childName}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ paddingRight: 8 }}>
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: on ? primary : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}>
        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 22 }}>{filtered.length} assignments</Text>
        <Text style={{ color: PD.textMuted, fontSize: 14, marginTop: 4, marginBottom: 16 }}>for {childName}</Text>

        {loading ? (
          <Text style={{ color: PD.textMuted }}>Loading…</Text>
        ) : (
          filtered.map((h: any) => {
            const st = (h.submissionStatus ?? h.status ?? 'PENDING').toUpperCase();
            const sub = subjectStyle(h.subject || '');
            const pill =
              st === 'SUBMITTED'
                ? { bg: '#DCFCE7', fg: '#15803D', t: '✓ Done' }
                : st === 'OVERDUE'
                  ? { bg: '#FEE2E2', fg: '#DC2626', t: '⚠ Overdue' }
                  : { bg: '#FEF3C7', fg: '#D97706', t: 'Pending' };
            return (
              <View key={h.id || h.title} style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginBottom: 16 }, cardShadow]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[{ width: 52, height: 52, borderRadius: 26, backgroundColor: sub.color + '22', alignItems: 'center', justifyContent: 'center' }, cardShadow]}>
                    <MaterialCommunityIcons name={sub.icon} size={26} color={sub.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, letterSpacing: -0.3 }} numberOfLines={2}>
                      {h.title}
                    </Text>
                    <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>{h.teacher?.name ?? 'Teacher'}</Text>
                  </View>
                  <View style={{ position: 'absolute', right: 0, top: 0, backgroundColor: pill.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                    <Text style={{ color: pill.fg, fontSize: 10, fontWeight: '900' }}>{pill.t}</Text>
                  </View>
                </View>
                {h.description ? (
                  <Text style={{ color: PD.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 12 }} numberOfLines={2}>
                    {h.description}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="calendar" size={14} color={PD.textMuted} />
                    <Text style={{ color: st === 'OVERDUE' ? PD.danger : primary, fontSize: 13, fontWeight: '700', marginLeft: 6 }}>
                      Due {h.dueDate ? new Date(h.dueDate).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  <Text style={{ color: primary, fontWeight: '800', fontSize: 13 }}>View Details</Text>
                </View>
                {st === 'PENDING' && (
                  <View style={{ height: 3, backgroundColor: PD.bg, borderRadius: 2, marginTop: 12 }}>
                    <View style={{ width: '40%', height: 3, backgroundColor: primary, borderRadius: 2 }} />
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
