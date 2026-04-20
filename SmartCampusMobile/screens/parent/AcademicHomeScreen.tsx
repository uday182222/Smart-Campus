/**
 * Academic hub — quick links, attendance ring, homework preview, marks strip.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FloatingNav } from '../../components/ui/FloatingNav';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import ParentService from '../../services/ParentService';
import { PD, cardShadow, darkenHex, statNumber } from '../../constants/parentDesign';

const { width: SCREEN_W } = Dimensions.get('window');

const QUICK: (
  | { icon: 'book-open-variant' | 'chart-bar' | 'calendar-check' | 'calendar-month' | 'calendar-clock'; label: string; colorKey: string; nav: 'Homework' | 'ReportCard' | 'Attendance' | 'Calendar' }
  | { icon: 'calendar-clock'; label: string; colorKey: string; galleryAppointments: true }
)[] = [
  { icon: 'book-open-variant', label: 'Homework', colorKey: 'primary', nav: 'Homework' },
  { icon: 'chart-bar', label: 'Report Card', colorKey: 'success', nav: 'ReportCard' },
  { icon: 'calendar-check', label: 'Attendance', colorKey: 'warning', nav: 'Attendance' },
  { icon: 'calendar-month', label: 'Calendar', colorKey: 'info', nav: 'Calendar' },
  { icon: 'calendar-clock', label: 'Appointments', colorKey: 'info', galleryAppointments: true },
];

const COLOR_MAP: Record<string, string> = {
  primary: '#2B5CE6',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
};

export default function AcademicHomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const { children, activeChild, setActiveChild, loadChildren } = useActiveChild();
  const child = activeChild ?? children[0];
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const sid = child?.studentId;
    if (!sid) return;
    try {
      const raw = await ParentService.getDashboard(sid);
      setData(raw?.data ?? raw);
    } catch {
      setData(null);
    }
  }, [child?.studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    await load();
    setRefreshing(false);
  };

  const att = data?.attendance ?? {};
  const pct = Math.round(att.percentage ?? 0);
  const hw = (data?.homework?.recent ?? []).slice(0, 3);
  const marks = data?.marks ?? {};
  const subs = (marks.bySubject ?? marks.subjects ?? []) as any[];

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900' }}>Academic</Text>
          {child ? (
            <View style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{child.name}</Text>
            </View>
          ) : null}
          {children.length >= 2 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
              {children.map((c: any) => {
                const on = activeChild?.studentId === c.studentId;
                return (
                  <TouchableOpacity
                    key={c.studentId}
                    onPress={() => setActiveChild(c)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Text style={{ color: on ? primary : '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: PD.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 }}>QUICK ACCESS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {QUICK.map((q) => {
            const c = q.colorKey === 'primary' ? primary : COLOR_MAP[q.colorKey] || primary;
            const key = 'galleryAppointments' in q ? 'appointments-quick' : q.nav;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => {
                  if ('galleryAppointments' in q) {
                    navigation.getParent()?.navigate('ParentGallery', { screen: 'Appointments' });
                  } else {
                    navigation.navigate(q.nav);
                  }
                }}
                style={{ width: (SCREEN_W - 40 - 12) / 2, marginBottom: 12, alignItems: 'center' }}
              >
                <View style={[{ width: 64, height: 64, borderRadius: 32, backgroundColor: PD.card, alignItems: 'center', justifyContent: 'center' }, cardShadow]}>
                  <MaterialCommunityIcons name={q.icon} size={28} color={c} />
                </View>
                <Text style={{ color: PD.textDark, fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>{q.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginTop: 8 }, cardShadow]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 17 }}>Attendance</Text>
            <View style={{ backgroundColor: `${primary}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: primary, fontSize: 11, fontWeight: '800' }}>{new Date().toLocaleString('en', { month: 'short' })}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 10,
                borderColor: `${primary}35`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={[statNumber, { color: primary }]}>{pct}%</Text>
            </View>
            <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 8 }}>this month</Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {[
              { l: 'Present', v: att.presentDays ?? att.present ?? '—' },
              { l: 'Absent', v: att.absentDays ?? att.absent ?? '—' },
              { l: 'Late', v: att.late ?? '0' },
            ].map((row) => (
              <View key={row.l} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20 }}>{row.v}</Text>
                <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>{row.l}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Attendance')} style={{ marginTop: 16 }}>
            <Text style={{ color: primary, fontWeight: '800', fontSize: 14 }}>View Details →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18 }}>Homework</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Homework')}>
            <Text style={{ color: primary, fontWeight: '700', fontSize: 13 }}>View All →</Text>
          </TouchableOpacity>
        </View>
        {hw.length === 0 ? (
          <Text style={{ color: PD.textMuted, marginTop: 12, fontStyle: 'italic' }}>No recent assignments.</Text>
        ) : (
          hw.map((h: any) => (
            <View key={h.id || h.title} style={[{ backgroundColor: PD.card, borderRadius: 16, padding: 14, marginTop: 10 }, cardShadow]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${primary}22`, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="notebook-outline" size={22} color={primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                    {h.title ?? 'Assignment'}
                  </Text>
                  <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 2 }}>{h.teacher?.name ?? 'Teacher'}</Text>
                </View>
                <View style={{ backgroundColor: PD.warning + '22', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: PD.warning, fontSize: 10, fontWeight: '800' }}>
                    {h.dueDate ? new Date(h.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, marginTop: 28 }}>Latest Results</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
          {(subs.length ? subs : [{ name: 'Overall', pct: marks.average ?? 0, grade: '—' }]).map((s: any, i: number) => (
            <View key={i} style={[{ width: 140, backgroundColor: PD.card, borderRadius: 16, padding: 14, marginRight: 12 }, cardShadow]}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: PD.success + '22', alignSelf: 'center' }} />
              <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 13, marginTop: 10, textAlign: 'center' }} numberOfLines={1}>
                {s.name ?? s.subject ?? 'Subject'}
              </Text>
              <Text style={[statNumber, { fontSize: 22, color: primary, textAlign: 'center', marginTop: 6 }]}>
                {s.marks ?? s.pct ?? s.percentage ?? '—'}
                <Text style={{ fontSize: 12, color: PD.textMuted, fontWeight: '600' }}>/100</Text>
              </Text>
              <View style={{ alignSelf: 'center', marginTop: 8, backgroundColor: PD.success + '33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: PD.success, fontWeight: '800', fontSize: 11 }}>{s.grade ?? 'A'}</Text>
              </View>
              <View style={{ height: 4, backgroundColor: PD.bg, borderRadius: 2, marginTop: 10 }}>
                <View style={{ height: 4, width: `${Math.min(100, s.pct ?? s.percentage ?? 80)}%`, backgroundColor: primary, borderRadius: 2 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
      <FloatingNav navigation={navigation} activeTab="ParentAcademic" />
    </View>
  );
}
