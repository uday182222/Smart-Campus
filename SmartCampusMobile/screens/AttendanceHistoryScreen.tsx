import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  User, 
  Calendar as CalendarIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { ClassAttendance, AttendanceRecord, AttendanceStatus } from '../models/AttendanceModel';

interface AttendanceHistoryProps {
  navigation?: any;
  route?: any;
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  absentDates: Date[];
  lateDates: Date[];
}

interface CalendarDay {
  date: Date;
  status: AttendanceStatus | 'not_marked';
  isCurrentMonth: boolean;
  isToday: boolean;
}

const AttendanceHistoryScreen: React.FC<AttendanceHistoryProps> = ({ navigation, route }) => {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<ClassAttendance[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAttendanceHistory();
    }
  }, [selectedClass, selectedStudent, dateRange]);

  useEffect(() => {
    if (selectedClass && viewMode === 'calendar') {
      generateCalendarDays();
    }
  }, [selectedClass, currentMonth, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: { classes: any[] } }>('/classes/today');
      const list = (res as any).data?.classes ?? [];
      const teacherClasses: ClassAttendance[] = await Promise.all(
        list.map(async (c: any) => {
          try {
            const r = await apiClient.get<{ data: { class: any; students: any[] } }>(`/classes/${c.id}`);
            const d = (r as any).data;
            const cls = d?.class ?? c;
            const students = (d?.students ?? []).map((s: any) => ({ id: s.id, name: s.name ?? s.email ?? 'Student', rollNumber: s.email ?? s.id ?? '' }));
            return { id: cls.id, name: (cls.name ?? '') + (cls.section ? ` ${cls.section}` : ''), teacherId: '', teacherName: '', students, subject: '', schedule: '' };
          } catch {
            return { id: c.id, name: (c.name ?? '') + (c.section ? ` ${c.section}` : ''), teacherId: '', teacherName: '', students: [], subject: '', schedule: '' };
          }
        })
      );
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) setSelectedClass(teacherClasses[0]);
    } catch (error) {
      console.error('❌ Error loading attendance history data:', error);
      Alert.alert('Error', 'Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!selectedClass) return;

    try {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const days: string[] = [];
      const numDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      for (let i = 0; i < numDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
      }
      const results = await Promise.all(
        days.map(dateStr =>
          apiClient.get<{ data: { attendance: any[] } }>(`/attendance/${selectedClass.id}/${dateStr}`)
        )
      );
      const records: AttendanceRecord[] = [];
      results.forEach((res, i) => {
        const list = (res as any).data?.attendance ?? [];
        list.forEach((a: any) => {
          if (a.studentId && a.status) {
            records.push({
              id: a.id ?? `${a.studentId}-${days[i]}`,
              studentId: a.studentId,
              studentName: a.studentName ?? a.student?.name ?? 'Student',
              classId: selectedClass.id,
              className: selectedClass.name,
              date: new Date(days[i]),
              status: (a.status === 'half_day' ? 'present' : a.status) as AttendanceStatus,
              markedBy: a.markedBy ?? '',
              markedAt: a.markedAt ? new Date(a.markedAt) : new Date(days[i]),
              remarks: a.remarks,
              subject: '',
            });
          }
        });
      });
      const filteredRecords = selectedStudent ? records.filter(r => r.studentId === selectedStudent) : records;
      setAttendanceRecords(filteredRecords);
      setAttendanceStats(calculateAttendanceStats(filteredRecords, dateRange));
    } catch (error) {
      console.error('❌ Error loading attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history. Please try again.');
    }
  };

  const calculateAttendanceStats = (records: AttendanceRecord[], range: DateRange): AttendanceStats => {
    const totalDays = Math.ceil((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const excusedDays = records.filter(r => r.status === 'excused').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const absentDates = records
      .filter(r => r.status === 'absent')
      .map(r => r.date);
    
    const lateDates = records
      .filter(r => r.status === 'late')
      .map(r => r.date);

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage,
      absentDates,
      lateDates,
    };
  };

  const generateCalendarDays = () => {
    if (!selectedClass) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get first day of week (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get last day of previous month
    const lastDayOfPrevMonth = new Date(year, month, 0);
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(lastDayOfPrevMonth.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({
        date,
        status: 'not_marked',
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      // Find attendance record for this date
      const record = attendanceRecords.find(r => 
        r.date.toDateString() === date.toDateString()
      );
      
      days.push({
        date,
        status: record?.status || 'not_marked',
        isCurrentMonth: true,
        isToday,
      });
    }
    
    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        status: 'not_marked',
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    setCalendarDays(days);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const exportToCSV = async () => {
    if (!attendanceRecords.length) {
      Alert.alert('No Data', 'No attendance records to export.');
      return;
    }

    try {
      console.log('📊 Exporting attendance data to CSV...');
      
      // Create CSV content
      const headers = ['Date', 'Student Name', 'Roll Number', 'Status', 'Subject', 'Remarks'];
      const csvContent = [
        headers.join(','),
        ...attendanceRecords.map(record => [
          record.date.toLocaleDateString(),
          `"${record.studentName}"`,
          record.studentId,
          record.status,
          record.subject,
          `"${record.remarks || ''}"`
        ].join(','))
      ].join('\n');

      // Share the CSV content
      if (Platform.OS === 'ios') {
        await Share.share({
          message: csvContent,
          title: 'Attendance Export',
        });
      } else {
        await Share.share({
          message: csvContent,
          title: 'Attendance Export',
        });
      }
      
      console.log('✅ CSV exported successfully');
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const getStatusColor = (status: AttendanceStatus | 'not_marked') => {
    switch (status) {
      case 'present': return '#10B981';
      case 'absent': return '#EF4444';
      case 'late': return '#F59E0B';
      case 'excused': return '#8B5CF6';
      default: return '#E5E7EB';
    }
  };

  const getStatusIcon = (status: AttendanceStatus | 'not_marked') => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'excused': return '📝';
      default: return '⭕';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading attendance history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Attendance History</Text>
        <Text style={styles.headerSubtitle}>View and analyze attendance patterns</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Cards */}
        {attendanceStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <TrendingUp size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{attendanceStats.attendancePercentage}%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.statNumber}>{attendanceStats.presentDays}</Text>
              <Text style={styles.statLabel}>Present Days</Text>
            </View>
            <View style={styles.statCard}>
              <AlertCircle size={24} color="#EF4444" />
              <Text style={styles.statNumber}>{attendanceStats.absentDays}</Text>
              <Text style={styles.statLabel}>Absent Days</Text>
            </View>
            <View style={styles.statCard}>
              <Clock size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{attendanceStats.lateDays}</Text>
              <Text style={styles.statLabel}>Late Days</Text>
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* Class Selection */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowClassModal(true)}
          >
            <User size={20} color="#6B7280" />
            <Text style={styles.controlButtonText}>
              {selectedClass ? selectedClass.name : 'Select Class'}
            </Text>
          </TouchableOpacity>

          {/* Student Filter */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowStudentModal(true)}
          >
            <Filter size={20} color="#6B7280" />
            <Text style={styles.controlButtonText}>
              {selectedStudent ? 'Filtered' : 'All Students'}
            </Text>
          </TouchableOpacity>

          {/* Date Range */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowDateRangeModal(true)}
          >
            <CalendarIcon size={20} color="#6B7280" />
            <Text style={styles.controlButtonText}>
              {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <FileText size={20} color={viewMode === 'list' ? 'white' : '#6B7280'} />
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              List View
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Calendar size={20} color={viewMode === 'calendar' ? 'white' : '#6B7280'} />
            <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
              Calendar View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportToCSV}
        >
          <Download size={20} color="white" />
          <Text style={styles.exportButtonText}>Export to CSV</Text>
        </TouchableOpacity>

        {/* Content */}
        {viewMode === 'list' ? (
          /* List View */
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Attendance Records ({attendanceRecords.length})</Text>
            {attendanceRecords.length > 0 ? (
              <FlatList
                data={attendanceRecords}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.recordCard}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordDate}>
                        {item.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                      <Text style={styles.recordStudent}>{item.studentName}</Text>
                      <Text style={styles.recordSubject}>{item.subject}</Text>
                    </View>
                    <View style={styles.recordStatus}>
                      <Text style={styles.recordStatusIcon}>{getStatusIcon(item.status)}</Text>
                      <Text style={[styles.recordStatusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No attendance records found</Text>
                <Text style={styles.emptyStateSubtext}>Try adjusting your filters or date range</Text>
              </View>
            )}
          </View>
        ) : (
          /* Calendar View */
          <View style={styles.calendarContainer}>
            <Text style={styles.sectionTitle}>Calendar View</Text>
            
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => navigateMonth('prev')}>
                <ChevronLeft size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => navigateMonth('next')}>
                <ChevronRight size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !day.isCurrentMonth && styles.calendarDayInactive,
                    day.isToday && styles.calendarDayToday,
                  ]}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayTextInactive,
                    day.isToday && styles.calendarDayTextToday,
                  ]}>
                    {day.date.getDate()}
                  </Text>
                  <View style={[
                    styles.calendarDayStatus,
                    { backgroundColor: getStatusColor(day.status) }
                  ]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Late</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
                <Text style={styles.legendText}>Excused</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Class</Text>
            <FlatList
              data={classes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedClass(item);
                    setShowClassModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Text style={styles.modalItemSubtext}>{item.students.length} students</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClassModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Student Filter Modal */}
      <Modal
        visible={showStudentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Student</Text>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setSelectedStudent(null);
                setShowStudentModal(false);
              }}
            >
              <Text style={styles.modalItemText}>All Students</Text>
            </TouchableOpacity>
            {selectedClass?.students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedStudent(student.id);
                  setShowStudentModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{student.name}</Text>
                <Text style={styles.modalItemSubtext}>Roll: {student.rollNumber}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStudentModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Range Modal */}
      <Modal
        visible={showDateRangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <Text style={styles.modalSubtitle}>
              Choose the date range for attendance history
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDateRangeModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    gap: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  viewModeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: 'white',
  },
  exportButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recordStudent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  recordSubject: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordStatus: {
    alignItems: 'center',
    minWidth: 80,
  },
  recordStatusIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  recordStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    padding: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1e293b',
  },
  calendarDayTextInactive: {
    color: '#9ca3af',
  },
  calendarDayTextToday: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarDayStatus: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalItemSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalCloseButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AttendanceHistoryScreen;




