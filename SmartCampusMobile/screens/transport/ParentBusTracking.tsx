/**
 * Parent Bus Tracking — light theme: route card, LIVE badge, stops timeline, auto-refresh 30s.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LightHeader, LightButton, AccentBadge } from '../../components/ui';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import transportService from '../../services/TransportService';
import { LT } from '../../constants/lightTheme';

interface Stop {
  id: string;
  name: string;
  address?: string;
  sequence?: number;
  estimatedTime?: string;
  status?: 'pending' | 'reached' | 'skipped';
  reachedAt?: string;
  isChildStop?: boolean;
}

interface BusStatus {
  routeId?: string;
  routeName?: string;
  busNumber?: string;
  driverName?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  currentStopIndex?: number;
  stops?: Stop[];
  lastUpdated?: string;
  childStopIndex?: number;
  estimatedArrival?: string;
  currentStop?: { name?: string };
}

export default function ParentBusTracking() {
  const { activeChild, children } = useActiveChild();
  const [busStatus, setBusStatus] = useState<BusStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const childName = activeChild?.name ?? children[0]?.name ?? 'Child';

  const fetchBusStatus = useCallback(async () => {
    const sid = activeChild?.studentId ?? children[0]?.studentId;
    if (!sid) {
      setBusStatus(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const studentId = sid;
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
          routeId: route.id,
          routeName: route.name,
          busNumber: (route as any).busNumber,
          status: 'in_progress',
          currentStopIndex: 0,
          stops,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setBusStatus(null);
      }
    } catch (_e) {
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
    const interval = setInterval(fetchBusStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchBusStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusStatus();
  };

  const stops = busStatus?.stops ?? [];
  const currentIdx = busStatus?.currentStopIndex ?? 0;
  const hasActiveTrip = busStatus?.status === 'in_progress';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LT.bg }} edges={['top']}>
      <LightHeader title="Bus Tracking" showBack />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LT.primary} />}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: LT.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginTop: 16,
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: LT.cardBorder,
            ...LT.shadow,
          }}
        >
          <Ionicons name="person-circle-outline" size={24} color={LT.primary} style={{ marginRight: 10 }} />
          <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 15 }}>{childName}</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          {loading && !busStatus ? (
            <View
              style={{
                backgroundColor: LT.card,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: LT.cardBorder,
              }}
            >
              <Text style={{ color: LT.textMuted, fontStyle: 'italic' }}>Loading...</Text>
            </View>
          ) : !busStatus || !hasActiveTrip ? (
            <View
              style={{
                backgroundColor: LT.card,
                borderRadius: 20,
                padding: 32,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: LT.cardBorder,
                ...LT.shadow,
              }}
            >
              <Ionicons name="bus-outline" size={48} color={LT.textMuted} />
              <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 12, textAlign: 'center' }}>
                No active trip
              </Text>
              <Text style={{ color: LT.textMuted, fontSize: 14, fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
                Trip hasn&apos;t started yet
              </Text>
              <View style={{ marginTop: 20, width: '100%' }}>
                <LightButton label="Refresh" variant="outline" icon="refresh-outline" iconPosition="left" onPress={onRefresh} />
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: LT.card,
                borderRadius: 20,
                padding: 20,
                borderLeftWidth: 4,
                borderLeftColor: LT.primary,
                borderWidth: 1,
                borderColor: LT.cardBorder,
                ...LT.shadow,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <View
                  style={{
                    backgroundColor: LT.secondaryLight,
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: LT.secondary, fontSize: 11, fontWeight: '700' }}>LIVE</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="bus-outline" size={32} color={LT.primary} />
                <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 22, marginLeft: 12 }}>{busStatus.routeName ?? 'Route'}</Text>
              </View>
              <Text style={{ color: LT.textMuted, fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>{busStatus.busNumber ?? '—'}</Text>
              <Text style={{ color: LT.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 12 }}>Currently at:</Text>
              <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 18, marginTop: 4 }}>
                {stops[currentIdx]?.name ?? busStatus.currentStop?.name ?? '—'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Ionicons name="time-outline" size={18} color={LT.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 15 }}>ETA to your stop: {busStatus.estimatedArrival ?? '—'}</Text>
              </View>
              <Text style={{ color: LT.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 12 }}>
                Last updated: {busStatus.lastUpdated ? new Date(busStatus.lastUpdated).toLocaleTimeString() : '—'}
              </Text>
            </View>
          )}
        </View>

        {hasActiveTrip && stops.length > 0 && (
          <>
            <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 20, marginTop: 20 }}>Route Stops</Text>
            <Text style={{ color: LT.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 16 }}>today&apos;s route</Text>
            {stops.map((stop, index) => {
              const reached = stop.status === 'reached';
              const isNext = index === currentIdx && !reached;
              return (
                <View key={stop.id} style={{ flexDirection: 'row', marginBottom: 0 }}>
                  <View style={{ width: 24, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: reached ? LT.secondary : 'transparent',
                        borderWidth: 2,
                        borderColor: isNext ? LT.primary : reached ? LT.secondary : LT.cardBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                    {index < stops.length - 1 && (
                      <View
                        style={{
                          flex: 1,
                          width: 2,
                          backgroundColor: reached ? LT.secondary : LT.cardBorder,
                          marginVertical: 2,
                          minHeight: 24,
                        }}
                      />
                    )}
                  </View>
                  <View
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      marginBottom: 8,
                      backgroundColor: LT.card,
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: isNext ? LT.primary : LT.cardBorder,
                      ...LT.shadow,
                    }}
                  >
                    <Text style={{ color: LT.textPrimary, fontWeight: '700', fontSize: 16 }}>{stop.name}</Text>
                    <Text style={{ color: LT.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>{stop.estimatedTime ?? '—'}</Text>
                    {reached && (
                      <Text style={{ color: LT.secondary, fontSize: 12, fontStyle: 'italic', marginTop: 8 }}>✓ Reached</Text>
                    )}
                    {isNext && (
                      <View style={{ marginTop: 8 }}>
                        <AccentBadge label="Next Stop" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
