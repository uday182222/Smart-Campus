/**
 * Parent My Children — dark + accent: list from GET /parent/children, cards with avatar, stats, View Report Card, Set as Active.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAccentColor } from '../../hooks/useAccentColor';
import { LightHeader, AccentBadge, LightButton } from '../../components/ui';
import { LT } from '../../constants/lightTheme';
import { useActiveChild } from '../../contexts/ActiveChildContext';
import { apiClient } from '../../services/apiClient';

const API = apiClient as any;

interface ChildItem {
  id: string;
  studentId: string;
  name: string;
  className: string;
  section?: string;
  rollNumber?: string;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MyChildrenScreen() {
  const accent = useAccentColor();
  const navigation = useNavigation<any>();
  const { children: contextChildren, activeChild, setActiveChild, loadChildren } = useActiveChild();
  const [list, setList] = useState<ChildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/parent/children');
      const data = (res as any)?.data ?? res;
      const raw = Array.isArray(data?.children) ? data.children : [];
      setList(raw.map((c: any) => ({
        id: c.id ?? c.studentId,
        studentId: c.id ?? c.studentId,
        name: c.name ?? 'Child',
        className: c.className ?? '',
        section: c.section ?? '',
        rollNumber: c.rollNumber ?? '',
      })));
    } catch (_e) {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    await load();
    setRefreshing(false);
  };

  const handleSetActive = async (child: ChildItem) => {
    const mapped = { id: child.id, name: child.name, className: child.className, studentId: child.studentId, rollNumber: child.rollNumber };
    await setActiveChild(mapped as any);
  };

  if (loading && list.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF2FF' }} edges={['top']}>
        <LightHeader title="My Children" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (list.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF2FF' }} edges={['top']}>
        <LightHeader title="My Children" showBack />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="person-outline" size={64} color="#94A3B8" />
          <Text style={{ color: LT.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>No children linked</Text>
          <Text style={{ color: '#94A3B8', fontSize: 14, fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>Your registration is pending approval</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF2FF' }} edges={['top']}>
      <LightHeader title="My Children" showBack />
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <Text style={{ color: LT.textPrimary, fontSize: 28, fontWeight: '900' }}>{list.length} Children</Text>
        <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 4, marginBottom: 20 }}>linked to your account</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />}
        renderItem={({ item }) => {
          const isActive = activeChild?.studentId === item.studentId;
          return (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900' }}>{getInitials(item.name)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ color: LT.textPrimary, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>{item.name}</Text>
                  <View style={{ marginTop: 6 }}>
                    <AccentBadge label={item.className || 'Class'} />
                  </View>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 8 }}>Roll: {item.rollNumber || '—'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
                <View style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: accent, fontWeight: '900', fontSize: 20 }}>—</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>Attendance</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: LT.textPrimary, fontWeight: '900', fontSize: 20 }}>—</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>Homework</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 14, padding: 12, alignItems: 'center' }}>
                  <Text style={{ color: accent, fontWeight: '900', fontSize: 20 }}>—</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 4, textAlign: 'center' }}>Avg Grade</Text>
                </View>
              </View>
              <View style={{ marginTop: 16, gap: 8 }}>
                <LightButton label="View Report Card" onPress={() => navigation.navigate('ReportCard', { studentId: item.studentId })} variant="primary" icon="bar-chart-outline" iconPosition="left" />
                {!isActive && (
                  <LightButton label="Set as Active" onPress={() => handleSetActive(item)} variant="outline" icon="checkmark-outline" iconPosition="left" />
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
