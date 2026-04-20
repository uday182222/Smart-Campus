/**
 * Parent Calendar — school events with week strip + list.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { DateStrip } from '../../components/ui';
import { PD, cardShadow, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

const TYPE_COLORS: Record<string, string> = {
  HOLIDAY: '#EF4444',
  EXAM: '#3B82F6',
  MEETING: '#A855F7',
  EVENT: '#2B5CE6',
  REMINDER: '#F59E0B',
};

const TYPE_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  HOLIDAY: 'palm-tree',
  EXAM: 'pencil-circle',
  MEETING: 'account-group',
  EVENT: 'star-circle',
  REMINDER: 'bell-ring',
};

export default function ParentCalendarScreen() {
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
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const month = viewMonth.getMonth() + 1;
  const year = viewMonth.getFullYear();

  const loadEvents = useCallback(async () => {
    try {
      const res = await API.get('/events', { params: { month, year } });
      const inner = (res as any)?.data;
      const data = Array.isArray(inner) ? inner : Array.isArray(res) ? res : [];
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, [month, year]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const selectedStr = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter((e) => {
    const d = (e.date || e.startDate || '').split('T')[0];
    return d === selectedStr;
  });

  const marked = events.map((e) => (e.date || e.startDate || '').split('T')[0]).filter(Boolean);
  const upcoming = events.filter((e) => new Date(e.date || e.startDate) >= new Date()).slice(0, 5);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <View style={{ flex: 1, backgroundColor: PD.bg }}>
      <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
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
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', flex: 1 }}>Calendar</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 4, marginTop: 14, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14 }}>
            <TouchableOpacity
              onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
      >
        <View style={[{ backgroundColor: PD.card, borderRadius: 20, padding: 16, marginTop: 16 }, cardShadow]}>
          <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} markedDates={marked} accent={primary} />
        </View>

        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20, marginTop: 24 }}>
          {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
        </Text>
        <Text style={{ color: PD.textMuted, fontSize: 13, marginTop: 4, marginBottom: 14 }}>
          {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
        </Text>

        {dayEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${primary}18`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={primary} />
            </View>
            <Text style={{ color: PD.textMuted, marginTop: 12 }}>No events on this day</Text>
          </View>
        ) : (
          dayEvents.map((ev) => {
            const t = (ev.type || 'EVENT').toUpperCase();
            const col = TYPE_COLORS[t] || primary;
            const ic = TYPE_ICONS[t] || 'star-circle';
            return (
              <View
                key={ev.id || ev.title}
                style={[{ flexDirection: 'row', backgroundColor: PD.card, borderRadius: 18, padding: 16, marginBottom: 12, overflow: 'hidden' }, cardShadow]}
              >
                <View style={{ width: 4, backgroundColor: col, borderRadius: 2 }} />
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: col + '22', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
                  <MaterialCommunityIcons name={ic} size={22} color={col} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 16 }}>{ev.title}</Text>
                  <Text style={{ color: PD.textMuted, fontSize: 11, marginTop: 4 }}>{ev.date?.split?.('T')?.[0] ?? ''}</Text>
                  {ev.description ? <Text style={{ color: PD.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 8 }} numberOfLines={3}>{ev.description}</Text> : null}
                  <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: col + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: col, fontSize: 10, fontWeight: '800' }}>{t}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Text style={{ color: PD.textDark, fontWeight: '900', fontSize: 20, marginTop: 20, marginBottom: 12 }}>Upcoming</Text>
        {upcoming.map((ev) => (
          <View key={`up-${ev.id}`} style={[{ backgroundColor: PD.card, borderRadius: 16, padding: 14, marginBottom: 10 }, cardShadow]}>
            <Text style={{ color: PD.textDark, fontWeight: '800' }}>{ev.title}</Text>
            <Text style={{ color: PD.textMuted, fontSize: 12, marginTop: 4 }}>{String(ev.date || '').split('T')[0]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
