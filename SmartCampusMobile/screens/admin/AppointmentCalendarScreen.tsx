// @ts-nocheck
/**
 * Appointment Calendar Screen
 * Visual calendar view for managing all appointments and availability
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Download, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react-native';
import { Agenda, Calendar } from 'react-native-calendars';

// Components
import TimeSlotModal from '../../components/appointment/TimeSlotModal';
import QuickRescheduleModal from '../../components/appointment/QuickRescheduleModal';

// Services
import AppointmentService, { AppointmentRequest, AvailabilitySlot } from '../../services/AppointmentService';
import { T } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface CalendarAppointment extends AppointmentRequest {
  timeSlot: string;
  color: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: CalendarAppointment;
  conflict?: boolean;
}

const AppointmentCalendarScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate, viewMode]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on view mode
      const startDate = new Date(selectedDate);
      let endDate = new Date(selectedDate);
      
      switch (viewMode) {
        case 'day':
          endDate = new Date(startDate);
          break;
        case 'week':
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          endDate = new Date(startDate);
          endDate.setMonth(startDate.getMonth() + 1);
          break;
      }

      const [appointmentsData, availabilityData] = await Promise.all([
        AppointmentService.getAppointmentsByDateRange(startDate, endDate),
        AppointmentService.getAvailabilitySlots('all', startDate, endDate),
      ]);

      // Process appointments
      const processedAppointments = appointmentsData
        .filter(apt => apt.status === 'approved')
        .map(apt => ({
          ...apt,
          timeSlot: apt.approvedTime || apt.requestedTime,
          color: getAppointmentColor(apt.assignedTo),
        })) as CalendarAppointment[];

      setAppointments(processedAppointments);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  };

  const getAppointmentColor = (assignedTo: string): string => {
    switch (assignedTo) {
      case 'principal': return '#9B59B6';
      case 'teacher': return '#3498DB';
      case 'counselor': return '#2ECC71';
      case 'admin': return '#E67E22';
      default: return '#95A5A6';
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    appointments.forEach(appointment => {
      const dateString = appointment.approvedDate?.toISOString().split('T')[0] || 
                        appointment.requestedDate.toISOString().split('T')[0];
      
      if (!marked[dateString]) {
        marked[dateString] = {
          marked: true,
          dots: [],
        };
      }
      
      marked[dateString].dots.push({
        key: appointment.id,
        color: appointment.color,
        selectedDotColor: appointment.color,
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

  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Check if there's an appointment at this time
        const appointment = appointments.find(apt => {
          const aptDate = apt.approvedDate?.toISOString().split('T')[0] || 
                         apt.requestedDate.toISOString().split('T')[0];
          return aptDate === selectedDate && apt.timeSlot === timeString;
        });

        // Check for conflicts (overlapping appointments)
        const conflicts = appointments.filter(apt => {
          const aptDate = apt.approvedDate?.toISOString().split('T')[0] || 
                         apt.requestedDate.toISOString().split('T')[0];
          if (aptDate !== selectedDate) return false;
          
          const aptTime = parseTime(apt.timeSlot);
          const slotTime = parseTime(timeString);
          const slotEndTime = slotTime + 30; // 30-minute slot
          const aptEndTime = aptTime + apt.duration;
          
          return (slotTime < aptEndTime && slotEndTime > aptTime);
        });

        // Check availability
        const isAvailable = availability.some(slot => {
          const slotDate = slot.date.toISOString().split('T')[0];
          const slotStartTime = parseTime(slot.startTime);
          const slotEndTime = parseTime(slot.endTime);
          const currentTime = parseTime(timeString);
          
          return slotDate === selectedDate && 
                 currentTime >= slotStartTime && 
                 currentTime < slotEndTime &&
                 slot.isAvailable;
        });

        slots.push({
          time: timeString,
          available: isAvailable && conflicts.length === 0,
          appointment,
          conflict: conflicts.length > 1,
        });
      }
    }
    
    return slots;
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTimeSlotPress = (slot: TimeSlot) => {
    if (slot.appointment) {
      setSelectedAppointment(slot.appointment);
      setSelectedTimeSlot(slot.time);
      setShowRescheduleModal(true);
    } else if (slot.available) {
      setSelectedTimeSlot(slot.time);
      setShowTimeSlotModal(true);
    } else {
      Alert.alert('Unavailable', 'This time slot is not available');
    }
  };

  const handleExportSchedule = async () => {
    try {
      const schedule = appointments.map(apt => ({
        date: apt.approvedDate?.toLocaleDateString() || apt.requestedDate.toLocaleDateString(),
        time: apt.timeSlot,
        duration: `${apt.duration} minutes`,
        parent: apt.parentName,
        student: apt.studentName,
        reason: apt.reason,
        assignedTo: apt.assignedPersonName || apt.assignedTo,
        notes: apt.notes || 'N/A',
      }));

      // In a real app, this would export to CSV or PDF
      console.log('Export Schedule:', JSON.stringify(schedule, null, 2));
      Alert.alert('Success', 'Schedule exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export schedule');
    }
  };

  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    
    return (
      <ScrollView style={styles.dayViewContainer}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderDate}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {timeSlots.map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.timeSlotCard,
              slot.appointment && styles.timeSlotBooked,
              slot.conflict && styles.timeSlotConflict,
              !slot.available && !slot.appointment && styles.timeSlotUnavailable,
            ]}
            onPress={() => handleTimeSlotPress(slot)}
          >
            <View style={styles.timeSlotTime}>
              <Text style={styles.timeSlotTimeText}>{formatTime(slot.time)}</Text>
              {slot.conflict && (
                <View style={styles.conflictBadge}>
                  <AlertTriangle size={12} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={styles.conflictBadgeText}>CONFLICT</Text>
                </View>
              )}
            </View>

            {slot.appointment ? (
              <View style={[styles.appointmentDetails, { borderLeftColor: slot.appointment.color }]}>
                <Text style={styles.appointmentParent}>{slot.appointment.parentName}</Text>
                <Text style={styles.appointmentStudent}>
                  {slot.appointment.studentName} - {slot.appointment.studentClass} {slot.appointment.studentSection}
                </Text>
                <Text style={styles.appointmentReason} numberOfLines={1}>
                  {slot.appointment.reason}
                </Text>
                <View style={styles.appointmentFooter}>
                  <View style={[styles.appointmentAssignee, { backgroundColor: slot.appointment.color }]}>
                    <Text style={styles.appointmentAssigneeText}>
                      {slot.appointment.assignedPersonName || slot.appointment.assignedTo}
                    </Text>
                  </View>
                  <Text style={styles.appointmentDuration}>{slot.appointment.duration} min</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>
                  {slot.available ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderWeekView = () => {
    // Group appointments by date
    const weekStart = new Date(selectedDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });

    return (
      <ScrollView horizontal style={styles.weekViewContainer}>
        {weekDays.map((date, index) => {
          const dateString = date.toISOString().split('T')[0];
          const dayAppointments = appointments.filter(apt => {
            const aptDate = apt.approvedDate?.toISOString().split('T')[0] || 
                           apt.requestedDate.toISOString().split('T')[0];
            return aptDate === dateString;
          });

          return (
            <View key={index} style={styles.weekDayColumn}>
              <View style={[
                styles.weekDayHeader,
                dateString === selectedDate && styles.weekDayHeaderSelected,
              ]}>
                <Text style={[
                  styles.weekDayName,
                  dateString === selectedDate && styles.weekDayNameSelected,
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.weekDayDate,
                  dateString === selectedDate && styles.weekDayDateSelected,
                ]}>
                  {date.getDate()}
                </Text>
              </View>

              <ScrollView style={styles.weekDayAppointments}>
                {dayAppointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={[styles.weekAppointmentCard, { borderLeftColor: appointment.color }]}
                    onPress={() => {
                      setSelectedAppointment(appointment);
                      setShowRescheduleModal(true);
                    }}
                  >
                    <Text style={styles.weekAppointmentTime}>{formatTime(appointment.timeSlot)}</Text>
                    <Text style={styles.weekAppointmentName} numberOfLines={1}>
                      {appointment.parentName}
                    </Text>
                    <Text style={styles.weekAppointmentDuration}>{appointment.duration}m</Text>
                  </TouchableOpacity>
                ))}
                {dayAppointments.length === 0 && (
                  <Text style={styles.weekNoAppointments}>No appointments</Text>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderMonthView = () => {
    return (
      <View style={styles.monthViewContainer}>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#4ECDC4',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#4ECDC4',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#4ECDC4',
            selectedDotColor: '#ffffff',
            arrowColor: '#4ECDC4',
            monthTextColor: '#2d4150',
            indicatorColor: '#4ECDC4',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13,
          }}
        />

        <View style={styles.monthAppointmentsContainer}>
          <Text style={styles.monthAppointmentsTitle}>
            Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
          <ScrollView style={styles.monthAppointmentsList}>
            {appointments
              .filter(apt => {
                const aptDate = apt.approvedDate?.toISOString().split('T')[0] || 
                               apt.requestedDate.toISOString().split('T')[0];
                return aptDate === selectedDate;
              })
              .map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.monthAppointmentCard, { borderLeftColor: appointment.color }]}
                  onPress={() => {
                    setSelectedAppointment(appointment);
                    setShowRescheduleModal(true);
                  }}
                >
                  <View style={styles.monthAppointmentTime}>
                    <Text style={styles.monthAppointmentTimeText}>
                      {formatTime(appointment.timeSlot)}
                    </Text>
                  </View>
                  <View style={styles.monthAppointmentDetails}>
                    <Text style={styles.monthAppointmentParent}>{appointment.parentName}</Text>
                    <Text style={styles.monthAppointmentStudent}>
                      {appointment.studentName} - {appointment.studentClass} {appointment.studentSection}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Appointment Calendar</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={handleExportSchedule}
            >
              <Download size={20} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeToggle}>
          {['day', 'week', 'month'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode(mode as any)}
            >
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === mode && styles.viewModeButtonTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9B59B6' }]} />
            <Text style={styles.legendText}>Principal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
            <Text style={styles.legendText}>Teacher</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2ECC71' }]} />
            <Text style={styles.legendText}>Counselor</Text>
          </View>
        </View>
      </View>

      {/* Calendar View */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading calendar...</Text>
          </View>
        ) : (
          <>
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <TimeSlotModal
        visible={showTimeSlotModal}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        onClose={() => setShowTimeSlotModal(false)}
        onAppointmentCreated={() => {
          setShowTimeSlotModal(false);
          loadCalendarData();
        }}
      />

      <QuickRescheduleModal
        visible={showRescheduleModal}
        appointment={selectedAppointment}
        onClose={() => setShowRescheduleModal(false)}
        onRescheduled={() => {
          setShowRescheduleModal(false);
          loadCalendarData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  viewModeContainer: {
    paddingHorizontal: T.px,
    paddingBottom: 12,
    backgroundColor: T.bg,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: T.card,
    borderRadius: 999,
    padding: 4,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  viewModeButtonActive: {
    backgroundColor: T.primary,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: T.textMuted,
  },
  viewModeButtonTextActive: {
    color: T.textWhite,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: T.textMuted,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: T.textMuted,
  },

  // Day View Styles
  dayViewContainer: {
    flex: 1,
    paddingHorizontal: T.px,
  },
  dayHeader: {
    marginBottom: 20,
  },
  dayHeaderDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: T.textDark,
  },
  timeSlotCard: {
    flexDirection: 'row',
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    ...T.shadowSm,
  },
  timeSlotBooked: {
    borderLeftWidth: 4,
  },
  timeSlotConflict: {
    backgroundColor: '#FFE5E5',
    borderColor: '#E74C3C',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  timeSlotTime: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timeSlotTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.primary,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    gap: 2,
  },
  conflictBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appointmentDetails: {
    flex: 1,
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  appointmentParent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  appointmentStudent: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 8,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentAssignee: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentAssigneeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
  },

  // Week View Styles
  weekViewContainer: {
    flex: 1,
  },
  weekDayColumn: {
    width: width / 7,
    minWidth: 100,
    paddingHorizontal: 4,
  },
  weekDayHeader: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  weekDayHeaderSelected: {
    backgroundColor: '#4ECDC4',
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  weekDayNameSelected: {
    color: '#FFF',
  },
  weekDayDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  weekDayDateSelected: {
    color: '#FFF',
  },
  weekDayAppointments: {
    flex: 1,
  },
  weekAppointmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  weekAppointmentTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  weekAppointmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  weekAppointmentDuration: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  weekNoAppointments: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },

  // Month View Styles
  monthViewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  monthAppointmentsContainer: {
    padding: 20,
  },
  monthAppointmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  monthAppointmentsList: {
    maxHeight: 300,
  },
  monthAppointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  monthAppointmentTime: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthAppointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  monthAppointmentDetails: {
    flex: 1,
  },
  monthAppointmentParent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  monthAppointmentStudent: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default AppointmentCalendarScreen;



