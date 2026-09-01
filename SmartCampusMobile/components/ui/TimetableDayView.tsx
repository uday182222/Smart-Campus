/**
 * Shared day-filtered timetable list — parent, teacher view, etc.
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { T } from '../../constants/theme';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getDefaultTimetableDay(): number {
  const jsDay = new Date().getDay();
  if (jsDay === 0) return 1;
  return jsDay;
}

export interface TimetableDayViewProps {
  periods: any[];
  selectedDay: number;
  onSelectDay: (d: number) => void;
}

export function TimetableDayView({ periods, selectedDay, onSelectDay }: TimetableDayViewProps) {
  const dayPeriods = useMemo(() => {
    return periods
      .filter((p) => p.dayOfWeek === selectedDay)
      .sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0));
  }, [periods, selectedDay]);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {DAY_LABELS.map((label, idx) => {
          const day = idx + 1;
          const active = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.85}
              style={{
                height: 36,
                paddingHorizontal: 16,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? T.primary : T.card,
                borderWidth: active ? 0 : 1.5,
                borderColor: T.inputBorder,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: active ? T.textWhite : T.textDark,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 16 }}>
        {dayPeriods.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Calendar size={32} color={T.textPlaceholder} strokeWidth={1.8} />
            <Text style={{ color: T.textMuted, fontSize: 14, marginTop: 12, fontWeight: '600' }}>
              No classes scheduled
            </Text>
          </View>
        ) : (
          dayPeriods.map((p) => (
            <View
              key={p.id ?? `${p.dayOfWeek}-${p.periodNumber}`}
              style={{
                backgroundColor: T.card,
                borderRadius: T.radius.xxl,
                padding: 16,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: T.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: T.primary, fontWeight: '800', fontSize: 16 }}>{p.periodNumber}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark }}>{p.subject}</Text>
                {p.teacher?.name ? (
                  <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{p.teacher.name}</Text>
                ) : null}
                {p.roomNumber ? (
                  <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Room {p.roomNumber}</Text>
                ) : null}
              </View>

              <Text style={{ fontSize: 12, fontWeight: '600', color: T.textMuted }}>
                {p.startTime}–{p.endTime}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
