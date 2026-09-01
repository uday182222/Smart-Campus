/**
 * Teacher — personal weekly timetable (D6).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { apiClient } from '../../services/apiClient';
import { T } from '../../constants/theme';
import { TimetableDayView, getDefaultTimetableDay } from '../../components/ui/TimetableDayView';
import { TeacherFloatingNav } from '../../components/ui/TeacherFloatingNav';

const API = apiClient as any;

export default function MyTimetableScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || T.primary;

  const [selectedDay, setSelectedDay] = useState(getDefaultTimetableDay);
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/timetable/teacher/me');
      const data = (res as any)?.data ?? res;
      const payload = data?.data ?? data;
      setPeriods(Array.isArray(payload?.periods) ? payload.periods : []);
    } catch {
      setPeriods([]);
    } finally {
      setLoading(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.card,
              alignItems: 'center',
              justifyContent: 'center',
              ...T.shadowSm,
            }}
          >
            <ChevronLeft size={20} color={T.textDark} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>My Timetable</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={primary} style={{ marginTop: 40 }} />
        ) : (
          <TimetableDayView periods={periods} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        )}
      </ScrollView>

      <TeacherFloatingNav navigation={navigation} activeTab="TeacherMore" />
    </View>
  );
}
