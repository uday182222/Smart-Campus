/**
 * Admin — School Events: calendar grid, selected date events, add/edit modal.
 * Dark + accent design. GET /events?month=&year=, POST/PATCH/DELETE /events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Pencil,
  Trash2,
  Star,
  Users,
  AlarmClock,
  FilePenLine,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LightButton, Pressable3D } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { T } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = SCREEN_WIDTH / 7 - 4;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_TYPES = ['HOLIDAY', 'EXAM', 'MEETING', 'EVENT', 'REMINDER'] as const;
const TYPE_COLORS: Record<string, string> = {
  HOLIDAY: '#EF4444',
  EXAM: '#3B82F6',
  MEETING: '#A855F7',
  EVENT: '#2B5CE6', // accent
  REMINDER: '#F59E0B',
};

interface SchoolEventRow {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string | null;
  type: string;
  createdBy?: string;
}

export default function EventsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const accent = T.primary;
  const primaryLight = T.primaryLight;
  const insets = useSafeAreaInsets();
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<SchoolEventRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEventRow | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date(),
    endDate: null as Date | null,
    multiDay: false,
    type: 'EVENT' as (typeof EVENT_TYPES)[number],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const month = viewMonth.getMonth() + 1;
  const year = viewMonth.getFullYear();

  const loadEvents = useCallback(async () => {
    try {
      const res = await apiClient.get('/events', { params: { month, year } });
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (_e) {
      setEvents([]);
    }
  }, [month, year]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = events.filter((e) => {
    const d = e.date.split('T')[0];
    if (d === selectedDateStr) return true;
    if (e.endDate) {
      const end = e.endDate.split('T')[0];
      return selectedDateStr >= d && selectedDateStr <= end;
    }
    return false;
  });

  // Calendar grid: first day of month, padding for week start
  const first = new Date(year, month - 1, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: { day: number | null; date: Date | null }[] = [];
  for (let i = 0; i < startPad; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month - 1, d) });
  }
  const datesWithEvents = new Set(events.map((e) => e.date.split('T')[0]));

  const isToday = (d: Date | null) =>
    d && d.toDateString() === new Date().toDateString();
  const isSelected = (d: Date | null) =>
    d && d.toDateString() === selectedDate.toDateString();
  const hasEvents = (d: Date | null) =>
    d && datesWithEvents.has(d.toISOString().split('T')[0]);

  const openAdd = () => {
    setEditingEvent(null);
    setForm({
      title: '',
      description: '',
      date: new Date(selectedDate),
      endDate: null,
      multiDay: false,
      type: 'EVENT',
    });
    setModalVisible(true);
  };

  const openEdit = (ev: SchoolEventRow) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      date: new Date(ev.date + 'T12:00:00'),
      endDate: ev.endDate ? new Date(ev.endDate + 'T12:00:00') : null,
      multiDay: !!ev.endDate,
      type: (ev.type in TYPE_COLORS ? ev.type : 'EVENT') as (typeof EVENT_TYPES)[number],
    });
    setModalVisible(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        date: form.date.toISOString().split('T')[0],
        endDate: form.multiDay && form.endDate ? form.endDate.toISOString().split('T')[0] : undefined,
        type: form.type,
      };
      if (editingEvent) {
        await apiClient.patch(`/events/${editingEvent.id}`, payload);
        Alert.alert('Success', 'Event updated');
      } else {
        await apiClient.post('/events', payload);
        Alert.alert('Success', 'Event created');
      }
      setModalVisible(false);
      loadEvents();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = (ev: SchoolEventRow) => {
    Alert.alert('Delete Event', `Delete "${ev.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/events/${ev.id}`);
            loadEvents();
          } catch (_e) {
            Alert.alert('Error', 'Failed to delete');
          }
        },
      },
    ]);
  };

  let DateTimePicker: any = null;
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (_) {}

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }} numberOfLines={1}>
              {theme.schoolName || 'Admin'}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>School Events</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('Notifications');
                } catch (_e) {}
              }}
            >
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => {
                try {
                  navigation.navigate('AdminProfile');
                } catch (_e) {}
              }}
            >
              <Text style={{ color: T.textWhite, fontWeight: '900' }}>{(theme.schoolName || 'A').charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 14,
            backgroundColor: T.card,
            borderRadius: T.radius.xxl,
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderWidth: 1.5,
            borderColor: T.inputBorder,
            ...T.shadowSm,
          }}
        >
          <TouchableOpacity
            onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: T.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} color={T.primary} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={{ flex: 1, color: T.textDark, fontSize: 16, fontWeight: '900', textAlign: 'center' }}>{monthLabel}</Text>
          <TouchableOpacity
            onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: T.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight size={20} color={T.primary} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.px, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar grid */}
        <View style={{ marginTop: 4, backgroundColor: T.card, borderRadius: T.radius.xxl, padding: 16, ...T.shadowSm }}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAYS.map((d) => (
              <View key={d} style={{ width: CELL_SIZE + 4, alignItems: 'center' }}>
                <Text style={{ color: T.textMuted, fontSize: 11, fontStyle: 'italic' }}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((cell, i) => {
              const evsOnDay = cell.date
                ? events.filter((e) => {
                    const d = e.date.split('T')[0];
                    const same = d === cell.date!.toISOString().split('T')[0];
                    const inRange =
                      e.endDate &&
                      cell.date &&
                      cell.date.toISOString().split('T')[0] >= d &&
                      cell.date.toISOString().split('T')[0] <= e.endDate.split('T')[0];
                    return same || inRange;
                  })
                : [];
              const typeColor =
                evsOnDay.length > 0
                  ? TYPE_COLORS[evsOnDay[0].type] ?? accent
                  : 'transparent';
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => cell.date && setSelectedDate(cell.date)}
                  style={{
                    width: CELL_SIZE + 4,
                    aspectRatio: 1,
                    padding: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      width: '100%',
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected(cell.date)
                        ? primaryLight
                        : isToday(cell.date)
                          ? T.primary
                          : hasEvents(cell.date)
                            ? T.card
                            : 'transparent',
                      borderWidth: isSelected(cell.date) ? 2 : 0,
                      borderColor: isSelected(cell.date) ? T.primary : 'transparent',
                    }}
                  >
                    {cell.day != null ? (
                      <>
                        <Text
                          style={{
                            color: isSelected(cell.date)
                              ? T.textDark
                              : isToday(cell.date)
                                ? T.textWhite
                                : T.textDark,
                            fontWeight: '900',
                            fontSize: 13,
                          }}
                        >
                          {cell.day}
                        </Text>
                        {evsOnDay.length > 0 && (
                          <View
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: typeColor,
                              marginTop: 2,
                            }}
                          />
                        )}
                      </>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected date events */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: T.textDark, fontSize: 18, fontWeight: '900', flex: 1 }}>
            {selectedDate.getDate()} {selectedDate.toLocaleDateString(undefined, { month: 'short' })}
          </Text>
          <LightButton
            label="Add Event"
            variant="primary"
            icon="add-circle-outline"
            iconPosition="left"
            fullWidth={false}
            onPress={openAdd}
          />
        </View>

        {selectedDayEvents.length === 0 ? (
          <View
            style={{
              backgroundColor: T.card,
              borderRadius: T.radius.xxl,
              padding: 16,
              marginTop: 8,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: T.inputBorder,
              ...T.shadowSm,
            }}
          >
            <Text style={{ color: T.textMuted, fontSize: 14, fontStyle: 'italic' }}>
              No events on this day
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
              tap Add Event to create one
            </Text>
          </View>
        ) : (
          selectedDayEvents.map((ev) => {
            const typeColor = TYPE_COLORS[ev.type] ?? accent;
            return (
              <Pressable3D key={ev.id}>
                <View
                  style={{
                    backgroundColor: T.card,
                    borderRadius: T.radius.xxl,
                    padding: 16,
                    marginBottom: 8,
                    marginTop: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: typeColor,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    borderWidth: 1.5,
                    borderColor: T.inputBorder,
                    ...T.shadowSm,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: typeColor + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {ev.type === 'HOLIDAY' ? <Calendar size={18} color={typeColor} strokeWidth={1.8} /> : null}
                    {ev.type === 'EXAM' ? <FilePenLine size={18} color={typeColor} strokeWidth={1.8} /> : null}
                    {ev.type === 'MEETING' ? <Users size={18} color={typeColor} strokeWidth={1.8} /> : null}
                    {ev.type === 'EVENT' ? <Star size={18} color={typeColor} strokeWidth={1.8} /> : null}
                    {ev.type === 'REMINDER' ? <AlarmClock size={18} color={typeColor} strokeWidth={1.8} /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: T.textDark, fontWeight: '900', fontSize: 16 }}>
                      {ev.title}
                    </Text>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        backgroundColor: typeColor + '26',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: typeColor, fontSize: 11, fontWeight: '900' }}>
                        {ev.type}
                      </Text>
                    </View>
                    {ev.description ? (
                      <Text
                        style={{
                          color: T.textMuted,
                          fontSize: 13,
                          fontStyle: 'italic',
                          marginTop: 8,
                        }}
                        numberOfLines={2}
                      >
                        {ev.description}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => openEdit(ev)}
                    style={{ padding: 8, marginRight: 4 }}
                  >
                    <Pencil size={18} color={T.primary} strokeWidth={1.8} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEvent(ev)} style={{ padding: 8 }}>
                    <Trash2 size={18} color={T.danger} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
              </Pressable3D>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: T.bg,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: 40,
                ...T.shadowLg,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#E2E8F0',
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              />
              <Text style={{ color: T.textDark, fontSize: 24, fontWeight: '900' }}>
                {editingEvent ? 'Edit Event' : 'New Event'}
              </Text>

              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 16, textTransform: 'uppercase' }}>
                Title
              </Text>
              <TextInput
                value={form.title}
                onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
                placeholder="Event title"
                placeholderTextColor={T.textPlaceholder}
                style={{
                  backgroundColor: T.card,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: T.textDark,
                  fontSize: 16,
                  marginTop: 6,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              />

              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 12, textTransform: 'uppercase' }}>
                Description (optional)
              </Text>
              <TextInput
                value={form.description}
                onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
                placeholder="Description"
                placeholderTextColor={T.textPlaceholder}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: T.card,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: T.textDark,
                  fontSize: 16,
                  marginTop: 6,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              />

              <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 12, textTransform: 'uppercase' }}>
                Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: T.card,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginTop: 6,
                  borderWidth: 1.5,
                  borderColor: T.inputBorder,
                }}
              >
                <Calendar size={20} color={T.primary} strokeWidth={1.8} />
                <Text style={{ color: T.textDark, fontSize: 16, marginLeft: 12 }}>
                  {form.date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <ChevronRight size={20} color={T.textPlaceholder} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={form.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e: any, d?: Date) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) setForm((f) => ({ ...f, date: d }));
                  }}
                />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <Switch
                  value={form.multiDay}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      multiDay: v,
                      endDate: v ? new Date(f.date) : null,
                    }))
                  }
                  trackColor={{ false: '#E2E8F0', true: accent }}
                  thumbColor="#FFFFFF"
                />
                <Text style={{ color: '#94A3B8', fontSize: 14, marginLeft: 8 }}>
                  Multi-day event?
                </Text>
              </View>
              {form.multiDay && (
                <>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 8, textTransform: 'uppercase' }}>
                    End date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(true)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: T.card,
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginTop: 6,
                      borderWidth: 1.5,
                      borderColor: T.inputBorder,
                    }}
                  >
                    <Calendar size={20} color={T.primary} strokeWidth={1.8} />
                    <Text style={{ color: T.textDark, fontSize: 16, marginLeft: 12 }}>
                      {form.endDate
                        ? form.endDate.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Select end date'}
                    </Text>
                    <ChevronRight size={20} color={T.textPlaceholder} strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                  {showEndDatePicker && DateTimePicker && (
                    <DateTimePicker
                      value={form.endDate || form.date}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(e: any, d?: Date) => {
                        if (Platform.OS === 'android') setShowEndDatePicker(false);
                        if (d) setForm((f) => ({ ...f, endDate: d }));
                      }}
                    />
                  )}
                </>
              )}

              <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 12, textTransform: 'uppercase' }}>
                Type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
                {EVENT_TYPES.map((t) => {
                  const active = form.type === t;
                  const typeColor = TYPE_COLORS[t] ?? accent;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        backgroundColor: active ? typeColor + '28' : T.card,
                        paddingHorizontal: 12,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: 1.5,
                        borderColor: active ? typeColor : T.inputBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: active ? typeColor : T.textMuted,
                          fontWeight: active ? '900' : '700',
                          fontSize: 12,
                        }}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <LightButton
                label="Save Event"
                variant="primary"
                icon="checkmark-circle-outline"
                iconPosition="left"
                onPress={saveEvent}
                loading={saving}
                style={{ marginTop: 24 }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
