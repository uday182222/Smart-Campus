/**
 * Admin — Transport management: create/edit/delete routes.
 * Uses the same transport API family as the bus helper portal (via apiClient).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Bus, User as UserIcon, MapPin, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { T } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/apiClient';
import { AdminFloatingNav } from '../../components/ui/AdminFloatingNav';

const API = apiClient as any;

type RouteStopInput = { name: string; order: number };
type RouteRow = {
  id: string;
  name: string;
  busNumber?: string | null;
  driverName?: string | null;
  status?: string | null;
  stops?: Array<{ id?: string; name: string; order?: number }>;
  students?: any[];
  studentCount?: number;
};

export default function TransportManagementScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Access restricted to Admin only.</Text>
      </View>
    );
  }

  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<RouteRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [routeName, setRouteName] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [stops, setStops] = useState<RouteStopInput[]>([{ name: '', order: 1 }]);

  const loadRoutes = useCallback(async () => {
    try {
      const res = await API.get('/transport/routes');
      const data = (res as any)?.data ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? data?.routes ?? [];
      setRoutes(Array.isArray(list) ? list : []);
    } catch (_e) {
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadRoutes();
  }, [loadRoutes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  const openCreate = () => {
    setEditing(null);
    setRouteName('');
    setBusNumber('');
    setDriverName('');
    setStops([{ name: '', order: 1 }]);
    setModalVisible(true);
  };

  const openEdit = (r: RouteRow) => {
    setEditing(r);
    setRouteName(r.name ?? '');
    setBusNumber(String(r.busNumber ?? ''));
    setDriverName(String(r.driverName ?? ''));
    const existingStops = Array.isArray(r.stops) ? r.stops : [];
    setStops(
      existingStops.length
        ? existingStops
            .map((s, idx) => ({ name: String(s.name ?? ''), order: Number(s.order ?? idx + 1) }))
            .sort((a, b) => a.order - b.order)
        : [{ name: '', order: 1 }],
    );
    setModalVisible(true);
  };

  const statusColor = (s?: string | null) => ((s ?? '').toLowerCase() === 'active' ? T.success : T.textMuted);
  const statusLabel = (s?: string | null) => ((s ?? '').toLowerCase() === 'active' ? 'Active' : 'Inactive');

  const normalizeStopsPayload = (rows: RouteStopInput[]) =>
    rows
      .map((s, i) => ({ name: s.name.trim(), order: Number.isFinite(Number(s.order)) ? Number(s.order) : i + 1 }))
      .filter((s) => s.name.length > 0)
      .sort((a, b) => a.order - b.order);

  const handleSave = async () => {
    if (!routeName.trim()) {
      Alert.alert('Required', 'Route name is required.');
      return;
    }

    const payload = {
      name: routeName.trim(),
      busNumber: busNumber.trim() || undefined,
      driverName: driverName.trim() || undefined,
      stops: normalizeStopsPayload(stops),
    };

    if (!payload.stops.length) {
      Alert.alert('Required', 'Add at least one stop.');
      return;
    }

    setSaving(true);
    try {
      if (editing?.id) {
        await API.put(`/transport/routes/${encodeURIComponent(String(editing.id))}`, payload);
      } else {
        await API.post('/transport/routes', payload);
      }
      await loadRoutes();
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to save route.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing?.id) return;
    Alert.alert('Delete Route', 'Are you sure you want to delete this route? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await API.delete(`/transport/routes/${encodeURIComponent(String(editing.id))}`);
            await loadRoutes();
            setModalVisible(false);
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to delete route.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const totalRoutes = routes.length;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
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
          <Text style={{ fontSize: 20, fontWeight: '800', color: T.textDark }}>Transport</Text>
        </View>
        <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 6, marginLeft: 56 }}>{totalRoutes} routes</Text>
      </View>

      {/* Route list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
      >
        {loading ? (
          <Text style={{ color: T.textMuted, marginTop: 8 }}>Loading…</Text>
        ) : routes.length === 0 ? (
          <View style={{ backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 24, alignItems: 'center', marginTop: 4, ...T.shadowSm }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={34} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '800', marginTop: 16 }}>No routes yet</Text>
            <Text style={{ color: T.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Create your first route to get started</Text>
          </View>
        ) : (
          routes.map((r) => {
            const stopsCount = Array.isArray(r.stops) ? r.stops.length : 0;
            const studentsCount = Number(r.studentCount ?? (Array.isArray(r.students) ? r.students.length : 0) ?? 0);
            return (
              <TouchableOpacity
                key={r.id}
                activeOpacity={0.85}
                onPress={() => {
                  setSelectedRoute(r);
                  setDetailModalVisible(true);
                }}
                onLongPress={() => openEdit(r)}
                style={{
                  backgroundColor: T.card,
                  borderRadius: T.radius.xxl,
                  padding: 16,
                  marginBottom: 12,
                  ...T.shadowSm,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: T.textDark }} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }} numberOfLines={1}>
                      Bus {r.busNumber ?? (r as any).vehicleNumber ?? (r as any).bus ?? '—'}
                    </Text>
                    <Text style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }} numberOfLines={1}>
                      Driver {r.driverName ?? (r as any).driver?.name ?? (r as any).conductorName ?? '—'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: statusColor(r.status) }}>{statusLabel(r.status)}</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ color: T.primary, fontSize: 11, fontWeight: '800' }}>{stopsCount} stops</Text>
                  </View>
                  <View style={{ alignSelf: 'flex-start', backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ color: T.primary, fontSize: 11, fontWeight: '800' }}>{studentsCount} students</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={detailModalVisible} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setDetailModalVisible(false)}
        >
          <Pressable style={{ backgroundColor: T.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' }}>
            <View style={{ width: 40, height: 4, backgroundColor: T.inputBorder, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            <Text style={{ fontSize: 20, fontWeight: '900', color: T.textDark }}>{selectedRoute?.name}</Text>
            <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
              {selectedRoute?.busNumber ?? '—'} · {selectedRoute?.driverName ?? '—'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1, backgroundColor: T.primaryLight, borderRadius: T.radius.lg, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: T.primary }}>{selectedRoute?.stops?.length ?? 0}</Text>
                <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Stops</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: T.primaryLight, borderRadius: T.radius.lg, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: T.primary }}>{selectedRoute?.studentCount ?? 0}</Text>
                <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Students</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: selectedRoute?.isActive ? T.successTint : T.primaryLight, borderRadius: T.radius.lg, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: selectedRoute?.isActive ? T.success : T.textMuted }}>
                  {selectedRoute?.isActive ? 'Active' : 'Inactive'}
                </Text>
                <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Status</Text>
              </View>
            </View>

            <Text style={{ fontSize: 15, fontWeight: '700', color: T.textDark, marginTop: 20, marginBottom: 12 }}>Stops</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              {(selectedRoute?.stops ?? [])
                .sort((a: any, b: any) => (a.order ?? a.stopOrder ?? 0) - (b.order ?? b.stopOrder ?? 0))
                .map((stop: any, index: number, arr: any[]) => (
                  <View key={stop.id ?? index} style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                    <View style={{ alignItems: 'center', width: 20 }}>
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: index === 0 || index === arr.length - 1 ? T.primary : T.card,
                          borderWidth: 2,
                          borderColor: T.primary,
                          marginTop: 4,
                        }}
                      />
                      {index < arr.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: T.inputBorder, marginVertical: 2 }} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <Text style={{ fontSize: 13, fontWeight: index === 0 || index === arr.length - 1 ? '700' : '500', color: T.textDark }}>
                        {stop.name ?? stop.stopName ?? stop.locationName ?? `Stop ${index + 1}`}
                      </Text>
                      {stop.arrivalTime && <Text style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{stop.arrivalTime}</Text>}
                    </View>
                  </View>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: T.primary, borderRadius: T.radius.full, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => {
                  setDetailModalVisible(false);
                  setTimeout(() => {
                    if (selectedRoute) openEdit(selectedRoute);
                  }, 300);
                }}
              >
                <Text style={{ color: T.textWhite, fontWeight: '700', fontSize: 14 }}>Edit Route</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, borderWidth: 1.5, borderColor: T.inputBorder, borderRadius: T.radius.full, paddingVertical: 14, alignItems: 'center' }}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={{ color: T.textDark, fontWeight: '700', fontSize: 14 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        onPress={openCreate}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          elevation: 10,
          shadowColor: T.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Plus size={24} color={T.textWhite} strokeWidth={1.8} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setModalVisible(false)}>
          <Pressable
            style={{
              backgroundColor: T.bg,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '92%',
            }}
            onPress={() => {}}
          >
            <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 20 }}>{editing ? 'Edit Route' : 'New Route'}</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
              {editing ? 'Update route details' : 'Create a bus route for your school'}
            </Text>

            <View style={{ marginTop: 16 }}>
              {[
                { label: 'Route Name', value: routeName, onChange: setRouteName, placeholder: 'e.g. North Zone Route' },
                { label: 'Bus Number', value: busNumber, onChange: setBusNumber, placeholder: 'e.g. DL-01-AB-1234' },
                { label: 'Driver Name', value: driverName, onChange: setDriverName, placeholder: 'e.g. Ramesh Kumar' },
              ].map((f) => (
                <View key={f.label} style={{ marginBottom: 12 }}>
                  <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 }}>{f.label.toUpperCase()}</Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor={T.textPlaceholder}
                    style={{
                      backgroundColor: T.card,
                      borderRadius: T.radius.lg,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      color: T.textDark,
                    }}
                  />
                </View>
              ))}

              <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>STOPS</Text>
              {stops.map((s, idx) => (
                <View key={idx} style={{ backgroundColor: T.card, borderRadius: T.radius.lg, borderWidth: 1.5, borderColor: T.inputBorder, padding: 12, marginBottom: 10 }}>
                  <Text style={{ color: T.textMuted, fontSize: 12, fontWeight: '800' }}>Stop {idx + 1}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TextInput
                      value={s.name}
                      onChangeText={(t) =>
                        setStops((prev) => prev.map((p, i) => (i === idx ? { ...p, name: t } : p)))
                      }
                      placeholder="Stop name"
                      placeholderTextColor={T.textPlaceholder}
                      style={{
                        flex: 1,
                        backgroundColor: T.bg,
                        borderRadius: T.radius.lg,
                        borderWidth: 1.5,
                        borderColor: T.inputBorder,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: T.textDark,
                      }}
                    />
                    <TextInput
                      value={String(s.order)}
                      onChangeText={(t) =>
                        setStops((prev) => prev.map((p, i) => (i === idx ? { ...p, order: Number(t || 0) } : p)))
                      }
                      placeholder="Order"
                      placeholderTextColor={T.textPlaceholder}
                      keyboardType="number-pad"
                      style={{
                        width: 90,
                        backgroundColor: T.bg,
                        borderRadius: T.radius.lg,
                        borderWidth: 1.5,
                        borderColor: T.inputBorder,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        color: T.textDark,
                        textAlign: 'center',
                      }}
                    />
                  </View>
                  {stops.length > 1 ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setStops((prev) => prev.filter((_, i) => i !== idx))}
                      style={{ alignSelf: 'flex-end', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={16} color={T.danger} strokeWidth={1.8} />
                      <Text style={{ color: T.danger, fontWeight: '800' }}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setStops((prev) => [...prev, { name: '', order: prev.length + 1 }])}
                style={{
                  height: 46,
                  borderRadius: T.radius.full,
                  backgroundColor: T.primaryLight,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 4,
                }}
              >
                <Text style={{ color: T.primary, fontWeight: '900' }}>Add Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                disabled={saving}
                style={{
                  height: 48,
                  borderRadius: T.radius.full,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 14,
                  opacity: saving ? 0.7 : 1,
                  ...T.shadowSm,
                }}
              >
                <Text style={{ color: T.textWhite, fontWeight: '900' }}>{saving ? 'Saving…' : editing ? 'Update Route' : 'Create Route'}</Text>
              </TouchableOpacity>

              {editing ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDelete}
                  disabled={saving}
                  style={{
                    height: 48,
                    borderRadius: T.radius.full,
                    backgroundColor: T.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: T.textWhite, fontWeight: '900' }}>Delete Route</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity activeOpacity={0.85} onPress={() => setModalVisible(false)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: T.textMuted, fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AdminFloatingNav navigation={navigation} activeTab="TransportManagement" />
    </View>
  );
}
