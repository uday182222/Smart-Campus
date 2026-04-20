/**
 * Bus Helper — Route detail (light theme).
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Bus, ChevronLeft, Clock, MapPin, Users } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';

const API = apiClient as any;

export default function RouteDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeId = route.params?.routeId;
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!routeId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await API.get(`/bushelper/routes/${routeId}`);
        setData((res as any)?.data ?? res);
      } catch (_e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId]);

  const handleStartTrip = () => {
    Alert.alert('Start Trip', `Start trip for ${data?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          setStarting(true);
          try {
            const res = await API.post('/bushelper/trips/start', { routeId });
            const trip = (res as any)?.data ?? res;
            navigation.navigate('ActiveTrip', { tripId: trip?.id });
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to start trip');
          } finally {
            setStarting(false);
          }
        },
      },
    ]);
  };

  if (loading || !data) {
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
            <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Route Details</Text>
            <View style={{ width: 44, height: 44 }} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stops = data.stops ?? [];
  const studentCount = stops.reduce((sum: number, s: any) => sum + (s.studentCount ?? s.students?.length ?? 0), 0);

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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Route Details</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: T.card,
            borderRadius: T.radius.xxl,
            padding: 20,
            marginTop: 16,
            borderLeftWidth: 4,
            borderLeftColor: T.primary,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            ...T.shadowSm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: T.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Bus size={20} color={T.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18 }}>{data.name}</Text>
              <View
                style={{
                  backgroundColor: T.primaryLight,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  alignSelf: 'flex-start',
                  marginTop: 4,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              >
                <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>{data.busNumber ?? '—'}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>
              {data.startTime ?? '—'} – {data.endTime ?? '—'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{stops.length} stops</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Users size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{studentCount} students</Text>
            </View>
          </View>
        </View>

        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18, marginTop: 24 }}>Stops</Text>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>route overview</Text>

        {stops.map((stop: any, i: number) => (
          <View key={stop.id ?? i} style={{ flexDirection: 'row', marginBottom: 8 }}>
            <View style={{ width: 28, alignItems: 'center' }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '900' }}>{i + 1}</Text>
              </View>
              {i < stops.length - 1 && (
                <View style={{ width: 2, minHeight: 24, marginTop: 2, marginBottom: 2, backgroundColor: T.inputBorder }} />
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
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15 }}>{stop.name}</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{stop.expectedTime ?? '—'}</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{stop.studentCount ?? stop.students?.length ?? 0} students</Text>
              {Array.isArray(stop.students) && stop.students.length > 0 && (
                <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: 4 }} numberOfLines={1}>
                  {stop.students.slice(0, 3).map((s: any) => s.name).join(', ')}
                  {stop.students.length > 3 ? '...' : ''}
                </Text>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartTrip}
          disabled={starting}
          style={{
            marginTop: 24,
            marginBottom: 40,
            height: 52,
            borderRadius: 999,
            backgroundColor: T.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: starting ? 0.7 : 1,
            ...T.shadowSm,
          }}
        >
          <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 15 }}>{starting ? 'Starting…' : 'Start Trip'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
