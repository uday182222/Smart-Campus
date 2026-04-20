/**
 * Parent Attendance — premium month view, calendar, log.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
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
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const { width: SCREEN_W } = Dimensions.get('window');
const CELL = (SCREEN_W - 40 - 16) / 7;

export default function AttendanceHistoryScreen() {
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
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0, late: 0, percentage: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`/parent/attendance/${studentId}`, { params: { month, year } });
      const data = (res as any)?.data ?? res;
      setRecords(data?.records ?? []);
      setSummary(data?.summary ?? { present: 0, absent: 0, late: 0, percentage: 0, total: 0 });
    } catch {
      setRecords([]);
      setSummary({ present: 0, absent: 0, late: 0, percentage: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [studentId, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const childName = activeChild?.name ?? children[0]?.name ?? 'Child';
  const recordMap = new Map(
    records.map((r) => {
      const raw = r.date;
      const key = typeof raw === 'string' ? raw.split('T')[0] : new Date(raw).toISOString().split('T')[0];
      return [key, (r.status || '').toUpperCase()];
    }),
  );

  const getDayStyle = (status?: string) => {
    if (!status) return { bg: '#FFFFFF', text: T.textPlaceholder, border: T.inputBorder };
    switch (status) {
      case 'PRESENT':
        return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' };
      case 'ABSENT':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'LATE':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      default:
        return { bg: '#FFFFFF', text: T.textPlaceholder, border: T.inputBorder };
    }
  };
  const cellSize = Math.max(28, Math.min(CELL - 6, 40));
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const gridCells: { date: number; dateStr: string; status?: string; isToday: boolean; isFuture: boolean; weekend: boolean }[] = [];
  for (let i = 0; i < startPad; i++) gridCells.push({ date: 0, dateStr: '', isToday: false, isFuture: false, weekend: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const status = recordMap.get(dateStr);
    const dt = new Date(year, month - 1, d);
    const isFuture = dt > new Date();
    const weekend = dt.getDay() === 0 || dt.getDay() === 6;
    gridCells.push({ date: d, dateStr, status, isToday: dateStr === todayStr, isFuture, weekend });
  }

  const pct = Math.round(summary.percentage);

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
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
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Attendance</Text>
          </View>
          <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{childName}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        <View style={[{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: PD.card, borderRadius: 20, padding: 6 }, cardShadow]}>
          <TouchableOpacity onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${primary}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', color: PD.textDark, fontWeight: '900', fontSize: 16 }}>{monthLabel}</Text>
          <TouchableOpacity onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${primary}18`, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={primary} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 22, marginTop: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 56, fontWeight: '900', textAlign: 'center', letterSpacing: -2 }}>{pct}%</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center', marginTop: 6 }}>attendance this month</Text>
          <View style={{ flexDirection: 'row', marginTop: 18 }}>
            {[
              { v: summary.present, l: 'Present' },
              { v: summary.absent, l: 'Absent' },
              { v: summary.late, l: 'Late' },
            ].map((x) => (
              <View key={x.l} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 26 }}>{x.v}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>{x.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 16, marginTop: 20 }, cardShadow]}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <View key={`${d}-${i}`} style={{ width: CELL, alignItems: 'center' }}>
                <Text style={{ color: PD.textMuted, fontSize: 11, fontWeight: '700' }}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {gridCells.map((cell, i) => {
              if (cell.date === 0) {
                return <View key={i} style={{ width: CELL, height: CELL, margin: 2, alignItems: 'center', justifyContent: 'center' }} />;
              }
              const st = (cell.status || '').toUpperCase();
              const dayStyle = getDayStyle(cell.isFuture ? undefined : st);
              const isToday = cell.isToday;
              const fg = isToday ? T.textWhite : cell.isFuture ? '#9CA3AF' : cell.weekend && !st ? '#D1D5DB' : dayStyle.text;
              const bg = isToday ? primary : cell.isFuture ? '#FFFFFF' : dayStyle.bg;
              const border = isToday ? primary : dayStyle.border;
              return (
                <View
                  key={i}
                  style={{
                    width: CELL,
                    height: CELL,
                    margin: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: cellSize / 2,
                      backgroundColor: bg,
                      borderWidth: 1.5,
                      borderColor: border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: fg }}>{cell.date}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 12 }}>
          {[
            { color: '#DCFCE7', text: '#16A34A', label: 'Present' },
            { color: '#FEE2E2', text: '#DC2626', label: 'Absent' },
            { color: '#FEF3C7', text: '#D97706', label: 'Late' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: item.color,
                  borderWidth: 1,
                  borderColor: item.text,
                }}
              />
              <Text style={{ fontSize: 11, color: T.textMuted, fontWeight: '500' }}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20, marginTop: 28, marginBottom: 12 }}>Attendance Log</Text>
        {loading ? (
          <Text style={{ color: PD.textMuted }}>Loading…</Text>
        ) : records.length === 0 ? (
          <Text style={{ color: PD.textMuted, fontStyle: 'italic' }}>No records for this month</Text>
        ) : (
          records.map((item, i) => {
            const d = new Date(item.date);
            const statusColor = item.status === 'PRESENT' ? PD.success : item.status === 'ABSENT' ? PD.danger : PD.warning;
            return (
              <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: PD.card, borderRadius: 14, padding: 14, marginBottom: 10 }, cardShadow]}>
                <View>
                  <Text style={{ color: PD.textMuted, fontSize: 11 }}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, marginTop: 2 }}>{item.date?.split?.('-')?.[2] ?? ''}</Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: PD.cardBorder, marginHorizontal: 14 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: statusColor + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: statusColor, fontWeight: '900', fontSize: 11 }}>{item.status}</Text>
                  </View>
                  <Text style={{ color: PD.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 6 }} numberOfLines={1}>
                    {item.subject ?? item.remarks ?? ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
