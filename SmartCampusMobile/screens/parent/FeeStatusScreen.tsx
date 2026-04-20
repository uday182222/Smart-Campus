/**
 * Parent Fee Status — premium gradient + breakdown cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { FloatingNav } from '../../components/ui/FloatingNav';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';

const API = apiClient as any;

function feeIcon(name: string): { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string } {
  const n = (name || '').toLowerCase();
  if (n.includes('tuition') || n.includes('academic')) return { icon: 'school', color: '#3B82F6' };
  if (n.includes('transport') || n.includes('bus')) return { icon: 'bus-school', color: '#22C55E' };
  if (n.includes('library')) return { icon: 'library', color: '#F97316' };
  if (n.includes('sport')) return { icon: 'trophy', color: '#A855F7' };
  if (n.includes('medical')) return { icon: 'hospital-building', color: '#EF4444' };
  return { icon: 'wallet', color: '#6366F1' };
}

export default function FeeStatusScreen() {
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`/parent/fees/${studentId}`);
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

  const summary = data?.summary ?? { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalExpected: 0, percentCollected: 0 };
  const feeStructures = data?.feeStructures ?? [];
  const totalPaid = summary.totalPaid ?? 0;
  const totalDue = summary.totalDue ?? 0;
  const totalExpected = summary.totalExpected ?? feeStructures.reduce((s: number, f: any) => s + Number(f.amount ?? 0), 0);
  const totalAll = totalExpected > 0 ? totalExpected : totalPaid + totalDue || 1;
  const pctPaid = summary.percentCollected ?? Math.min(100, Math.round((totalPaid / totalAll) * 100));
  const totalOverdue = summary.totalOverdue ?? 0;
  const childName = activeChild?.name ?? children[0]?.name ?? 'Student';
  const classLabel = (activeChild as any)?.className ?? (children[0] as any)?.className ?? '';
  const subtitle = classLabel ? `${childName} · ${classLabel}` : childName;
  const totalAmount = totalPaid + totalDue;

  if (loading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: PD.bg }}>
        <LinearGradient colors={[primary, primaryDark]} style={{ padding: 24, paddingTop: 56 }}>
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
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 22, flex: 1 }}>Fee Status</Text>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: PD.textMuted }}>Loading…</Text>
        </View>
        <FloatingNav navigation={navigation} activeTab="ParentFees" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
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
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Fee Status</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8 }}>{subtitle}</Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 42, letterSpacing: -1, marginTop: 16 }}>₹{totalAmount.toLocaleString()}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>Total</Text>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#15803D" />
                <Text style={{ color: '#15803D', fontWeight: '700', fontSize: 11, marginLeft: 4 }}>Paid</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 22, marginTop: 8 }}>₹{totalPaid.toLocaleString()}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 11 }}>Pending</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 22, marginTop: 8 }}>₹{totalDue.toLocaleString()}</Text>
            </View>
          </View>
          <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, marginTop: 20, overflow: 'hidden' }}>
            <View style={{ height: 10, width: `${pctPaid}%`, backgroundColor: '#FFFFFF', borderRadius: 999 }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 12, fontWeight: '600' }}>
            {pctPaid}% collected · ₹{totalOverdue.toLocaleString()} overdue
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110, paddingTop: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}>
        <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 18, marginBottom: 16 }, cardShadow]}>
          <Text style={{ color: PD.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>SUMMARY</Text>
          <View style={{ flexDirection: 'row', marginTop: 12, flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Text style={{ color: PD.textMuted, fontSize: 11 }}>Total fees</Text>
              <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 18 }}>₹{totalAll.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Text style={{ color: PD.textMuted, fontSize: 11 }}>Paid</Text>
              <Text style={{ color: '#15803D', fontWeight: '900', fontSize: 18 }}>₹{totalPaid.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Text style={{ color: PD.textMuted, fontSize: 11 }}>Pending</Text>
              <Text style={{ color: PD.warning, fontWeight: '900', fontSize: 18 }}>₹{totalDue.toLocaleString()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: '45%' }}>
              <Text style={{ color: PD.textMuted, fontSize: 11 }}>Collection</Text>
              <Text style={{ color: primary, fontWeight: '900', fontSize: 18 }}>{pctPaid}%</Text>
            </View>
          </View>
        </View>

        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20, marginBottom: 16 }}>Fee Breakdown</Text>
        {feeStructures.length === 0 ? (
          <View style={[{ padding: 24, borderRadius: 20, backgroundColor: PD.card, alignItems: 'center' }, cardShadow]}>
            <Text style={{ color: PD.textMuted }}>No fee records</Text>
          </View>
        ) : (
          feeStructures.map((fee: any, i: number) => {
            const status = (fee.status ?? 'PENDING').toUpperCase();
            const { icon, color } = feeIcon(fee.name ?? '');
            const isPaid = status === 'PAID';
            const isOverdue = status === 'OVERDUE';
            const stripColor = isPaid ? '#22C55E' : isOverdue ? PD.danger : PD.warning;
            const due = fee.dueDate ? new Date(fee.dueDate + 'T12:00:00') : null;
            const now = new Date();
            const daysUntil =
              due && !isPaid ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : null;
            const overdueDays =
              isOverdue && due ? Math.max(0, Math.ceil((now.getTime() - due.getTime()) / 86400000)) : null;
            return (
              <View key={fee.id ?? fee.name ?? i} style={[{ backgroundColor: PD.card, borderRadius: 20, marginBottom: 16, overflow: 'hidden' }, cardShadow]}>
                <View style={{ flexDirection: 'row', padding: 20, alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: PD.bg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    <Text style={{ color: PD.textDark, fontWeight: '900' }}>{i + 1}</Text>
                  </View>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color + '33', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialCommunityIcons name={icon} size={26} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 17, flex: 1 }}>{fee.name}</Text>
                      <View
                        style={{
                          backgroundColor: isPaid ? '#DCFCE7' : isOverdue ? '#FEE2E2' : '#FEF3C7',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: isPaid ? '#15803D' : isOverdue ? PD.danger : PD.warning, fontSize: 10, fontWeight: '900' }}>
                          {isPaid ? '✓ Paid' : isOverdue ? '⚠ Overdue' : 'Due Soon'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: primary, fontWeight: '900', fontSize: 20, marginTop: 6 }}>₹{Number(fee.amount ?? 0).toLocaleString()}</Text>
                    {fee.balanceDue != null && !isPaid ? (
                      <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>Balance: ₹{Number(fee.balanceDue).toLocaleString()}</Text>
                    ) : null}
                    <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>
                      {fee.dueDate ? `Due: ${fee.dueDate}` : ''}
                    </Text>
                  </View>
                </View>
                {isPaid && (fee.paidDate || fee.paidAt) ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: PD.cardBorder, padding: 14, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons name="calendar-check" size={16} color={PD.textMuted} />
                        <Text style={{ color: PD.textMuted, fontSize: 13, marginLeft: 8, flex: 1 }}>
                          Paid on{' '}
                          {fee.paidDate ||
                            (fee.paidAt ? new Date(fee.paidAt).toLocaleDateString('en-IN') : '—')}
                        </Text>
                      </View>
                      {fee.paymentMethod ? (
                        <View style={{ backgroundColor: PD.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: PD.textDark }}>{fee.paymentMethod}</Text>
                        </View>
                      ) : null}
                    </View>
                    {fee.paymentReference ? (
                      <TouchableOpacity
                        onPress={() => Alert.alert('Receipt', `Reference: ${fee.paymentReference}`)}
                        style={{ marginTop: 10 }}
                      >
                        <Text style={{ color: primary, fontWeight: '800', fontSize: 13 }}>View receipt info</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={{ borderTopWidth: 1, borderTopColor: PD.cardBorder, padding: 14, paddingHorizontal: 20, backgroundColor: isOverdue ? '#FEF2F2' : 'transparent' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name={isOverdue ? 'alert-circle' : 'clock-outline'} size={16} color={stripColor} />
                      <Text style={{ color: stripColor, fontWeight: '700', fontSize: 13, marginLeft: 8, flex: 1 }}>
                        {isOverdue
                          ? overdueDays != null
                            ? `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`
                            : 'Overdue'
                          : daysUntil != null
                            ? `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
                            : `Due: ${fee.dueDate ?? '—'}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 24 }}>
          <MaterialCommunityIcons name="information-outline" size={16} color={PD.textMuted} />
          <Text style={{ color: PD.textMuted, fontSize: 12, fontStyle: 'italic', marginLeft: 6, textAlign: 'center', flex: 1 }}>
            Fee status is updated by school admin
          </Text>
        </View>
      </ScrollView>
      <FloatingNav navigation={navigation} activeTab="ParentFees" />
    </View>
  );
}
