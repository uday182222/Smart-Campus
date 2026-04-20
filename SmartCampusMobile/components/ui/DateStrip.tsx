import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LT } from '../../constants/lightTheme';

export interface DateStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: string[];
  accent?: string;
}

export function DateStrip({
  selectedDate,
  onDateSelect,
  markedDates = [],
  accent: accentProp,
}: DateStripProps) {
  const primary = accentProp ?? LT.primary;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  const hasEvent = (date: Date) => markedDates.includes(date.toISOString().split('T')[0]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
      {weekDates.map((date, i) => (
        <TouchableOpacity
          key={i}
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
              backgroundColor: isSelected(date) ? primary : LT.card,
              borderWidth: isSelected(date) ? 0 : 1,
              borderColor: LT.cardBorder,
              ...(!isSelected(date) ? LT.shadow : {}),
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isSelected(date) ? '#FFFFFF' : LT.textPrimary,
              }}
            >
              {date.getDate()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            {hasEvent(date) && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LT.secondary }} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default DateStrip;
