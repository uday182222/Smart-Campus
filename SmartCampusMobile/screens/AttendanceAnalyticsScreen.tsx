// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  Eye,
  ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { ClassAttendance } from '../models/AttendanceModel';

interface AttendanceAnalyticsProps {
  navigation?: any;
  route?: any;
}

interface AnalyticsData {
  classWideStats: {
    totalDays: number;
    averageAttendance: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendancePercentage: number;
  };
  studentStats: Array<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
    isWarning: boolean;
  }>;
  monthlyTrends: Array<{
    month: string;
    attendancePercentage: number;
    presentDays: number;
    totalDays: number;
  }>;
  warningStudents: Array<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    attendancePercentage: number;
    absentDays: number;
  }>;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: string;
    label: string;
  }>;
}

const { width: screenWidth } = Dimensions.get('window');

const AttendanceAnalyticsScreen: React.FC<AttendanceAnalyticsProps> = ({ navigation, route }) => {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<ClassAttendance[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<Map<string, AnalyticsData>>(new Map());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAnalyticsData();
    }
  }, [selectedClass]);

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
      console.error('❌ Error loading analytics data:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    if (!selectedClass) return;

    try {
      const cacheKey = `${selectedClass.id}_${new Date().toDateString()}`;
      if (cachedData.has(cacheKey)) {
        setAnalyticsData(cachedData.get(cacheKey)!);
        return;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const res = await apiClient.get<{ data: { classStatistics: any; studentStatistics: any[]; dailyTrend: any[] } }>(
        `/attendance/analytics/${selectedClass.id}?startDate=${startStr}&endDate=${endStr}`
      );
      const data = (res as any).data;
      const cs = data?.classStatistics ?? {};
      const ss = (data?.studentStatistics ?? []).map((s: any) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        rollNumber: s.studentId,
        totalDays: s.total ?? 0,
        presentDays: s.present ?? 0,
        absentDays: s.absent ?? 0,
        lateDays: s.late ?? 0,
        attendancePercentage: s.attendancePercentage ?? 0,
        isWarning: (s.attendancePercentage ?? 0) < 75,
      }));
      const dailyTrend = data?.dailyTrend ?? [];
      const monthlyTrends = dailyTrend.slice(-3).map((d: any) => ({
        month: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        attendancePercentage: d.attendancePercentage ?? 0,
        presentDays: d.present ?? 0,
        totalDays: d.total ?? 0,
      }));
      const warningStudents = ss.filter((s: any) => s.isWarning).map((s: any) => ({
        studentId: s.studentId,
        studentName: s.studentName,
        rollNumber: s.rollNumber,
        attendancePercentage: s.attendancePercentage,
        absentDays: s.absentDays,
      }));

      const analytics: AnalyticsData = {
        classWideStats: {
          totalDays: cs.totalRecords ?? 0,
          averageAttendance: cs.attendancePercentage ?? 0,
          presentDays: cs.present ?? 0,
          absentDays: cs.absent ?? 0,
          lateDays: cs.late ?? 0,
          excusedDays: 0,
          attendancePercentage: cs.attendancePercentage ?? 0,
        },
        studentStats: ss,
        monthlyTrends,
        warningStudents,
      };
      setAnalyticsData(analytics);
      setCachedData(prev => new Map(prev.set(cacheKey, analytics)));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics. Please try again.');
    }
  };

  const calculateAnalytics = (records: AttendanceRecord[], classData: ClassAttendance): AnalyticsData => {
    // Class-wide statistics
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const excusedDays = records.filter(r => r.status === 'excused').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const classWideStats = {
      totalDays,
      averageAttendance: attendancePercentage,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage,
    };

    // Student-wise statistics
    const studentStats = classData.students.map(student => {
      const studentRecords = records.filter(r => r.studentId === student.id);
      const studentPresentDays = studentRecords.filter(r => r.status === 'present').length;
      const studentAbsentDays = studentRecords.filter(r => r.status === 'absent').length;
      const studentLateDays = studentRecords.filter(r => r.status === 'late').length;
      const studentAttendancePercentage = studentRecords.length > 0 
        ? Math.round((studentPresentDays / studentRecords.length) * 100) 
        : 0;

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        totalDays: studentRecords.length,
        presentDays: studentPresentDays,
        absentDays: studentAbsentDays,
        lateDays: studentLateDays,
        attendancePercentage: studentAttendancePercentage,
        isWarning: studentAttendancePercentage < 75,
      };
    });

    // Monthly trends (last 3 months)
    const monthlyTrends = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthRecords = records.filter(r => 
        r.date.getMonth() === date.getMonth() && 
        r.date.getFullYear() === date.getFullYear()
      );
      const monthPresentDays = monthRecords.filter(r => r.status === 'present').length;
      const monthAttendancePercentage = monthRecords.length > 0 
        ? Math.round((monthPresentDays / monthRecords.length) * 100) 
        : 0;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        attendancePercentage: monthAttendancePercentage,
        presentDays: monthPresentDays,
        totalDays: monthRecords.length,
      });
    }

    // Warning students (< 75% attendance)
    const warningStudents = studentStats
      .filter(student => student.isWarning)
      .map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        attendancePercentage: student.attendancePercentage,
        absentDays: student.absentDays,
      }))
      .sort((a, b) => a.attendancePercentage - b.attendancePercentage);

    return {
      classWideStats,
      studentStats,
      monthlyTrends,
      warningStudents,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear cache to force fresh data
    setCachedData(new Map());
    await loadData();
    setRefreshing(false);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return '#10B981';
    if (percentage >= 75) return '#F59E0B';
    return '#EF4444';
  };

  const getAttendanceIcon = (percentage: number) => {
    if (percentage >= 90) return <Award size={16} color="#10B981" />;
    if (percentage >= 75) return <Clock size={16} color="#F59E0B" />;
    return <AlertTriangle size={16} color="#EF4444" />;
  };

  const renderSimpleBarChart = (data: number[], labels: string[], colors: string[]) => {
    const maxValue = Math.max(...data);
    const chartHeight = 120;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((value, index) => (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: (value / maxValue) * chartHeight,
                      backgroundColor: colors[index % colors.length],
                    },
                  ]}
                />
                <Text style={styles.barValue}>{value}%</Text>
              </View>
              <Text style={styles.barLabel}>{labels[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderLineChart = (data: Array<{ month: string; attendancePercentage: number }>) => {
    const maxValue = Math.max(...data.map(d => d.attendancePercentage));
    const chartHeight = 120;
    const chartWidth = screenWidth - 80;
    
    return (
      <View style={styles.chartContainer}>
        <View style={[styles.lineChart, { height: chartHeight, width: chartWidth }]}>
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = chartHeight - (point.attendancePercentage / maxValue) * chartHeight;
            
            return (
              <View key={index}>
                <View
                  style={[
                    styles.linePoint,
                    {
                      left: x - 4,
                      top: y - 4,
                      backgroundColor: '#3B82F6',
                    },
                  ]}
                />
                <Text style={[styles.linePointLabel, { left: x - 10, top: y - 20 }]}>
                  {point.attendancePercentage}%
                </Text>
                <Text style={[styles.linePointMonth, { left: x - 15, top: chartHeight + 5 }]}>
                  {point.month}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📊 Attendance Analytics</Text>
            <Text style={styles.headerSubtitle}>Comprehensive attendance insights</Text>
          </View>
          {lastUpdated && (
            <Text style={styles.lastUpdatedText}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Class Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Class</Text>
          <TouchableOpacity 
            style={styles.classSelector}
            onPress={() => setShowClassModal(true)}
          >
            <Users size={20} color="#6B7280" />
            <Text style={styles.classSelectorText}>
              {selectedClass ? selectedClass.name : 'Select a class'}
            </Text>
            <ChevronRight size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {analyticsData && (
          <>
            {/* Class-wide Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Class Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Target size={24} color="#3B82F6" />
                  <Text style={styles.statNumber}>{analyticsData.classWideStats.attendancePercentage}%</Text>
                  <Text style={styles.statLabel}>Overall Attendance</Text>
                </View>
                <View style={styles.statCard}>
                  <CheckCircle size={24} color="#10B981" />
                  <Text style={styles.statNumber}>{analyticsData.classWideStats.presentDays}</Text>
                  <Text style={styles.statLabel}>Present Days</Text>
                </View>
                <View style={styles.statCard}>
                  <XCircle size={24} color="#EF4444" />
                  <Text style={styles.statNumber}>{analyticsData.classWideStats.absentDays}</Text>
                  <Text style={styles.statLabel}>Absent Days</Text>
                </View>
                <View style={styles.statCard}>
                  <Clock size={24} color="#F59E0B" />
                  <Text style={styles.statNumber}>{analyticsData.classWideStats.lateDays}</Text>
                  <Text style={styles.statLabel}>Late Days</Text>
                </View>
              </View>
            </View>

            {/* Monthly Trend Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Trends</Text>
              <View style={styles.chartCard}>
                {renderLineChart(analyticsData.monthlyTrends)}
              </View>
            </View>

            {/* Student Comparison Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Comparison</Text>
              <View style={styles.chartCard}>
                {renderSimpleBarChart(
                  analyticsData.studentStats.map(s => s.attendancePercentage),
                  analyticsData.studentStats.map(s => s.studentName.split(' ')[0]),
                  ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                )}
              </View>
            </View>

            {/* Warning Students */}
            {analyticsData.warningStudents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <AlertTriangle size={20} color="#EF4444" />{' '}
                  {'Warning Students (< 75%)'}
                </Text>
                <View style={styles.warningList}>
                  {analyticsData.warningStudents.map((student) => (
                    <View key={student.studentId} style={styles.warningCard}>
                      <View style={styles.warningInfo}>
                        <Text style={styles.warningName}>{student.studentName}</Text>
                        <Text style={styles.warningRoll}>Roll: {student.rollNumber}</Text>
                      </View>
                      <View style={styles.warningStats}>
                        <Text style={[styles.warningPercentage, { color: getAttendanceColor(student.attendancePercentage) }]}>
                          {student.attendancePercentage}%
                        </Text>
                        <Text style={styles.warningAbsent}>{student.absentDays} absent</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Student Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Student Details</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowStudentModal(true)}
                >
                  <Filter size={16} color="#6B7280" />
                  <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.studentList}>
                {analyticsData.studentStats
                  .filter(student => !selectedStudent || student.studentId === selectedStudent)
                  .map((student) => (
                    <TouchableOpacity key={student.studentId} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>
                            {student.studentName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>{student.studentName}</Text>
                          <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
                        </View>
                      </View>
                      <View style={styles.studentStats}>
                        <View style={styles.studentAttendance}>
                          {getAttendanceIcon(student.attendancePercentage)}
                          <Text style={[styles.studentPercentage, { color: getAttendanceColor(student.attendancePercentage) }]}>
                            {student.attendancePercentage}%
                          </Text>
                        </View>
                        <View style={styles.studentBreakdown}>
                          <Text style={styles.breakdownText}>
                            P: {student.presentDays} | A: {student.absentDays} | L: {student.lateDays}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
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
  lastUpdatedText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  classSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  classSelectorText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartContainer: {
    height: 140,
    justifyContent: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
  barLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  lineChart: {
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linePointLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  linePointMonth: {
    position: 'absolute',
    fontSize: 10,
    color: '#6b7280',
  },
  warningList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  warningInfo: {
    flex: 1,
  },
  warningName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  warningRoll: {
    fontSize: 14,
    color: '#6b7280',
  },
  warningStats: {
    alignItems: 'flex-end',
  },
  warningPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  warningAbsent: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  studentList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentStats: {
    alignItems: 'flex-end',
  },
  studentAttendance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  studentPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentBreakdown: {
    alignItems: 'flex-end',
  },
  breakdownText: {
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

export default AttendanceAnalyticsScreen;




