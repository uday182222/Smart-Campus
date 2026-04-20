// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CalendarEvent } from '../models/CalendarModel';
import CalendarService from '../services/CalendarService';

const { width } = Dimensions.get('window');

interface ModernCalendarProps {
  onDateSelect?: (date: Date) => void;
  showEvents?: boolean;
  height?: number;
}

const ModernCalendar: React.FC<ModernCalendarProps> = ({
  onDateSelect,
  showEvents = true,
  height = 400,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const calendarEvents = await CalendarService.getEvents({
        dateFrom: startDate,
        dateTo: endDate,
      });
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const todayEvents = getEventsForDate(selectedDate);

  return (
    <View style={[styles.container, { height }]}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNames}>
        {dayNames.map((day, index) => (
          <Text key={index} style={styles.dayName}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              date && isToday(date) && styles.todayCell,
              date && isSelected(date) && styles.selectedCell,
            ]}
            onPress={() => date && handleDateSelect(date)}
            disabled={!date}
          >
            {date && (
              <>
                <Text style={[
                  styles.dayText,
                  isToday(date) && styles.todayText,
                  isSelected(date) && styles.selectedText,
                ]}>
                  {date.getDate()}
                </Text>
                {showEvents && getEventsForDate(date).length > 0 && (
                  <View style={styles.eventIndicator} />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Events for Selected Date */}
      {showEvents && todayEvents.length > 0 && (
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsTitle}>
            Events for {selectedDate.toLocaleDateString()}
          </Text>
          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {todayEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={[styles.eventColorBar, { backgroundColor: getEventColor(event.type) }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.allDay ? 'All Day' : `${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>📍 {event.location}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'class': return '#6366F1';
    case 'exam': return '#EF4444';
    case 'event': return '#10B981';
    case 'meeting': return '#F59E0B';
    case 'holiday': return '#8B5CF6';
    default: return '#6B7280';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  dayNames: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (width - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#6366F1',
  },
  selectedCell: {
    backgroundColor: '#E0E7FF',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#6366F1',
    fontWeight: 'bold',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  eventsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  eventsList: {
    maxHeight: 150,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  eventColorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ModernCalendar;
