/**
 * Principal Dashboard Screen
 * Executive-level overview with key metrics and quick access to oversight modules
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ExecutiveMetrics {
  totalStudents: number;
  totalTeachers: number;
  overallAttendance: number;
  academicPerformance: number;
  pendingActions: number;
  criticalAlerts: number;
}

interface Alert {
  id: string;
  type: 'attendance' | 'performance' | 'behavior' | 'teacher' | 'finance';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  time: string;
  actionRequired: boolean;
}

const PrincipalDashboardScreen: React.FC = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    totalStudents: 850,
    totalTeachers: 45,
    overallAttendance: 89,
    academicPerformance: 76,
    pendingActions: 12,
    criticalAlerts: 3,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock alerts - would come from analytics service
      setAlerts([
        {
          id: '1',
          type: 'attendance',
          severity: 'critical',
          title: 'Low Attendance Alert',
          description: 'Class 10-A attendance dropped below 75% this week',
          time: '10 minutes ago',
          actionRequired: true,
        },
        {
          id: '2',
          type: 'performance',
          severity: 'high',
          title: 'Performance Decline',
          description: '15 students showing significant grade drops',
          time: '1 hour ago',
          actionRequired: true,
        },
        {
          id: '3',
          type: 'teacher',
          severity: 'medium',
          title: 'Teacher Absence',
          description: '2 teachers on unplanned leave today',
          time: '2 hours ago',
          actionRequired: false,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#E74C3C';
      case 'high': return '#F39C12';
      case 'medium': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'attendance': return 'people';
      case 'performance': return 'trending-down';
      case 'behavior': return 'warning';
      case 'teacher': return 'person';
      case 'finance': return 'attach-money';
      default: return 'notifications';
    }
  };

  const attendanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [88, 92, 87, 89, 91],
        color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const performanceData = {
    labels: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    datasets: [
      {
        data: [82, 78, 75, 73, 79],
      },
    ],
  };

  const quickAccessModules = [
    {
      id: '1',
      title: 'Academic Oversight',
      icon: 'school',
      color: '#3498DB',
      route: 'AcademicOversight',
      badge: null,
    },
    {
      id: '2',
      title: 'Analytics',
      icon: 'assessment',
      color: '#2ECC71',
      route: 'SchoolAnalytics',
      badge: null,
    },
    {
      id: '3',
      title: 'Teacher View',
      icon: 'people',
      color: '#9B59B6',
      route: 'TeacherView',
      badge: null,
    },
    {
      id: '4',
      title: 'Reports',
      icon: 'description',
      color: '#E67E22',
      route: 'CustomReports',
      badge: null,
    },
    {
      id: '5',
      title: 'Appointments',
      icon: 'schedule',
      color: '#1ABC9C',
      route: 'PrincipalAppointments',
      badge: metrics.pendingActions,
    },
    {
      id: '6',
      title: 'Calendar',
      icon: 'event',
      color: '#E74C3C',
      route: 'PrincipalCalendar',
      badge: null,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning, Principal</Text>
            <Text style={styles.headerTitle}>Executive Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
          />
        }
      >
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.metricGradient}
            >
              <MaterialIcons name="school" size={32} color="#FFF" />
              <Text style={styles.metricNumber}>{metrics.totalStudents}</Text>
              <Text style={styles.metricLabel}>Total Students</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.metricGradient}
            >
              <MaterialIcons name="people" size={32} color="#FFF" />
              <Text style={styles.metricNumber}>{metrics.totalTeachers}</Text>
              <Text style={styles.metricLabel}>Total Teachers</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              style={styles.metricGradient}
            >
              <MaterialIcons name="trending-up" size={32} color="#FFF" />
              <Text style={styles.metricNumber}>{metrics.overallAttendance}%</Text>
              <Text style={styles.metricLabel}>Attendance</Text>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              style={styles.metricGradient}
            >
              <MaterialIcons name="star" size={32} color="#FFF" />
              <Text style={styles.metricNumber}>{metrics.academicPerformance}%</Text>
              <Text style={styles.metricLabel}>Performance</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Critical Alerts */}
        {alerts.filter(a => a.severity === 'critical').length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Critical Alerts</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>
                  {alerts.filter(a => a.severity === 'critical').length}
                </Text>
              </View>
            </View>
            {alerts
              .filter(a => a.severity === 'critical')
              .map((alert) => (
                <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.severity) }]}>
                  <View style={[styles.alertIcon, { backgroundColor: getSeverityColor(alert.severity) }]}>
                    <MaterialIcons name={getAlertIcon(alert.type) as any} size={24} color="#FFF" />
                  </View>
                  <View style={styles.alertDetails}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertTitle}>{alert.title}</Text>
                      {alert.actionRequired && (
                        <View style={styles.actionRequiredBadge}>
                          <Text style={styles.actionRequiredText}>ACTION REQUIRED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.alertDescription}>{alert.description}</Text>
                    <Text style={styles.alertTime}>{alert.time}</Text>
                  </View>
                  <TouchableOpacity style={styles.alertAction}>
                    <MaterialIcons name="chevron-right" size={24} color="#95A5A6" />
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

        {/* Attendance Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Trend (This Week)</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={attendanceData}
              width={width - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4ECDC4',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Performance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Performance Overview</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={performanceData}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                barPercentage: 0.7,
              }}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessModules.map((module) => (
              <TouchableOpacity
                key={module.id}
                style={styles.quickAccessCard}
                onPress={() => navigation.navigate(module.route)}
              >
                <View style={[styles.quickAccessIcon, { backgroundColor: module.color }]}>
                  <MaterialIcons name={module.icon as any} size={32} color="#FFF" />
                  {module.badge !== null && (
                    <View style={styles.moduleBadge}>
                      <Text style={styles.moduleBadgeText}>{module.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickAccessTitle}>{module.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Alerts & Notifications</Text>
          {alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.severity) }]}>
              <View style={[styles.alertIcon, { backgroundColor: getSeverityColor(alert.severity) }]}>
                <MaterialIcons name={getAlertIcon(alert.type) as any} size={20} color="#FFF" />
              </View>
              <View style={styles.alertDetails}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  metricCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  metricGradient: {
    padding: 20,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  alertBadge: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertDetails: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  actionRequiredBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionRequiredText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
  alertDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  alertAction: {
    marginLeft: 8,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessCard: {
    width: (width - 52) / 3,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
});

export default PrincipalDashboardScreen;



