/**
 * Parent Report Card — simplified: overall grade + subject list (Lucide + T).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft, BookOpen } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';
import { darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';

const API = apiClient as any;

function gradeLetter(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  return 'D';
}

function barColor(grade: string): string {
  const g = (grade || '').toUpperCase();
  if (g.startsWith('A')) return T.success;
  if (g === 'B') return T.primary;
  if (g === 'C') return T.warning;
  return T.danger;
}

export default function ReportCardScreen() {
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
  const primary = theme.primaryColor || T.primary;
  const primaryDark = darkenHex(primary, 0.2);
  const { activeChild, children } = useActiveChild();
  const studentId = route.params?.studentId ?? activeChild?.studentId ?? children[0]?.studentId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`/parent/marks/${studentId}`);
      const raw = (res as any)?.data ?? res;
      setData(raw);
    } catch {
      setData(null);
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

  const overall = data?.overall ?? {};
  const bySubject = (data?.bySubject ?? []) as any[];
  const childName = activeChild?.name ?? children[0]?.name ?? 'Child';
  const className = activeChild?.className ?? children[0]?.className ?? '—';
  const avg = Math.round(Number(overall.average ?? 0));
  const grade = overall.grade ?? gradeLetter(avg);

  if (loading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <LinearGradient colors={[primary, primaryDark]} style={{ paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
          <Text style={{ color: T.textWhite, fontSize: 24, fontWeight: '900' }}>Report Card</Text>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: T.textPlaceholder, fontStyle: 'italic' }}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
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
            <Text style={{ color: T.textWhite, fontSize: 26, fontWeight: '900', flex: 1 }}>Report Card</Text>
          </View>
          <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: T.textWhite, fontWeight: '700' }}>{childName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>{className}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 48, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        <View style={{ backgroundColor: T.card, borderRadius: T.radius.xl, padding: 24, alignItems: 'center', ...T.shadowMd }}>
          <Text style={{ fontSize: 72, fontWeight: '900', color: T.textDark, letterSpacing: -3 }}>{avg}</Text>
          <View style={{ marginTop: 8, backgroundColor: T.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: T.radius.full }}>
            <Text style={{ ...T.font.label, color: T.primary, fontSize: 16 }}>{grade}</Text>
          </View>
          <Text style={{ ...T.font.body, color: T.textPlaceholder, marginTop: 12 }}>
            out of 100
            {data?.classAverage != null ? ` · Class average: ${Math.round(data.classAverage)}` : ''}
          </Text>
        </View>

        <Text style={{ ...T.font.cardTitle, color: T.textDark, marginTop: 28, marginBottom: 14 }}>Subjects</Text>

        {bySubject.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.lg, padding: 24, alignItems: 'center', ...T.shadowSm }}>
            <BookOpen size={32} color={T.textPlaceholder} strokeWidth={1.5} />
            <Text style={{ color: T.textPlaceholder, marginTop: 10, fontWeight: '600' }}>No marks yet</Text>
          </View>
        ) : (
          bySubject.map((entry: any, i: number) => {
            const entries = entry.entries ?? [];
            if (entries.length === 0) return null;
            const avgMarks =
              entries.reduce((s: number, e: any) => s + Number(e.marks ?? 0), 0) / Math.max(1, entries.length);
            const maxMarks = Number(entries[0]?.maxMarks ?? 100);
            const rounded = Math.round(avgMarks);
            const pct = maxMarks > 0 ? Math.min(100, Math.round((rounded / maxMarks) * 100)) : 0;
            const g = entries[0]?.grade ?? gradeLetter(pct);
            const bc = barColor(g);
            return (
              <View key={entry.subject ?? i} style={{ backgroundColor: T.card, borderRadius: T.radius.lg, padding: 18, marginBottom: 12, ...T.shadowSm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...T.font.label, color: T.textDark, flex: 1 }} numberOfLines={2}>
                    {entry.subject}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: T.primary }}>
                    {rounded}/{maxMarks}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                  <View style={{ backgroundColor: `${bc}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: T.radius.sm }}>
                    <Text style={{ color: bc, fontWeight: '800', fontSize: 12 }}>{g}</Text>
                  </View>
                  <Text style={{ ...T.font.badge, color: T.textPlaceholder }}>{pct}%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: T.bg, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
                  <View style={{ height: 6, width: `${pct}%`, backgroundColor: bc, borderRadius: 3 }} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
