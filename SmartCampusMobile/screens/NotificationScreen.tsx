/**
 * Smart Campus - Notifications (NativeWind)
 * AppHeader, filter chips, list with unread highlight, tap to mark read, empty state.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/ui';
import apiClient from '../services/apiClient';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

const FILTERS = ['All', 'Unread', 'Homework', 'Attendance', 'Fees'];
const ICON_BY_TYPE: Record<string, keyof typeof Ionicons.glyphMap> = {
  homework: 'document-text-outline',
  attendance: 'calendar-outline',
  fees: 'card-outline',
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const NotificationScreen: React.FC = () => {
  const { userData } = useAuth();
  const navigation = useNavigation<any>();
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const userId = (userData as any)?.userId ?? (userData as any)?.id ?? '';

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const res = await apiClient.get<{ data: any }>(`/notifications/${userId}`);
      const data = (res as any).data;
      setList(Array.isArray(data) ? data : (data?.notifications ?? []));
    } catch (e) {
      setList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markRead = async (notificationId: string) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setList((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (e) {}
  };

  const filtered =
    filter === 'Unread' ? list.filter((n) => !n.read) : filter !== 'All' ? list.filter((n) => (n.type || '').toLowerCase().includes(filter.toLowerCase())) : list;

  const getIcon = (item: NotificationItem) => ICON_BY_TYPE[(item.type || '').toLowerCase()] ?? 'notifications-outline';

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Notifications" showBack onBackPress={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text className="text-muted mt-3">Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Notifications" showBack onBackPress={() => navigation.goBack()} />
      <View className="px-5 mt-2">
        <View className="flex-row flex-wrap gap-2">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 ${filter === f ? 'bg-primary' : 'bg-white border border-gray-200'}`}
            >
              <Text className={`text-sm font-medium ${filter === f ? 'text-white' : 'text-muted'}`}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Ionicons name="notifications-off-outline" size={32} color="#6B7280" />
            </View>
            <Text className="text-lg font-semibold text-dark">No notifications</Text>
            <Text className="text-muted mt-1">You're all caught up</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.read && markRead(item.id)}
            className={`rounded-2xl p-4 mb-3 flex-row ${item.read ? 'bg-white' : 'bg-primary-light'} ${!item.read ? 'border-l-4 border-primary' : ''}`}
            style={item.read ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 } : {}}
          >
            <View className="w-10 h-10 rounded-xl bg-pastel-blue items-center justify-center mr-3">
              <Ionicons name={getIcon(item)} size={20} color="#1E40AF" />
            </View>
            <View className="flex-1">
              <Text className={`text-base ${item.read ? 'font-normal text-dark' : 'font-bold text-dark'}`} numberOfLines={1}>
                {item.title ?? item.message ?? 'Notification'}
              </Text>
              <Text className="text-muted text-sm mt-0.5" numberOfLines={2}>
                {item.message ?? ''}
              </Text>
              <Text className="text-xs text-muted mt-1">{timeAgo(item.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;
