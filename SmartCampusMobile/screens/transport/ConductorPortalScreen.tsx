/**
 * Bus Helper Portal — dark + accent: header, greeting, active trip card, my routes, recent trips.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Bus, ChevronRight, Clock, MapPin, User as UserIcon } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { BusHelperFloatingNav } from '../../components/ui/BusHelperFloatingNav';
import { T } from '../../constants/theme';

const API = apiClient as any;

function getInitials(name: string) {
  return (name ?? 'D').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning 👋';
  if (h < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

export default function ConductorPortalScreen() {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [routesRes, activeRes, historyRes] = await Promise.all([
        API.get('/bushelper/routes'),
        API.get('/bushelper/trips/active'),
        API.get('/bushelper/trips/history'),
      ]);
      const routesData = (routesRes as any)?.data ?? routesRes;
      setRoutes(Array.isArray(routesData) ? routesData : (routesData?.data ?? []));
      const activeData = (activeRes as any)?.data ?? activeRes;
      setActiveTrip(activeData ?? null);
      const historyData = (historyRes as any)?.data ?? historyRes;
      const list = Array.isArray(historyData) ? historyData : historyData?.data ?? [];
      setRecentTrips(list.slice(0, 3));
    } catch (_e) {
      setRoutes([]);
      setActiveTrip(null);
      setRecentTrips([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleStartTrip = (routeId: string, routeName: string) => {
    Alert.alert('Start Trip', `Start trip for ${routeName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          setStarting(routeId);
          try {
            const res = await API.post('/bushelper/trips/start', { routeId });
            const trip = (res as any)?.data ?? res;
            await load();
            navigation.navigate('ActiveTrip', { tripId: trip?.id });
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to start trip');
          } finally {
            setStarting(null);
          }
        },
      },
    ]);
  };

  const helperName = userData?.name ?? 'Driver';
  const pendingStops = activeTrip?.stops?.filter((s: any) => s.status === 'PENDING').length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingTop: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        {/* Header (flat) */}
        <View style={{ paddingTop: insets.top + 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...T.font.appTitle, color: T.textDark }}>Bus Portal</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Conductor</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  navigation.navigate('Profile');
                } catch (_e) {}
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: T.primary,
                alignItems: 'center',
                justifyContent: 'center',
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textWhite, fontSize: 13, fontWeight: '900' }}>{getInitials(helperName)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 16 }}>{getGreeting()}</Text>
        <Text style={{ color: T.textDark, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 6 }} numberOfLines={1}>
          {helperName}
        </Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
          <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>BUS HELPER</Text>
        </View>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Active trip card */}
        <View style={{ marginTop: 24 }}>
          {activeTrip ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  navigation.navigate('ActiveTrip', { tripId: activeTrip.id });
                } catch (_e) {}
              }}
              style={{
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 16,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ color: T.success, fontSize: 12, fontWeight: '900' }}>● TRIP IN PROGRESS</Text>
                  <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginTop: 8 }} numberOfLines={1}>
                    {activeTrip.route?.name ?? 'Route'}
                  </Text>
                  <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                    Bus {activeTrip.route?.busNumber ?? '—'} · {pendingStops} stops remaining
                  </Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.successTint, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.25)' }}>
                  <ChevronRight size={20} color={T.success} strokeWidth={1.8} />
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  try {
                    navigation.navigate('ActiveTrip', { tripId: activeTrip.id });
                  } catch (_e) {}
                }}
                style={{
                  marginTop: 14,
                  height: 46,
                  borderRadius: 999,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...T.shadowSm,
                }}
              >
                <Text style={{ color: T.textWhite, fontWeight: '900' }}>Continue</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, marginTop: 4, ...T.shadowSm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={22} color={T.primary} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>No active trip</Text>
                  <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>Start a route below to begin</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* My Routes */}
        <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', marginTop: 24 }}>My Routes</Text>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>assigned to you</Text>

        {routes.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 24, alignItems: 'center', ...T.shadowSm }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={28} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16, marginTop: 12 }}>No routes assigned</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 6 }}>Contact your admin</Text>
          </View>
        ) : (
          routes.map((r) => (
            <View key={r.id} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  try {
                    navigation.navigate('RouteDetail', { routeId: r.id });
                  } catch (_e) {}
                }}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: T.primary,
                  ...T.shadowSm,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Bus size={20} color={T.primary} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <View style={{ alignSelf: 'flex-start', backgroundColor: T.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8, borderWidth: 1.5, borderColor: T.inputBorder }}>
                      <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>{r.busNumber ?? '—'}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={T.textPlaceholder} strokeWidth={1.8} />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                    <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                      {r.startTime ?? '—'} – {r.endTime ?? '—'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MapPin size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                    <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{r.stopCount ?? r.stops?.length ?? 0} stops</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <UserIcon size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                    <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{r.studentCount ?? 0} students</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleStartTrip(r.id, r.name)}
                  style={{
                    marginTop: 14,
                    height: 46,
                    borderRadius: 999,
                    backgroundColor: T.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: starting === r.id ? 0.7 : 1,
                    ...T.shadowSm,
                  }}
                  disabled={starting === r.id}
                >
                  <Text style={{ color: T.textWhite, fontWeight: '900' }}>{starting === r.id ? 'Starting…' : 'Start Trip'}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Recent Trips */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900' }}>Recent Trips</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              try {
                navigation.navigate('TripHistory');
              } catch (_e) {}
            }}
          >
            <Text style={{ color: T.primary, fontWeight: '800', fontSize: 13 }}>View All</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>your last trips</Text>

        {recentTrips.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
            <Text style={{ color: T.textMuted, fontSize: 13, fontStyle: 'italic' }}>No recent trips</Text>
          </View>
        ) : (
          recentTrips.map((t) => {
            const isCompleted = (t.status ?? '').toUpperCase() === 'COMPLETED';
            return (
              <View
                key={t.id}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 16,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  ...T.shadowSm,
                }}
              >
                <View>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 14 }} numberOfLines={1}>
                    {t.routeName ?? t.route?.name ?? 'Trip'}
                  </Text>
                  <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>
                    {t.date ?? (t.startedAt ? new Date(t.startedAt).toLocaleDateString() : '—')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: T.primary, fontWeight: '900', fontSize: 13 }}>{t.duration ?? 0} min</Text>
                  <View
                    style={{
                      marginTop: 4,
                      backgroundColor: isCompleted ? T.successTint : T.dangerTint,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: isCompleted ? T.success : T.danger, fontSize: 11, fontWeight: '900' }}>
                      {isCompleted ? 'COMPLETED' : 'CANCELLED'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <BusHelperFloatingNav navigation={navigation} activeTab="ConductorPortal" />
    </SafeAreaView>
  );
}
