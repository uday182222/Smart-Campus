/**
 * Parent Bus Tracking — premium gradient + timeline (auto-refresh 30s).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { FloatingNav } from '../../components/ui/FloatingNav';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import transportService from '../../services/TransportService';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';

interface Stop {
  id: string;
  name: string;
  estimatedTime?: string;
  status?: 'pending' | 'reached' | 'skipped';
}

interface BusStatus {
  routeName?: string;
  busNumber?: string;
  driverName?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  currentStopIndex?: number;
  stops?: Stop[];
  lastUpdated?: string;
  estimatedArrival?: string;
  currentStop?: { name?: string };
}

export default function BusTrackingScreen() {
  const navigation = useNavigation<any>();
  const { activeChild, children } = useActiveChild();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.2);
  const [busStatus, setBusStatus] = useState<BusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusStatus = useCallback(async () => {
    const studentId = activeChild?.studentId ?? children[0]?.studentId;
    if (!studentId) {
      setBusStatus(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const result = await transportService.getStudentRoute(studentId);
      if (result.success && result.data) {
        const route = result.data.route;
        const stops: Stop[] = (route.stops || []).map((s: any, idx: number) => ({
          id: s.id ?? String(idx),
          name: s.name ?? 'Stop',
          estimatedTime: s.expectedTime ?? s.estimatedTime,
          status: s.status ?? 'pending',
        }));
        setBusStatus({
          routeName: route.name,
          busNumber: (route as any).busNumber,
          driverName: (route as any).driverName,
          status: 'in_progress',
          currentStopIndex: 0,
          stops,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setBusStatus(null);
      }
    } catch {
      setBusStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeChild?.studentId, children]);

  useEffect(() => {
    fetchBusStatus();
  }, [fetchBusStatus]);

  useEffect(() => {
    const t = setInterval(fetchBusStatus, 30000);
    return () => clearInterval(t);
  }, [fetchBusStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusStatus();
  };

  const stops = busStatus?.stops ?? [];
  const currentIdx = busStatus?.currentStopIndex ?? 0;
  const live = busStatus?.status === 'in_progress' && stops.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }}>Bus Tracking</Text>
          {busStatus?.routeName ? (
            <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{busStatus.routeName}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: live ? PD.success : PD.textMuted, marginRight: 8 }} />
            <Text style={{ color: live ? '#FFFFFF' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' }}>
              {live ? 'Live Tracking' : 'No Active Trip'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        {loading && !busStatus ? (
          <Text style={{ color: PD.textMuted, textAlign: 'center', marginTop: 24 }}>Loading route…</Text>
        ) : !live ? (
          <View style={[{ padding: 24, borderRadius: 20, backgroundColor: PD.card, alignItems: 'center' }, cardShadow]}>
            <MaterialCommunityIcons name="bus-alert" size={48} color={PD.textMuted} />
            <Text style={{ color: PD.textDark, fontWeight: '800', marginTop: 12 }}>No active trip</Text>
            <Text style={{ color: PD.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>When the bus starts, live status appears here.</Text>
          </View>
        ) : (
          <>
            <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 20 }, cardShadow]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: primary, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="bus-school" size={34} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 19 }}>{busStatus?.routeName}</Text>
                  <Text style={{ color: PD.textMuted, fontSize: 13, marginTop: 4 }}>{busStatus?.busNumber ?? '—'}</Text>
                  <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 2 }}>{busStatus?.driverName ?? 'Driver —'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 16, backgroundColor: `${primary}12`, borderRadius: 14, padding: 14 }}>
                <Text style={{ color: PD.textMuted, fontSize: 11, fontWeight: '600' }}>CURRENT LOCATION</Text>
                <Text style={{ color: primary, fontWeight: '800', fontSize: 16, marginTop: 6 }}>
                  {stops[currentIdx]?.name ?? busStatus?.currentStop?.name ?? '—'}
                </Text>
                <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 4 }}>ETA: {busStatus?.estimatedArrival ?? '—'}</Text>
              </View>
            </View>

            <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20, marginTop: 28, marginBottom: 16 }}>Route Stops</Text>
            {stops.map((stop, index) => {
              const reached = stop.status === 'reached';
              const isNext = index === currentIdx && !reached;
              return (
                <View key={stop.id} style={{ flexDirection: 'row' }}>
                  <View style={{ width: 32, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: reached ? PD.success : isNext ? primary : PD.card,
                        borderWidth: isNext ? 0 : 2,
                        borderColor: isNext ? primary : PD.cardBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {reached ? <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" /> : null}
                    </View>
                    {index < stops.length - 1 ? (
                      <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: reached ? PD.success : '#E5E7EB', marginVertical: 4 }} />
                    ) : null}
                  </View>
                  <View style={[{ flex: 1, marginLeft: 12, marginBottom: 14, borderRadius: 14, padding: 14, backgroundColor: PD.card }, cardShadow, isNext ? { borderWidth: 2, borderColor: primary } : {}]}>
                    <Text style={{ color: PD.textDark, fontWeight: '800', fontSize: 15 }}>{stop.name}</Text>
                    <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>{stop.estimatedTime ?? '—'}</Text>
                    {isNext ? (
                      <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>NEXT</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </>
        )}
        <Text style={{ color: PD.textMuted, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>
          Auto-refreshing every 30s
        </Text>
      </ScrollView>
      <FloatingNav navigation={navigation} activeTab="ParentBus" />
    </View>
  );
}
