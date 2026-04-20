/**
 * Bus Helper — Trip history (light theme).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Bus, Calendar, ChevronLeft, Clock, Users } from 'lucide-react-native';
import { apiClient } from '../../services/apiClient';
import { BusHelperFloatingNav } from '../../components/ui/BusHelperFloatingNav';
import { T } from '../../constants/theme';

const API = apiClient as any;

export default function TripHistoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack?.() ?? false;
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/bushelper/trips/history');
      const data = (res as any)?.data ?? res;
      setList(Array.isArray(data) ? data : data?.data ?? []);
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
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isCompleted = (item.status ?? '').toUpperCase() === 'COMPLETED';
    const borderColor = isCompleted ? T.success : T.danger;
    const stopsReached = item.stopsReached ?? item.reachedCount ?? 0;
    const skipped = item.stopsSkipped ?? item.skippedCount ?? 0;

    return (
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: T.card,
            borderRadius: T.radius.xxl,
            padding: 20,
            borderLeftWidth: 4,
            borderLeftColor: borderColor,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            ...T.shadowSm,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
              {item.routeName ?? item.route?.name ?? 'Trip'}
            </Text>
            <View
              style={{
                backgroundColor: isCompleted ? T.successTint : T.dangerTint,
                borderWidth: 1.5,
                borderColor: T.inputBorder,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: isCompleted ? T.success : T.danger, fontSize: 11, fontWeight: '900' }}>
                {isCompleted ? 'DONE' : 'CANCELLED'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginLeft: 6 }}>
                {item.date ?? (item.startedAt ? new Date(item.startedAt).toLocaleDateString() : '—')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.primary, fontWeight: '900', fontSize: 12, marginLeft: 6 }}>{item.duration ?? 0} min</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Users size={16} color={T.textPlaceholder} strokeWidth={1.8} />
              <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginLeft: 6 }}>{item.studentsBoarded ?? 0} boarded</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: T.primary, fontSize: 11, fontWeight: '900' }}>{stopsReached} stops reached</Text>
            </View>
            {skipped > 0 && (
              <View
                style={{
                  backgroundColor: T.warningTint,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: T.warning, fontSize: 11, fontWeight: '900' }}>{skipped} skipped</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={{ ...T.font.appTitle, color: T.textDark, flex: 1, textAlign: 'center' }}>Trip History</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              try {
                navigation.navigate('Profile');
              } catch (_e) {}
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: T.primary,
              alignItems: 'center',
              justifyContent: 'center',
              ...T.shadowSm,
            }}
          >
            <Text style={{ color: T.textWhite, fontWeight: '900' }}>{'BH'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: T.px }}>
        <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 22, marginTop: 4 }}>{list.length} Trips</Text>
        <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4, marginBottom: 12 }}>your complete history</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={T.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140, paddingTop: 6 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={34} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20, marginTop: 16, textAlign: 'center' }}>No trips yet</Text>
              <Text style={{ color: T.textMuted, fontSize: 13, fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
                Complete your first trip to see history
              </Text>
            </View>
          }
        />
      )}
      <BusHelperFloatingNav navigation={navigation} activeTab="TripHistory" />
    </SafeAreaView>
  );
}
