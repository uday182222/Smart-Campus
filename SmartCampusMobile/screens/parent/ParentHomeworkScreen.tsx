/**
 * Parent Homework — premium filters + assignment cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Modal, Pressable, Linking } from 'react-native';
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

function homeworkStatus(h: any): string {
  return (h.submissionStatus ?? h.status ?? 'PENDING').toUpperCase();
}

function homeworkTeacherName(h: any): string {
  return h.teacherName ?? h.teacher?.name ?? '—';
}

function formatDueDate(h: any): string {
  if (!h.dueDate) return '—';
  try {
    return new Date(h.dueDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getAttachmentLink(h: any): string | null {
  if (h.attachmentUrl) return h.attachmentUrl;
  if (typeof h.attachment === 'string' && h.attachment.trim()) return h.attachment.trim();
  const att = h.attachments;
  if (!att) return null;
  if (typeof att === 'string' && att.trim()) return att.trim();
  if (Array.isArray(att) && att.length > 0) {
    const first = att[0];
    if (typeof first === 'string') return first;
    return first?.url ?? first?.uri ?? first?.link ?? null;
  }
  if (typeof att === 'object' && att !== null) {
    return att.url ?? att.uri ?? att.link ?? null;
  }
  return null;
}

function statusBadgeStyle(st: string): { bg: string; fg: string; label: string } {
  if (st === 'SUBMITTED') {
    return { bg: T.successTint, fg: T.success, label: 'Done' };
  }
  if (st === 'OVERDUE') {
    return { bg: T.dangerTint, fg: T.danger, label: 'Overdue' };
  }
  return { bg: T.primaryLight, fg: T.primary, label: 'Pending' };
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
  const [selectedHw, setSelectedHw] = useState<any>(null);

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

  useEffect(() => {
    if (list.length > 0) {
      console.log('[ParentHomework] sample homework object:', list[0]);
    }
  }, [list]);

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
            const st = homeworkStatus(h);
            const sub = subjectStyle(h.subject || '');
            const pill =
              st === 'SUBMITTED'
                ? { bg: '#DCFCE7', fg: '#15803D', t: '✓ Done' }
                : st === 'OVERDUE'
                  ? { bg: '#FEE2E2', fg: '#DC2626', t: '⚠ Overdue' }
                  : { bg: '#FEF3C7', fg: '#D97706', t: 'Pending' };
            return (
              <TouchableOpacity
                key={h.id || h.title}
                activeOpacity={0.85}
                onPress={() => setSelectedHw(h)}
                style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20, marginBottom: 16 }, cardShadow]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[{ width: 52, height: 52, borderRadius: 26, backgroundColor: sub.color + '22', alignItems: 'center', justifyContent: 'center' }, cardShadow]}>
                    <MaterialCommunityIcons name={sub.icon} size={26} color={sub.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18, letterSpacing: -0.3 }} numberOfLines={2}>
                      {h.title || '—'}
                    </Text>
                    <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>{homeworkTeacherName(h)}</Text>
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
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={selectedHw !== null} transparent animationType="slide" onRequestClose={() => setSelectedHw(null)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSelectedHw(null)}
        >
          <Pressable
            style={{
              backgroundColor: T.card,
              borderTopLeftRadius: T.radius.xxl,
              borderTopRightRadius: T.radius.xxl,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 32,
              maxHeight: '88%',
            }}
            onPress={() => {}}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: T.inputBorder,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            {selectedHw ? (() => {
              const st = homeworkStatus(selectedHw);
              const badge = statusBadgeStyle(st);
              const attachment = getAttachmentLink(selectedHw);
              return (
                <>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: T.textDark }}>
                    {selectedHw.title || '—'}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <Text style={{ color: T.textMuted, fontSize: 14 }}>
                      {selectedHw.subject || '—'}
                    </Text>
                    <Text style={{ color: T.textMuted, fontSize: 14 }}>·</Text>
                    <Text style={{ color: T.textMuted, fontSize: 14 }}>
                      Due {formatDueDate(selectedHw)}
                    </Text>
                  </View>

                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: badge.bg,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: T.radius.full,
                      marginTop: 12,
                    }}
                  >
                    <Text style={{ color: badge.fg, fontWeight: '800', fontSize: 12 }}>{badge.label}</Text>
                  </View>

                  <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '700', marginTop: 20, marginBottom: 8 }}>
                    Instructions
                  </Text>
                  <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                    <Text style={{ color: T.textBody, fontSize: 15, lineHeight: 22 }}>
                      {selectedHw.description?.trim() ? selectedHw.description : '—'}
                    </Text>
                  </ScrollView>

                  {attachment ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(attachment).catch(() => {})}
                      style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}
                    >
                      <MaterialCommunityIcons name="paperclip" size={18} color={T.primary} />
                      <Text style={{ color: T.primary, fontWeight: '700', fontSize: 14, flex: 1 }} numberOfLines={2}>
                        View attachment
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
                    <MaterialCommunityIcons name="account-outline" size={18} color={T.textMuted} />
                    <Text style={{ color: T.textMuted, fontSize: 14 }}>
                      Teacher: {homeworkTeacherName(selectedHw)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedHw(null)}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: T.primary,
                      borderRadius: T.radius.full,
                      paddingVertical: 16,
                      alignItems: 'center',
                      marginTop: 24,
                    }}
                  >
                    <Text style={{ color: T.textWhite, fontWeight: '800', fontSize: 16 }}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })() : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
