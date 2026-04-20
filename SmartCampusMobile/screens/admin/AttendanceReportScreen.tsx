/**
 * Admin — Attendance Report. Gradient header, filters, View-based bars, daily list (PD).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Filter, ChevronDown, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';

const API = apiClient as any;
const PRESETS = [
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'Custom', days: 0 },
];

interface DayRow {
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export default function AttendanceReportScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const primary = T.primary;
  const insets = useSafeAreaInsets();

  const [presetIndex, setPresetIndex] = useState(0);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [data, setData] = useState<DayRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getDateRange = useCallback(() => {
    const end = new Date();
    const days = PRESETS[presetIndex].days;
    const start = new Date();
    start.setDate(start.getDate() - (days || 7));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [presetIndex]);

  const load = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const params: Record<string, string> = { startDate, endDate };
      if (classId) params.classId = classId;
      const res = await API.get('/admin/reports/attendance', { params });
      const list = (res?.data?.data ?? res?.data ?? []) as DayRow[];
      setData(list);
    } catch (_e) {
      setData([]);
    } finally {
      setRefreshing(false);
    }
  }, [getDateRange, classId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/classes');
        const list = (res?.data?.data ?? res?.data?.classes ?? res?.data ?? []) as { id: string; name: string }[];
        setClasses(Array.isArray(list) ? list : []);
      } catch (_e) {
        setClasses([]);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const avgPct = data.length ? Math.round(data.reduce((s, d) => s + d.percentage, 0) / data.length) : 0;
  const bestDay = data.length ? data.reduce((a, b) => (a.percentage >= b.percentage ? a : b), data[0]) : null;
  const worstDay = data.length ? data.reduce((a, b) => (a.percentage <= b.percentage ? a : b), data[0]) : null;

  const chartSlice = data.slice(-7);
  const chartData = chartSlice.map((d) => d.percentage);
  const labels = chartSlice.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const barColor = (pct: number) => (pct >= 80 ? T.success : pct >= 60 ? T.warning : T.danger);

  const badgeBgForPct = (pct: number) => {
    if (pct >= 80) return T.successTint;
    if (pct >= 60) return T.warningTint;
    return T.dangerTint;
  };

  const badgeTextForPct = (pct: number) => {
    if (pct >= 80) return T.success;
    if (pct >= 60) return T.warning;
    return T.danger;
  };

  const selectedClassName = classId ? classes.find((c) => c.id === classId)?.name ?? 'Class' : 'All classes';

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Attendance Report</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('Notifications');
                } catch (_e) {}
              }}
            >
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </Pressable>
            <Pressable
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('AdminProfile');
                } catch (_e) {}
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>{(theme.schoolName || 'A').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: 12, paddingRight: 8, gap: 8 }}>
          {PRESETS.map((p, i) => (
            <Pressable
              key={p.label}
              onPress={() => setPresetIndex(i)}
              style={{
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 18,
                backgroundColor: presetIndex === i ? primary : T.card,
                borderWidth: 1.5,
                borderColor: presetIndex === i ? primary : T.inputBorder,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: presetIndex === i ? T.textWhite : T.textDark, fontWeight: '900', fontSize: 13 }}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => setClassPickerOpen(true)}
          style={{
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: T.card,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            paddingHorizontal: 14,
            height: 36,
            borderRadius: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            ...T.shadowSm,
          }}
        >
          <Filter size={18} color={primary} strokeWidth={1.8} />
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 13 }}>{selectedClassName}</Text>
          <ChevronDown size={18} color={T.textPlaceholder} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: primary, fontWeight: '900', fontSize: 30 }}>{avgPct}%</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 6, fontWeight: '800' }}>Average</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: T.success, fontWeight: '900', fontSize: 30 }}>{bestDay ? `${bestDay.percentage}%` : '—'}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 6, fontWeight: '800' }}>Best day</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: T.danger, fontWeight: '900', fontSize: 30 }}>{worstDay ? `${worstDay.percentage}%` : '—'}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 6, fontWeight: '800' }}>Worst day</Text>
          </View>
        </View>

        {chartData.length > 0 && (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 20, marginTop: 16, ...T.shadowSm }}>
            <Text style={{ color: T.textDark, fontSize: 17, fontWeight: '900' }}>Last 7 Days</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, marginTop: 16 }}>
              {chartData.map((val, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
                  <Text style={{ color: T.textDark, fontSize: 11, fontWeight: '900', marginBottom: 4 }}>{val}%</Text>
                  <View style={{ width: '78%', backgroundColor: T.primaryTint, borderRadius: 4, height: 96, overflow: 'hidden', justifyContent: 'flex-end' }}>
                    <View style={{ height: `${Math.max(8, (val / 100) * 96)}%`, backgroundColor: barColor(val), borderRadius: 4 }} />
                  </View>
                  <Text style={{ color: T.textMuted, fontSize: 10, marginTop: 4 }}>{labels[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginTop: 24 }}>Daily breakdown</Text>

        {data.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 24, alignItems: 'center', marginTop: 12, ...T.shadowSm }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={28} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: T.textMuted, marginTop: 10 }}>No attendance data for this range</Text>
          </View>
        ) : (
          data.map((row) => (
            <View
              key={row.date}
              style={{
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 14,
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                ...T.shadowSm,
              }}
            >
              <View>
                <Text style={{ color: T.textDark, fontSize: 14, fontWeight: '900' }}>{row.date}</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                  {new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: primary, fontSize: 13, fontWeight: '800', marginRight: 10 }}>P {row.present}</Text>
                <Text style={{ color: T.textMuted, fontSize: 13, marginRight: 10 }}>A {row.absent}</Text>
                <View
                  style={{
                    backgroundColor: badgeBgForPct(row.percentage),
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                  }}
                >
                  <Text style={{ color: badgeTextForPct(row.percentage), fontSize: 12, fontWeight: '800' }}>{row.percentage}%</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={classPickerOpen} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setClassPickerOpen(false)}>
          <Pressable
            style={{ backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '50%' }}
            // intentional — blocks tap-through
            onPress={() => {}}
          >
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18, marginBottom: 12 }}>Select class</Text>
            <Pressable
              onPress={() => {
                setClassId(null);
                setClassPickerOpen(false);
              }}
              style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.inputBorder }}
            >
              <Text style={{ color: T.textDark, fontWeight: '900' }}>All classes</Text>
            </Pressable>
            <ScrollView>
              {classes.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setClassId(c.id);
                    setClassPickerOpen(false);
                  }}
                  style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.inputBorder }}
                >
                  <Text style={{ color: T.textDark, fontWeight: '700' }}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
