import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LT } from '../../constants/lightTheme';

export interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: string[];
  accent?: string;
}

export const DateStrip = memo(function DateStrip({
  selectedDate,
  onDateSelect,
  markedDates = [],
  accent: accentProp,
}: DateStripProps) {
  const primary = accentProp ?? LT.primary;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const selectedKey = selectedDate.toDateString();
  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
      {weekDates.map((date) => {
        const dateKey = date.toISOString().split('T')[0];
        const selected = date.toDateString() === selectedKey;
        const hasEvent = markedSet.has(dateKey);
        return (
          <TouchableOpacity
            key={dateKey}
            onPress={() => onDateSelect(date)}
            style={{ alignItems: 'center', marginHorizontal: 4 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12, color: LT.textMuted, marginBottom: 4 }}>{days[date.getDay()]}</Text>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? primary : LT.card,
                borderWidth: selected ? 0 : 1,
                borderColor: LT.cardBorder,
                ...(!selected ? LT.shadow : {}),
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: selected ? '#FFFFFF' : LT.textPrimary,
                }}
              >
                {date.getDate()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {hasEvent && (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LT.secondary }} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

export default DateStrip;
