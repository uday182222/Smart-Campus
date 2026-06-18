// @ts-nocheck
/**
 * Admin Dashboard Screen
 * Comprehensive dashboard with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
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
  Info,
  AlertTriangle,
  FileText,
  ArrowRight,
  CalendarDays,
  LayoutGrid,
  Image as ImageIcon,
  Building2,
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
  screen: string;
  Icon: LucideIcon;
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
    { id: 'attendance', title: 'Attendance', screen: 'AttendanceReport', Icon: CheckCircle, onPress: () => safeNav('AttendanceReport') },
    { id: 'fees', title: 'Fees', screen: 'FeeReport', Icon: CreditCard, onPress: () => safeNav('FeeReport') },
    { id: 'transport', title: 'Transport', screen: 'TransportManagement', Icon: Bus, onPress: () => safeNav('TransportManagement') },
    { id: 'communications', title: 'Announcements', screen: 'Announcements', Icon: Megaphone, onPress: () => safeNav('Announcements') },
    { id: 'events', title: 'Events', screen: 'Events', Icon: CalendarDays, onPress: () => safeNav('Events') },
    { id: 'users', title: 'Users', screen: 'UserManagement', Icon: Users, onPress: () => safeNav('UserManagement') },
    { id: 'classes', title: 'Classes', screen: 'ClassManagement', Icon: LayoutGrid, onPress: () => safeNav('ClassManagement') },
    { id: 'pending', title: 'Pending Requests', screen: 'PendingRequests', Icon: AlertTriangle, onPress: () => safeNav('PendingRequests') },
    { id: 'gallery', title: 'Gallery', screen: 'GalleryManagement', Icon: ImageIcon, onPress: () => safeNav('GalleryManagement') },
    { id: 'school', title: 'School Profile', screen: 'SchoolProfile', Icon: Building2, onPress: () => safeNav('SchoolProfile') },
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
      color: T.success,
      legendFontColor: T.textMuted,
      legendFontSize: 12,
    },
    {
      name: 'Middle',
      population: 30,
      color: T.primary,
      legendFontColor: T.textMuted,
      legendFontSize: 12,
    },
    {
      name: 'Secondary',
      population: 25,
      color: T.warning,
      legendFontColor: T.textMuted,
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

  const adminName = userData?.name ?? 'Administrator';
  const roleLabel = userData?.role === 'PRINCIPAL' ? 'Principal' : 'School Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const initials =
    adminName
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <CheckCircle size={20} color={T.primary} strokeWidth={1.8} />;
      case 'fee':
        return <CreditCard size={20} color={T.primary} strokeWidth={1.8} />;
      case 'communication':
        return <Megaphone size={20} color={T.primary} strokeWidth={1.8} />;
      case 'transport':
        return <Bus size={20} color={T.primary} strokeWidth={1.8} />;
      case 'exam':
        return <School size={20} color={T.primary} strokeWidth={1.8} />;
      default:
        return <Info size={20} color={T.primary} strokeWidth={1.8} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: T.bg }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: T.card,
                borderRadius: T.radius.full,
                paddingVertical: 6,
                paddingLeft: 6,
                paddingRight: 16,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>{greeting}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }}>{adminName}</Text>
              </View>
            </View>
            <View
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
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </View>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: T.textDark, marginTop: 16 }} numberOfLines={1}>
            {theme.schoolName || 'School'}
          </Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{roleLabel}</Text>
        </View>
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
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 12, backgroundColor: T.bg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                try {
                  navigation.navigate('Profile');
                } catch (_e) {}
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: T.card,
                borderRadius: T.radius.full,
                paddingVertical: 6,
                paddingLeft: 6,
                paddingRight: 16,
                ...T.shadowSm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: T.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: T.textWhite }}>{initials}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 10, color: T.textPlaceholder, fontWeight: '500' }}>{greeting}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.textDark }} numberOfLines={1}>
                  {adminName}
                </Text>
              </View>
            </TouchableOpacity>
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
          </View>
          <Text style={{ fontSize: 26, fontWeight: '900', color: T.textDark, marginTop: 16 }} numberOfLines={2}>
            {theme.schoolName || 'School'}
          </Text>
          <Text style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{roleLabel}</Text>
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
            {visibleActions.map((action) => {
              const ActionIcon = action.Icon;
              return (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <View style={styles.quickActionIcon}>
                  <ActionIcon size={20} color={T.primary} strokeWidth={1.8} />
                </View>
                <Text style={[styles.quickActionText, { color: T.textDark }]}>{action.title}</Text>
              </TouchableOpacity>
            );
            })}
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
              <View style={styles.activityIcon}>{renderActivityIcon(activity.type)}</View>
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
    fontSize: 17,
    fontWeight: '800',
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
    fontWeight: '900',
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
    fontWeight: '800',
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
