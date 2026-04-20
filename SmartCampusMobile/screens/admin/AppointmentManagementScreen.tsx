// @ts-nocheck
/**
 * Appointment Management Screen
 * Complete appointment request management for admin users
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
import {
  Bell,
  Search,
  CalendarClock,
  Clock,
  User,
  Phone,
  Eye,
  Pencil,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react-native';
import { T } from '../../constants/theme';

// Components
import AppointmentDetailsModal from '../../components/appointment/AppointmentDetailsModal';
import ProcessAppointmentModal from '../../components/appointment/ProcessAppointmentModal';
import AvailabilityModal from '../../components/appointment/AvailabilityModal';

// Services
import AppointmentService from '../../services/AppointmentService';

const { width } = Dimensions.get('window');

interface AppointmentRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentSection: string;
  requestedDate: Date;
  requestedTime: string;
  duration: number; // minutes
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';
  assignedTo: 'principal' | 'teacher' | 'counselor' | 'admin';
  assignedPersonId?: string;
  assignedPersonName?: string;
  approvedDate?: Date;
  approvedTime?: string;
  rejectionReason?: string;
  rescheduleReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface AvailabilitySlot {
  id: string;
  personId: string;
  personName: string;
  personType: 'principal' | 'teacher' | 'counselor' | 'admin';
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

const AppointmentManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  
  // Modal states
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, selectedStatus, selectedPriority, selectedAssignee, sortBy]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await AppointmentService.getAllAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(appointment =>
        appointment.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.assignedPersonName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === selectedStatus);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(appointment => appointment.priority === selectedPriority);
    }

    // Filter by assignee
    if (selectedAssignee !== 'all') {
      filtered = filtered.filter(appointment => appointment.assignedTo === selectedAssignee);
    }

    // Sort appointments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredAppointments(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleAppointmentPress = (appointment: AppointmentRequest) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleProcessPress = (appointment: AppointmentRequest) => {
    setSelectedAppointment(appointment);
    setShowProcessModal(true);
  };

  const handleAvailabilityPress = () => {
    setShowAvailabilityModal(true);
  };

  const handleAppointmentProcessed = (updatedAppointment: AppointmentRequest) => {
    setAppointments(prev => prev.map(appointment => 
      appointment.id === updatedAppointment.id ? updatedAppointment : appointment
    ));
    Alert.alert('Success', 'Appointment processed successfully');
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'reschedule', appointmentIds: string[], data?: any) => {
    try {
      switch (action) {
        case 'approve':
          await AppointmentService.bulkApproveAppointments(appointmentIds, data);
          break;
        case 'reject':
          await AppointmentService.bulkRejectAppointments(appointmentIds, data.reason);
          break;
        case 'reschedule':
          await AppointmentService.bulkRescheduleAppointments(appointmentIds, data);
          break;
      }
      await loadAppointments();
      Alert.alert('Success', 'Bulk action completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to perform bulk action');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#E74C3C';
      case 'high': return '#F39C12';
      case 'medium': return '#3498DB';
      case 'low': return '#2ECC71';
      default: return '#95A5A6';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'warning';
      case 'high': return 'priority-high';
      case 'medium': return 'remove';
      case 'low': return 'keyboard-arrow-down';
      default: return 'help';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'approved': return '#2ECC71';
      case 'rejected': return '#E74C3C';
      case 'rescheduled': return '#3498DB';
      case 'completed': return '#9B59B6';
      case 'cancelled': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'approved': return 'check-circle';
      case 'rejected': return 'cancel';
      case 'rescheduled': return 'update';
      case 'completed': return 'done';
      case 'cancelled': return 'close';
      default: return 'help';
    }
  };

  const getAssigneeIcon = (assignee: string) => {
    switch (assignee) {
      case 'principal': return 'person';
      case 'teacher': return 'school';
      case 'counselor': return 'psychology';
      case 'admin': return 'admin-panel-settings';
      default: return 'person';
    }
  };

  const getPendingCount = () => {
    return appointments.filter(appointment => appointment.status === 'pending').length;
  };

  const getUrgentCount = () => {
    return appointments.filter(appointment => appointment.priority === 'urgent' && appointment.status === 'pending').length;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Appointment Management</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
              onPress={handleAvailabilityPress}
            >
              <CalendarClock size={20} color={T.textWhite} strokeWidth={1.8} />
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
            placeholder="Search appointments..."
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
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['all', 'pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                {status === 'approved' ? <CheckCircle2 size={16} color={selectedStatus === status ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {status === 'rejected' ? <XCircle size={16} color={selectedStatus === status ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {status === 'pending' ? <Clock size={16} color={selectedStatus === status ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Priority:</Text>
            {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.filterButton,
                  selectedPriority === priority && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedPriority(priority)}
              >
                {priority === 'urgent' ? <AlertTriangle size={16} color={selectedPriority === priority ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {priority === 'high' ? <ArrowUp size={16} color={selectedPriority === priority ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {priority === 'medium' ? <Minus size={16} color={selectedPriority === priority ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                {priority === 'low' ? <ArrowDown size={16} color={selectedPriority === priority ? T.textWhite : T.textMuted} strokeWidth={1.8} /> : null}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedPriority === priority && styles.filterButtonTextActive,
                  ]}
                >
                  {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Assignee Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Assignee:</Text>
            {['all', 'principal', 'teacher', 'counselor', 'admin'].map((assignee) => (
              <TouchableOpacity
                key={assignee}
                style={[
                  styles.filterButton,
                  selectedAssignee === assignee && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedAssignee(assignee)}
              >
                <User size={16} color={selectedAssignee === assignee ? T.textWhite : T.textMuted} strokeWidth={1.8} />
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedAssignee === assignee && styles.filterButtonTextActive,
                  ]}
                >
                  {assignee === 'all' ? 'All' : assignee.charAt(0).toUpperCase() + assignee.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort Filter */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort:</Text>
            {['date', 'priority', 'status'].map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.filterButton,
                  sortBy === sort && styles.filterButtonActive,
                ]}
                onPress={() => setSortBy(sort as any)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    sortBy === sort && styles.filterButtonTextActive,
                  ]}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getPendingCount()}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#E74C3C' }]}>{getUrgentCount()}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {appointments.filter(a => a.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.appointmentsContainer}
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
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
              <CalendarClock size={34} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No Appointments Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'No appointment requests at the moment'}
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.parentName}>{appointment.parentName}</Text>
                  <Text style={styles.studentInfo}>
                    {appointment.studentName} - {appointment.studentClass} {appointment.studentSection}
                  </Text>
                </View>
                <View style={styles.appointmentBadges}>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(appointment.priority) }]}>
                    <AlertTriangle size={12} color={T.textWhite} strokeWidth={1.8} />
                    <Text style={styles.priorityText}>
                      {appointment.priority.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                    <Clock size={12} color={T.textWhite} strokeWidth={1.8} />
                    <Text style={styles.statusText}>
                      {appointment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailItem}>
                  <Clock size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={styles.detailText}>
                    {new Date(appointment.requestedDate).toLocaleDateString()} at {appointment.requestedTime}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <User size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={styles.detailText}>
                    {appointment.assignedPersonName || `Assigned to ${appointment.assignedTo}`}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Phone size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={styles.detailText}>{appointment.parentPhone}</Text>
                </View>
              </View>

              <Text style={styles.reasonText} numberOfLines={2}>
                {appointment.reason}
              </Text>

              <View style={styles.appointmentFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.detailsButton]}
                  onPress={() => handleAppointmentPress(appointment)}
                >
                  <Eye size={16} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={styles.footerButtonText}>Details</Text>
                </TouchableOpacity>
                {appointment.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.footerButton, styles.processButton]}
                    onPress={() => handleProcessPress(appointment)}
                  >
                    <Pencil size={16} color={T.textWhite} strokeWidth={1.8} />
                    <Text style={styles.footerButtonText}>Process</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <AppointmentDetailsModal
        visible={showAppointmentDetails}
        appointment={selectedAppointment}
        onClose={() => setShowAppointmentDetails(false)}
        onAppointmentUpdated={handleAppointmentProcessed}
      />

      <ProcessAppointmentModal
        visible={showProcessModal}
        appointment={selectedAppointment}
        onClose={() => setShowProcessModal(false)}
        onAppointmentProcessed={handleAppointmentProcessed}
      />

      <AvailabilityModal
        visible={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: T.px,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    alignItems: 'center',
    ...T.shadowSm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: T.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: T.textMuted,
    textAlign: 'center',
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: T.px,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    padding: 16,
    marginBottom: 16,
    ...T.shadowSm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: T.textDark,
    marginBottom: 4,
  },
  studentInfo: {
    fontSize: 14,
    color: T.textMuted,
  },
  appointmentBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  appointmentDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: T.textMuted,
  },
  reasonText: {
    fontSize: 14,
    color: T.textDark,
    marginBottom: 16,
    lineHeight: 20,
  },
  appointmentFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  detailsButton: {
    backgroundColor: T.primary,
  },
  processButton: {
    backgroundColor: T.primary,
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textWhite,
  },
});

export default AppointmentManagementScreen;



