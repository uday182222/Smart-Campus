// @ts-nocheck
/**
 * Admin Dashboard Screen
 * Comprehensive dashboard with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import {
  Bell,
  User,
  Users,
  GraduationCap,
  CheckCircle,
  CreditCard,
  Bus,
  Megaphone,
  School,
  BarChart3,
  Info,
  AlertTriangle,
  FileText,
  ArrowRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import apiClient from '../../services/apiClient';
import { T } from '../../constants/theme';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess } from '../../utils/rolePermissions';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  attendancePercentage: number;
  feeCollectionPercentage: number;
  pendingTasks: number;
  recentActivities: Activity[];
}

interface Activity {
  id: string;
  type: 'attendance' | 'fee' | 'communication' | 'transport' | 'exam';
  message: string;
  timestamp: Date;
  user: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  screen: string;
  onPress: () => void;
}

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme } = useSchoolTheme();
  const { userData } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: { analytics: any } }>('/admin/analytics/dashboard');
      const a = (res as any).data?.analytics ?? {};
      const users = a.users ?? {};
      const byRole = users.byRole ?? {};
      const att = a.attendance ?? {};
      const hw = a.homework ?? {};
      const activities = a.activities?.recent ?? [];
      setStats({
        totalStudents: byRole.STUDENT ?? 0,
        totalTeachers: byRole.TEACHER ?? 0,
        totalParents: byRole.PARENT ?? 0,
        attendancePercentage: att.todayPercentage ?? 0,
        feeCollectionPercentage: 0,
        pendingTasks: hw.pending ?? 0,
        recentActivities: (Array.isArray(activities) ? activities : []).slice(0, 10).map((act: any, i: number) => ({
          id: act.id ?? String(i),
          type: (act.resource ?? 'attendance') as Activity['type'],
          message: act.action ?? act.message ?? 'Activity',
          timestamp: act.timestamp ? new Date(act.timestamp) : new Date(),
          user: act.user?.name ?? act.userName ?? 'User',
        })),
      });
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

  const safeNav = (routeName: string) => {
    try {
      navigation.navigate(routeName);
    } catch (_e) {}
  };

  const quickActions: QuickAction[] = [
    { id: 'attendance', title: 'Attendance', icon: 'check-circle', color: '#2ECC71', screen: 'AttendanceReport', onPress: () => safeNav('AttendanceReport') },
    { id: 'fees', title: 'Fees', icon: 'payment', color: '#3498DB', screen: 'FeeReport', onPress: () => safeNav('FeeReport') },
    { id: 'transport', title: 'Transport', icon: 'directions-bus', color: '#9B59B6', screen: 'TransportManagement', onPress: () => safeNav('TransportManagement') },
    { id: 'communications', title: 'Announcements', icon: 'notifications', color: '#E67E22', screen: 'Announcements', onPress: () => safeNav('Announcements') },
    { id: 'events', title: 'Events', icon: 'school', color: '#E74C3C', screen: 'Events', onPress: () => safeNav('Events') },
    { id: 'users', title: 'Users', icon: 'account', color: '#34495E', screen: 'UserManagement', onPress: () => safeNav('UserManagement') },
    { id: 'classes', title: 'Classes', icon: 'grid', color: '#34495E', screen: 'ClassManagement', onPress: () => safeNav('ClassManagement') },
    { id: 'pending', title: 'Pending Requests', icon: 'alert', color: '#34495E', screen: 'PendingRequests', onPress: () => safeNav('PendingRequests') },
    { id: 'gallery', title: 'Gallery', icon: 'image', color: '#34495E', screen: 'GalleryManagement', onPress: () => safeNav('GalleryManagement') },
    { id: 'school', title: 'School Profile', icon: 'info', color: '#34495E', screen: 'SchoolProfile', onPress: () => safeNav('SchoolProfile') },
  ];

  const visibleActions = quickActions.filter((a) => canAccess((userData as any)?.role ?? '', a.screen));

  const chartConfig = {
    backgroundColor: T.card,
    backgroundGradientFrom: T.card,
    backgroundGradientTo: T.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(30, 63, 160, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(26, 26, 46, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: T.primary,
    },
  };

  const attendanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: [94, 96, 92, 95, 97, 89],
        color: (opacity = 1) => `rgba(30, 63, 160, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const feeCollectionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [85, 88, 90, 87, 92, 89],
      },
    ],
  };

  const classDistributionData = [
    {
      name: 'Primary',
      population: 45,
      color: '#4ECDC4',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Middle',
      population: 30,
      color: '#3498DB',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Secondary',
      population: 25,
      color: '#9B59B6',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const adminInitial = 'A';

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return 'check-circle';
      case 'fee': return 'payment';
      case 'communication': return 'notifications';
      case 'transport': return 'directions-bus';
      case 'exam': return 'school';
      default: return 'info';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'attendance': return '#2ECC71';
      case 'fee': return '#3498DB';
      case 'communication': return '#E67E22';
      case 'transport': return '#9B59B6';
      case 'exam': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: T.bg }]}>
        <Text style={[styles.loadingText, { color: T.textMuted }]}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: T.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
      >
        {/* Header (flat) */}
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
              <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Dashboard</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.85}
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
                activeOpacity={0.85}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}
                onPress={() => {
                  try {
                    navigation.navigate('AdminProfile');
                  } catch (_e) {}
                }}
              >
                {theme.logoUrl ? (
                  <Image source={{ uri: theme.logoUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} resizeMode="cover" />
                ) : (
                  <Text style={{ color: T.textWhite, fontWeight: '900' }}>{adminInitial}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: T.px, paddingTop: 16 }}>
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={[styles.sectionTitle, { color: T.textDark }]}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Users size={20} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.metricNumber, { color: T.textDark }]}>{stats?.totalStudents}</Text>
              <Text style={[styles.metricLabel, { color: T.textMuted }]}>Students</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <GraduationCap size={20} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.metricNumber, { color: T.textDark }]}>{stats?.totalTeachers}</Text>
              <Text style={[styles.metricLabel, { color: T.textMuted }]}>Teachers</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <User size={20} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.metricNumber, { color: T.textDark }]}>{stats?.totalParents}</Text>
              <Text style={[styles.metricLabel, { color: T.textMuted }]}>Parents</Text>
            </View>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <CheckCircle size={20} color={T.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.metricNumber, { color: T.textDark }]}>{stats?.attendancePercentage}%</Text>
              <Text style={[styles.metricLabel, { color: T.textMuted }]}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: T.textDark }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {visibleActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <View style={styles.quickActionIcon}>
                  {action.id === 'attendance' ? <CheckCircle size={20} color={T.primary} strokeWidth={1.8} /> : null}
                  {action.id === 'fees' ? <CreditCard size={20} color={T.primary} strokeWidth={1.8} /> : null}
                  {action.id === 'transport' ? <Bus size={20} color={T.primary} strokeWidth={1.8} /> : null}
                  {action.id === 'communications' ? <Megaphone size={20} color={T.primary} strokeWidth={1.8} /> : null}
                  {action.id === 'exams' ? <School size={20} color={T.primary} strokeWidth={1.8} /> : null}
                  {action.id === 'reports' ? <BarChart3 size={20} color={T.primary} strokeWidth={1.8} /> : null}
                </View>
                <Text style={[styles.quickActionText, { color: T.textDark }]}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          <Text style={[styles.sectionTitle, { color: T.textDark }]}>Analytics</Text>
          
          {/* Attendance Trend */}
          <View style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: T.textDark }]}>Attendance Trend (This Week)</Text>
            <LineChart
              data={attendanceData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Fee Collection */}
          <View style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: T.textDark }]}>Fee Collection Progress</Text>
            <BarChart
              data={feeCollectionData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>

          {/* Class Distribution */}
          <View style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: T.textDark }]}>Student Distribution by Level</Text>
            <PieChart
              data={classDistributionData}
              width={width - 40}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesContainer}>
          <Text style={[styles.sectionTitle, { color: T.textDark }]}>Recent Activities</Text>
          {stats?.recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityIcon}>
                {getActivityIcon(activity.type) === 'check-circle' ? <CheckCircle size={20} color={T.primary} strokeWidth={1.8} /> : null}
                {getActivityIcon(activity.type) === 'payment' ? <CreditCard size={20} color={T.primary} strokeWidth={1.8} /> : null}
                {getActivityIcon(activity.type) === 'notifications' ? <Bell size={20} color={T.primary} strokeWidth={1.8} /> : null}
                {getActivityIcon(activity.type) === 'directions-bus' ? <Bus size={20} color={T.primary} strokeWidth={1.8} /> : null}
                {getActivityIcon(activity.type) === 'school' ? <School size={20} color={T.primary} strokeWidth={1.8} /> : null}
                {getActivityIcon(activity.type) === 'info' ? <Info size={20} color={T.primary} strokeWidth={1.8} /> : null}
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityMessage, { color: T.textDark }]}>{activity.message}</Text>
                <View style={styles.activityMeta}>
                  <Text style={[styles.activityUser, { color: T.textMuted }]}>{activity.user}</Text>
                  <Text style={[styles.activityTime, { color: T.textPlaceholder }]}>
                    {formatTimeAgo(activity.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pending Tasks */}
        <View style={styles.tasksContainer}>
          <View style={styles.tasksHeader}>
            <Text style={[styles.sectionTitle, { color: T.textDark, marginBottom: 0 }]}>Pending Tasks</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('PendingRequests')}>
              <Text style={[styles.viewAllText, { color: T.primary }]}>View All</Text>
              <ArrowRight size={16} color={T.primary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <AlertTriangle size={20} color={T.warning} strokeWidth={1.8} />
              <Text style={[styles.taskText, { color: T.textDark }]}>Review pending fee payments</Text>
            </View>
            <Text style={[styles.taskCount, { color: T.primary, backgroundColor: T.primaryLight, borderColor: T.inputBorder }]}>5</Text>
          </View>
          
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <FileText size={20} color={T.primary} strokeWidth={1.8} />
              <Text style={[styles.taskText, { color: T.textDark }]}>Update student records</Text>
            </View>
            <Text style={[styles.taskCount, { color: T.primary, backgroundColor: T.primaryLight, borderColor: T.inputBorder }]}>3</Text>
          </View>
          
          <View style={styles.taskCard}>
            <View style={styles.taskInfo}>
              <Bell size={20} color={T.primary} strokeWidth={1.8} />
              <Text style={[styles.taskText, { color: T.textDark }]}>Send exam notifications</Text>
            </View>
            <Text style={[styles.taskCount, { color: T.primary, backgroundColor: T.primaryLight, borderColor: T.inputBorder }]}>4</Text>
          </View>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    alignItems: 'center',
    ...T.shadowSm,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    alignItems: 'center',
    ...T.shadowSm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  chartsContainer: {
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    marginBottom: 16,
    ...T.shadowSm,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activitiesContainer: {
    marginBottom: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    marginBottom: 12,
    ...T.shadowSm,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityUser: {
    fontSize: 12,
  },
  activityTime: {
    fontSize: 12,
  },
  tasksContainer: {
    marginBottom: 24,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    marginBottom: 8,
    ...T.shadowSm,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    flex: 1,
  },
  taskCount: {
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default AdminDashboardScreen;
