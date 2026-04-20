// @ts-nocheck
/**
 * Calendar Management Screen
 * Complete calendar and event management for admin users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Calendar as CalendarIcon, List, Plus, Search, ChevronRight, Users, GraduationCap, PartyPopper, Trophy, Briefcase, Sparkles } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';

// Components
import EventDetailsModal from '../../components/calendar/EventDetailsModal';
import AddEventModal from '../../components/calendar/AddEventModal';
import EventList from '../../components/calendar/EventList';

// Services
import CalendarService from '../../services/CalendarService';
import { T } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  type: 'holiday' | 'exam' | 'sports' | 'meeting' | 'celebration' | 'other';
  targetAudience: 'all' | 'parents' | 'teachers' | 'students' | 'specific-classes';
  location: string;
  posterUrl?: string;
  isAllDay: boolean;
  reminderSettings: {
    enabled: boolean;
    timing: number; // minutes before event
    channels: ('push' | 'whatsapp')[];
  };
  attendanceRequired: boolean;
  maxAttendees?: number;
  currentAttendees: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  classIds?: string[];
  createdBy: string;
}

interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

const CalendarManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Modal states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedType, selectedAudience, selectedDate, dateRange]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await CalendarService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedType);
    }

    // Filter by audience
    if (selectedAudience !== 'all') {
      filtered = filtered.filter(event => event.targetAudience === selectedAudience);
    }

    // Filter by date range
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    switch (dateRange) {
      case 'week':
        const weekStart = new Date(selectedDateObj);
        weekStart.setDate(selectedDateObj.getDate() - selectedDateObj.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        break;
      case 'month':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate.getMonth() === selectedDateObj.getMonth() &&
                 eventDate.getFullYear() === selectedDateObj.getFullYear();
        });
        break;
      case 'year':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate.getFullYear() === selectedDateObj.getFullYear();
        });
        break;
    }

    setFilteredEvents(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleDateSelect = (day: CalendarDay) => {
    setSelectedDate(day.dateString);
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleAddEvent = () => {
    setShowAddEvent(true);
  };

  const handleEventCreated = (newEvent: Event) => {
    setEvents(prev => [newEvent, ...prev]);
    Alert.alert('Success', 'Event created successfully');
  };

  const handleEventUpdated = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    Alert.alert('Success', 'Event updated successfully');
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    Alert.alert('Success', 'Event deleted successfully');
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    filteredEvents.forEach(event => {
      const dateString = new Date(event.startDate).toISOString().split('T')[0];
      if (!marked[dateString]) {
        marked[dateString] = {
          marked: true,
          dots: [],
        };
      }
      
      marked[dateString].dots.push({
        key: event.id,
        color: getEventTypeColor(event.type),
        selectedDotColor: getEventTypeColor(event.type),
      });
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#4ECDC4',
    };

    return marked;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return '#E74C3C';
      case 'exam': return '#9B59B6';
      case 'sports': return '#2ECC71';
      case 'meeting': return '#3498DB';
      case 'celebration': return '#F39C12';
      case 'other': return '#95A5A6';
      default: return '#4ECDC4';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday': return 'beach-access';
      case 'exam': return 'school';
      case 'sports': return 'sports';
      case 'meeting': return 'group';
      case 'celebration': return 'celebration';
      case 'other': return 'event';
      default: return 'event';
    }
  };

  const getEventsForSelectedDate = () => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === selectedDate;
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return filteredEvents
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  };

  return (
    <View style={styles.container}>
      {/* Header (flat) */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Calendar Management</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            >
              {viewMode === 'calendar' ? <List size={20} color={T.textDark} strokeWidth={1.8} /> : <CalendarIcon size={20} color={T.textDark} strokeWidth={1.8} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={handleAddEvent}
            >
              <Plus size={20} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={T.textPlaceholder}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {/* Event Type Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Type:</Text>
            {['all', 'holiday', 'exam', 'sports', 'meeting', 'celebration', 'other'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                {type === 'holiday' ? <Sparkles size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {type === 'exam' ? <GraduationCap size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {type === 'sports' ? <Trophy size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {type === 'meeting' ? <Briefcase size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {type === 'celebration' ? <PartyPopper size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {type === 'other' || type === 'all' ? <CalendarIcon size={16} color={selectedType === type ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedType === type && styles.filterButtonTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Audience Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Audience:</Text>
            {['all', 'parents', 'teachers', 'students', 'specific-classes'].map((audience) => (
              <TouchableOpacity
                key={audience}
                style={[
                  styles.filterButton,
                  selectedAudience === audience && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedAudience(audience)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedAudience === audience && styles.filterButtonTextActive,
                  ]}
                >
                  {audience === 'all' ? 'All' : audience.charAt(0).toUpperCase() + audience.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date Range Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Range:</Text>
            {['week', 'month', 'year'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.filterButton,
                  dateRange === range && styles.filterButtonActive,
                ]}
                onPress={() => setDateRange(range as any)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    dateRange === range && styles.filterButtonTextActive,
                  ]}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
      >
        {viewMode === 'calendar' ? (
          <>
            {/* Calendar */}
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: T.card,
                  calendarBackground: T.card,
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: T.primary,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: T.primary,
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: T.primary,
                  selectedDotColor: '#ffffff',
                  arrowColor: T.primary,
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: '#2d4150',
                  indicatorColor: T.primary,
                  textDayFontWeight: '300',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '300',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 13,
                }}
              />
            </View>

            {/* Selected Date Events */}
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateTitle}>
                Events for {new Date(selectedDate).toLocaleDateString()}
              </Text>
              {getEventsForSelectedDate().length === 0 ? (
                <Text style={styles.noEventsText}>No events for this date</Text>
              ) : (
                getEventsForSelectedDate().map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => handleEventPress(event)}
                  >
                    <View style={styles.eventTime}>
                      <Text style={styles.eventTimeText}>
                        {event.startTime} - {event.endTime}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    </View>
                    <View style={styles.eventType}>
                      <CalendarIcon size={20} color={getEventTypeColor(event.type)} strokeWidth={1.8} />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          /* List View */
          <EventList
            events={filteredEvents}
            onEventPress={handleEventPress}
            onEventDelete={handleEventDeleted}
            loading={loading}
          />
        )}

        {/* Upcoming Events */}
        <View style={styles.upcomingContainer}>
          <Text style={styles.upcomingTitle}>Upcoming Events</Text>
          {getUpcomingEvents().map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.upcomingEventCard}
              onPress={() => handleEventPress(event)}
            >
              <View style={styles.upcomingEventDate}>
                <Text style={styles.upcomingEventDay}>
                  {new Date(event.startDate).getDate()}
                </Text>
                <Text style={styles.upcomingEventMonth}>
                  {new Date(event.startDate).toLocaleDateString('en', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.upcomingEventInfo}>
                <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                <Text style={styles.upcomingEventTime}>
                  {event.startTime} - {event.endTime}
                </Text>
                <Text style={styles.upcomingEventLocation}>{event.location}</Text>
              </View>
              <ChevronRight size={20} color={T.textPlaceholder} strokeWidth={1.8} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modals */}
      <AddEventModal
        visible={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onEventCreated={handleEventCreated}
      />

      <EventDetailsModal
        visible={showEventDetails}
        event={selectedEvent}
        onClose={() => setShowEventDetails(false)}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  searchContainer: {
    paddingHorizontal: T.px,
    paddingBottom: 12,
    backgroundColor: T.bg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: T.textDark,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: T.textDark,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.card,
    gap: 4,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  filterButtonActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textMuted,
  },
  filterButtonTextActive: {
    color: T.textWhite,
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: T.card,
    marginHorizontal: T.px,
    marginTop: 12,
    borderRadius: T.radius.xxl,
    ...T.shadowSm,
  },
  selectedDateContainer: {
    marginHorizontal: T.px,
    marginTop: 0,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: T.textDark,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 14,
    color: T.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    marginBottom: 8,
    ...T.shadowSm,
  },
  eventTime: {
    width: 60,
    alignItems: 'center',
  },
  eventTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.primary,
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.textDark,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: T.textMuted,
  },
  eventType: {
    width: 40,
    alignItems: 'center',
  },
  upcomingContainer: {
    marginHorizontal: T.px,
    marginTop: 0,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: T.textDark,
    marginBottom: 12,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    marginBottom: 8,
    ...T.shadowSm,
  },
  upcomingEventDate: {
    width: 50,
    alignItems: 'center',
    backgroundColor: T.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  upcomingEventDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  upcomingEventMonth: {
    fontSize: 10,
    color: '#FFF',
  },
  upcomingEventInfo: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.textDark,
    marginBottom: 2,
  },
  upcomingEventTime: {
    fontSize: 12,
    color: T.primary,
    marginBottom: 2,
  },
  upcomingEventLocation: {
    fontSize: 12,
    color: T.textMuted,
  },
});

export default CalendarManagementScreen;
