/**
 * Parent Timetable — child's weekly schedule (A7).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useNavigationState } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';
import { PD, darkenHex } from '../../constants/parentDesign';
import { T } from '../../constants/theme';
import { TimetableDayView, getDefaultTimetableDay } from '../../components/ui/TimetableDayView';

const API = apiClient as any;

export default function TimetableScreen() {
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
  const { activeChild, children } = useActiveChild();
  const studentId = activeChild?.studentId ?? children[0]?.studentId;

  const [selectedDay, setSelectedDay] = useState(getDefaultTimetableDay);
  const [className, setClassName] = useState('');
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await API.get(`/timetable/student/${studentId}`);
      const data = (res as any)?.data ?? res;
      const payload = data?.data ?? data;
      setClassName(payload?.className ?? activeChild?.className ?? '');
      setPeriods(Array.isArray(payload?.periods) ? payload.periods : []);
    } catch {
      setClassName(activeChild?.className ?? '');
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, activeChild?.className]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
                <ArrowLeft size={20} color={T.primary} strokeWidth={1.8} />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }}>Timetable</Text>
              {className ? (
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
                  {className}
                </Text>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={primary} style={{ marginTop: 40 }} />
        ) : (
          <TimetableDayView periods={periods} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        )}
      </ScrollView>
    </View>
  );
}
