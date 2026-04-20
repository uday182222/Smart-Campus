/**
 * Bus Helper — Trip completed summary (light theme).
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, ChevronLeft, Clock, MapPin, SkipForward, Users } from 'lucide-react-native';
import { T } from '../../constants/theme';

export default function TripSummaryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const summary = route.params?.summary ?? {};

  const duration = summary.duration ?? 0;
  const stopsReached = summary.stopsReached ?? 0;
  const stopsSkipped = summary.stopsSkipped ?? 0;
  const studentsBoarded = summary.studentsBoarded ?? 0;
  const routeName = summary.routeName ?? summary.route?.name ?? 'Route';
  const startedAt = summary.startedAt ? new Date(summary.startedAt) : null;
  const endedAt = summary.endedAt ? new Date(summary.endedAt) : null;
  const dateStr = startedAt?.toLocaleDateString() ?? '';
  const timeStr =
    startedAt && endedAt
      ? `${startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${endedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';
  const stopsBreakdown = summary.stops ?? summary.stopSummary ?? [];

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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Trip Summary</Text>
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: T.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={40} color={T.textWhite} strokeWidth={1.8} />
          </View>
          <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 28, textAlign: 'center', marginTop: 16 }}>Trip Completed!</Text>
          <Text style={{ color: T.textMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>{routeName}</Text>
          <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 2 }}>
            {dateStr} {timeStr}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 32, gap: 10 }}>
          {[
            { Icon: Clock, value: duration, label: 'Duration', sub: 'total time' },
            { Icon: MapPin, value: stopsReached, label: 'Stops Reached', sub: 'on time' },
            { Icon: Users, value: studentsBoarded, label: 'Students Boarded', sub: 'picked up' },
            { Icon: SkipForward, value: stopsSkipped, label: 'Stops Skipped', sub: 'bypassed' },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                width: '48%',
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 16,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <s.Icon size={20} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.primary, fontWeight: '900', fontSize: 28 }}>{s.value}</Text>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 12, marginTop: 4 }}>{s.label}</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 }}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 18, marginTop: 24 }}>Trip Summary</Text>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2, marginBottom: 12 }}>stop by stop breakdown</Text>
        {(stopsBreakdown.length > 0 ? stopsBreakdown : []).map((stop: any, i: number) => {
          const isReached = (stop.status ?? '').toUpperCase() === 'REACHED';
          return (
            <View
              key={stop.id ?? i}
              style={{
                backgroundColor: T.card,
                borderRadius: 16,
                padding: 14,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isReached ? T.success : T.warning,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isReached ? <Check size={12} color={T.textWhite} strokeWidth={1.8} /> : <SkipForward size={12} color={T.textWhite} strokeWidth={1.8} />}
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 15 }}>{stop.name}</Text>
                <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic' }}>{stop.studentCount ?? 0} students</Text>
              </View>
              <Text style={{ color: isReached ? T.success : T.warning, fontSize: 12, fontWeight: '900' }}>
                {isReached ? 'Reached' : 'Skipped'}
              </Text>
            </View>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'ConductorPortal' }] })}
          style={{
            marginTop: 32,
            marginBottom: 40,
            height: 52,
            borderRadius: 999,
            backgroundColor: T.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...T.shadowSm,
          }}
        >
          <Text style={{ color: T.textWhite, fontWeight: '900', fontSize: 15 }}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
