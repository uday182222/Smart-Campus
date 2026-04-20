/**
 * Bus Helper — Active trip: current stop, mark reached/skip, students, end trip (light theme).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Check, CheckCircle2, Clock, SkipForward, MapPin, Users } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';

const API = apiClient as any;

function getInitials(name: string) {
  return (name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function ActiveTripScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tripId = route.params?.tripId;
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    try {
      const res = await API.get('/bushelper/trips/active');
      const data = (res as any)?.data ?? res;
      setTrip(data);
      if (!data && !tripId) navigation.replace('ConductorPortal');
    } catch (_e) {
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [navigation, tripId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markStopReached = async () => {
    if (!trip?.stops?.length) return;
    const current = trip.stops.find((s: any) => s.status === 'PENDING' || s.status === 'CURRENT');
    if (!current) return;
    setActioning(true);
    try {
      await API.post(`/bushelper/trips/${trip.id}/stops/${current.id}/reached`);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed');
    } finally {
      setActioning(false);
    }
  };

  const skipStop = () => {
    const current = trip?.stops?.find((s: any) => s.status === 'PENDING' || s.status === 'CURRENT');
    if (!current) return;
    Alert.alert('Skip Stop', `Skip ${current.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        onPress: async () => {
          setActioning(true);
          try {
            await API.post(`/bushelper/trips/${trip.id}/stops/${current.id}/skip`);
            await load();
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed');
          } finally {
            setActioning(false);
          }
        },
      },
    ]);
  };

  const markStudentBoarded = async (studentId: string) => {
    setActioning(true);
    try {
      await API.post(`/bushelper/trips/${trip.id}/students/${studentId}/boarded`);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed');
    } finally {
      setActioning(false);
    }
  };

  const endTrip = () => {
    const pending = trip?.stops?.filter((s: any) => s.status === 'PENDING').length ?? 0;
    Alert.alert('End Trip', pending > 0 ? `End trip? ${pending} stops remaining.` : 'End trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        style: 'destructive',
        onPress: async () => {
          setActioning(true);
          try {
            const res = await API.post(`/bushelper/trips/${trip.id}/end`);
            const data = (res as any)?.data ?? res;
            navigation.replace('TripSummary', { summary: data });
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed');
          } finally {
            setActioning(false);
          }
        },
      },
    ]);
  };

  if (loading && !trip) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => (canGoBack ? navigation.goBack() : null)}
              disabled={!canGoBack}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: T.card,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoBack ? 1 : 0,
                ...T.shadowSm,
              }}
            >
              <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Active Trip</Text>
            <View style={{ width: 44, height: 44 }} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) return null;

  const stops = trip.stops ?? [];
  const reachedCount = stops.filter((s: any) => s.status === 'REACHED').length;
  const currentStop = stops.find((s: any) => s.status === 'PENDING' || s.status === 'CURRENT') ?? stops[reachedCount];
  const currentIndex = currentStop ? stops.indexOf(currentStop) : reachedCount;
  const totalStops = stops.length;
  const elapsed = trip.startedAt ? Math.round((Date.now() - new Date(trip.startedAt).getTime()) / 60000) : 0;
  const progressPct = totalStops > 0 ? (reachedCount / totalStops) * 100 : 0;
  const studentsAtStop = currentStop?.students ?? currentStop?.studentIds ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }} edges={['top']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => (canGoBack ? navigation.goBack() : null)}
            disabled={!canGoBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canGoBack ? 1 : 0,
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Active Trip</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
          <Animated.View
            style={{
              backgroundColor: T.success,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 6,
              opacity: pulseAnim,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>● LIVE</Text>
          </Animated.View>
        </View>
        <Text style={{ color: T.textMuted, fontSize: 14, textAlign: 'center', marginTop: 4 }} numberOfLines={1}>
          {trip.route?.name ?? 'Route'}
        </Text>

        {/* Trip progress */}
        <View
          style={{
            backgroundColor: T.card,
            borderRadius: T.radius.xxl,
            padding: 16,
            marginTop: 12,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            ...T.shadowSm,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15 }}>
              Stop {currentIndex + 1} of {totalStops}
            </Text>
            <Text style={{ color: T.primary, fontWeight: '900', fontSize: 18 }}>{elapsed} min</Text>
          </View>
          <View style={{ height: 8, backgroundColor: T.primaryTint, borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
            <View style={{ height: 8, backgroundColor: T.primary, borderRadius: 4, width: `${progressPct}%` }} />
          </View>
        </View>

        {/* Current stop — light green card */}
        {currentStop && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: T.successTint,
              borderRadius: T.radius.xxl,
              padding: 20,
              borderWidth: 1.5,
              borderColor: 'rgba(34,197,94,0.25)',
              ...T.shadowSm,
            }}
          >
            <View style={{ alignSelf: 'flex-start', backgroundColor: T.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1.5, borderColor: T.inputBorder }}>
              <Text style={{ color: T.success, fontSize: 11, fontWeight: '900' }}>CURRENT STOP</Text>
            </View>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginTop: 10 }}>{currentStop.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Clock size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 13 }}>Expected: {currentStop.expectedTime ?? '—'}</Text>
            </View>

            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 14, marginTop: 16, marginBottom: 10 }}>
              Students at this stop
            </Text>
            {(studentsAtStop.length === 0 ? [] : studentsAtStop).map((stu: any) => {
              const id = stu.id ?? stu.studentId ?? stu;
              const name = typeof stu === 'object' ? (stu.name ?? 'Student') : 'Student';
              const className = typeof stu === 'object' ? (stu.className ?? '') : '';
              const boarded = typeof stu === 'object' && (stu.boarded ?? stu.boardingStatus === 'BOARDED');
              return (
                <View
                  key={String(id)}
                  style={{
                    backgroundColor: T.card,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: T.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900' }}>{getInitials(name)}</Text>
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15 }}>{name}</Text>
                    <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{className}</Text>
                  </View>
                  {boarded ? (
                    <CheckCircle2 size={22} color={T.success} strokeWidth={1.8} />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => markStudentBoarded(id)}
                      style={{
                        paddingHorizontal: 12,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: T.card,
                        borderWidth: 1.5,
                        borderColor: T.inputBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: T.primary, fontWeight: '900', fontSize: 12 }}>Boarded</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            {studentsAtStop.length === 0 && (
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>No students at this stop</Text>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={markStopReached}
                  disabled={actioning}
                  style={{
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: T.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    opacity: actioning ? 0.7 : 1,
                    ...T.shadowSm,
                  }}
                >
                  <Check size={18} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 14 }}>Mark Reached</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={skipStop}
                disabled={actioning}
                style={{
                  flex: 1,
                  height: 48,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                  borderRadius: 999,
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                <SkipForward size={18} color={T.danger} strokeWidth={1.8} />
                <Text style={{ color: T.danger, fontWeight: '900', fontSize: 14 }}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18, marginTop: 20, marginBottom: 12 }}>Next Stops</Text>
        {stops.map((s: any, i: number) => {
          const isReached = s.status === 'REACHED';
          const isCurrent =
            (s.status === 'PENDING' || s.status === 'CURRENT') || (!s.status && i === currentIndex);
          const isSkipped = s.status === 'SKIPPED';
          return (
            <View key={s.id} style={{ flexDirection: 'row', marginBottom: 0 }}>
              <View style={{ width: 28, alignItems: 'center' }}>
                <Animated.View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: isReached ? T.primary : isCurrent ? T.primary : 'transparent',
                    borderWidth: isReached || isCurrent ? 0 : 2,
                    borderColor: isCurrent ? T.primary : T.inputBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isCurrent ? pulseAnim : 1,
                  }}
                >
                  {isReached ? <Check size={12} color={T.textWhite} strokeWidth={1.8} /> : null}
                </Animated.View>
                {i < stops.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      minHeight: 32,
                      marginTop: 2,
                      marginBottom: 2,
                      backgroundColor: T.inputBorder,
                    }}
                  />
                )}
              </View>
              <View
                style={{
                  flex: 1,
                  marginLeft: 12,
                  marginBottom: 8,
                  backgroundColor: T.card,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: isCurrent ? 2 : 1,
                  borderColor: isCurrent ? T.primary : T.inputBorder,
                  ...T.shadowSm,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15 }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Users size={14} color={T.textPlaceholder} strokeWidth={1.8} />
                    <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{s.studentCount ?? 0}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <MapPin size={14} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{s.expectedTime ?? '—'}</Text>
                </View>
                <View style={{ marginTop: 4 }}>
                  {isReached && <Text style={{ color: T.primary, fontSize: 12, fontStyle: 'italic' }}>Reached</Text>}
                  {isCurrent && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                      <Text style={{ color: T.primary, fontWeight: '900', fontSize: 11 }}>Current</Text>
                    </View>
                  )}
                  {isSkipped && <Text style={{ color: T.warning, fontSize: 12, fontStyle: 'italic' }}>Skipped</Text>}
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={endTrip}
            disabled={actioning}
            style={{
              height: 52,
              borderRadius: 999,
              backgroundColor: T.danger,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: actioning ? 0.7 : 1,
              ...T.shadowSm,
            }}
          >
            <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 15 }}>End Trip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
