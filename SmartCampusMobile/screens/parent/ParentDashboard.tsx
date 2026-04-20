// @ts-nocheck
/**
 * Modern Parent Dashboard - Inspired by Edumate
 * Beautiful, colorful dashboard for parents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// UI Components
import {
  StatCard,
  ActionCard,
  ProgressCard,
  SectionHeader,
  Avatar,
  IconButton,
  ModernCard,
  GradientButton,
  Badge,
} from '../../components/ui';

// Theme
import { colors, spacing, typography, gradients, shadows, borderRadius } from '../../theme';

// Auth Context
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const ParentDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { userData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  // Children data (mock)
  const [children] = useState([
    {
      id: '1',
      name: 'Tom Smith',
      class: '10-A',
      rollNo: '15',
      photo: null,
      attendance: 92,
      grade: 'A+',
    },
    {
      id: '2',
      name: 'Emma Smith',
      class: '7-B',
      rollNo: '8',
      photo: null,
      attendance: 95,
      grade: 'A',
    },
  ]);

  const selectedChild = children[selectedChildIndex];

  // Dashboard stats
  const [stats, setStats] = useState({
    attendance: '92%',
    homework: '5',
    fees: 'Paid',
    grade: 'A+',
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedChildIndex]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Today's classes
  const todayClasses = [
    { subject: 'Mathematics', time: '9:00 AM - 9:45 AM', isCurrentPeriod: true },
    { subject: 'Science', time: '10:00 AM - 10:45 AM', isCurrentPeriod: false },
    { subject: 'English', time: '11:00 AM - 11:45 AM', isCurrentPeriod: false },
  ];

  // Quick actions
  const quickActions = [
    { icon: 'bus', title: 'Track Bus', gradient: gradients.primary },
    { icon: 'book-open-variant', title: 'Homework', gradient: gradients.secondary },
    { icon: 'chart-line', title: 'Marks', gradient: gradients.purple },
    { icon: 'credit-card', title: 'Pay Fees', gradient: gradients.orange },
  ];

  // Recent activities
  const recentActivities = [
    {
      icon: 'clipboard-check',
      iconColor: colors.status.success,
      iconBgColor: colors.status.successLight,
      title: 'Attendance marked: Present',
      subtitle: 'Today, 8:30 AM',
    },
    {
      icon: 'book-edit',
      iconColor: colors.accent.orange,
      iconBgColor: '#FFF4E5',
      title: 'New homework: Math Chapter 5',
      subtitle: 'Due tomorrow',
    },
    {
      icon: 'trophy',
      iconColor: colors.accent.yellow,
      iconBgColor: '#FFF8E1',
      title: 'Science test result: 85/100',
      subtitle: 'Yesterday',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary.main} />

      {/* Header with Gradient */}
      <Animated.View entering={SlideInDown.duration(500)}>
        <LinearGradient
          colors={gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <IconButton
                icon="menu"
                variant="white"
                size="medium"
                onPress={() => navigation.openDrawer?.()}
              />
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>My Children</Text>
              </View>
              <View style={styles.headerRight}>
                <IconButton
                  icon="bell-outline"
                  variant="white"
                  size="medium"
                  badge={3}
                  onPress={() => navigation.navigate('Notifications')}
                />
                <IconButton
                  icon="cog-outline"
                  variant="white"
                  size="medium"
                  onPress={() => navigation.navigate('Settings')}
                />
              </View>
            </View>

            {/* Child Selector */}
            {children.length > 1 && (
              <View style={styles.childSelector}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childTab,
                      selectedChildIndex === index && styles.childTabActive,
                    ]}
                    onPress={() => setSelectedChildIndex(index)}
                  >
                    <Text
                      style={[
                        styles.childTabText,
                        selectedChildIndex === index && styles.childTabTextActive,
                      ]}
                    >
                      {child.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </SafeAreaView>

          <View style={styles.wave} />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary.main}
          />
        }
      >
        {/* Child Profile Card */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.profileCardContainer}
        >
          <ModernCard variant="elevated">
            <View style={styles.profileCard}>
              <Avatar
                source={selectedChild.photo}
                name={selectedChild.name}
                size="xlarge"
                status="online"
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{selectedChild.name}</Text>
                <Text style={styles.profileClass}>
                  Class {selectedChild.class} • Roll No. {selectedChild.rollNo}
                </Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatValue}>
                      {selectedChild.attendance}%
                    </Text>
                    <Text style={styles.profileStatLabel}>Attendance</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatValue}>
                      {selectedChild.grade}
                    </Text>
                    <Text style={styles.profileStatLabel}>Grade</Text>
                  </View>
                </View>
              </View>
            </View>
          </ModernCard>
        </Animated.View>

        {/* Quick Stats */}
        <SectionHeader title="Overview" />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <StatCard
              icon="calendar-check"
              iconColor={colors.status.success}
              iconBgColor={colors.status.successLight}
              value={stats.attendance}
              label="Attendance"
              trend="up"
              trendValue="+2%"
              delay={100}
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              icon="book-clock"
              iconColor={colors.accent.orange}
              iconBgColor="#FFF4E5"
              value={stats.homework}
              label="Pending"
              delay={200}
            />
          </View>
        </View>

        {/* Today's Classes */}
        <SectionHeader
          title="Today's Classes"
          action="View All"
          onActionPress={() => navigation.navigate('Timetable')}
        />
        <ModernCard variant="default">
          {todayClasses.map((cls, index) => (
            <View
              key={index}
              style={[
                styles.classItem,
                cls.isCurrentPeriod && styles.currentClassItem,
                index < todayClasses.length - 1 && styles.classItemBorder,
              ]}
            >
              <View
                style={[
                  styles.classIndicator,
                  cls.isCurrentPeriod && styles.currentClassIndicator,
                ]}
              />
              <View style={styles.classInfo}>
                <Text
                  style={[
                    styles.classSubject,
                    cls.isCurrentPeriod && styles.currentClassSubject,
                  ]}
                >
                  {cls.subject}
                  {cls.isCurrentPeriod && (
                    <Badge count={1} variant="success" size="small" />
                  )}
                </Text>
                <Text style={styles.classTime}>{cls.time}</Text>
              </View>
              {cls.isCurrentPeriod && (
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>NOW</Text>
                </View>
              )}
            </View>
          ))}
        </ModernCard>

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(action.title.replace(' ', ''))}
            >
              <Animated.View
                entering={FadeInDown.delay(100 * index).springify()}
              >
                <LinearGradient
                  colors={action.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickActionCard}
                >
                  <MaterialCommunityIcons
                    name={action.icon as any}
                    size={28}
                    color={colors.text.white}
                  />
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upcoming Events */}
        <SectionHeader
          title="Upcoming"
          action="View Calendar"
          onActionPress={() => navigation.navigate('Calendar')}
        />
        <ProgressCard
          title="Math Unit Test"
          subtitle="Chapter 5-7 • Prepare all exercises"
          progress={0.6}
          color={gradients.indigo}
          icon="file-document-edit"
          delay={400}
        />

        {/* Recent Activity */}
        <SectionHeader title="Recent Activity" />
        <View style={styles.activityList}>
          {recentActivities.map((activity, index) => (
            <ActionCard
              key={index}
              icon={activity.icon}
              iconColor={activity.iconColor}
              iconBgColor={activity.iconBgColor}
              title={activity.title}
              subtitle={activity.subtitle}
              showChevron={true}
              delay={100 * index}
            />
          ))}
        </View>

        {/* Contact Teacher */}
        <View style={styles.contactSection}>
          <GradientButton
            title="Contact Class Teacher"
            icon="message-text"
            gradient={gradients.primary}
            onPress={() => navigation.navigate('Messages')}
            fullWidth
          />
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  header: {
    paddingBottom: spacing.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.white,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  childSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  childTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  childTabActive: {
    backgroundColor: colors.text.white,
  },
  childTabText: {
    ...typography.bodyBold,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  childTabTextActive: {
    color: colors.secondary.main,
  },
  wave: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: colors.background.main,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  profileCardContainer: {
    marginTop: -spacing.xl,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  profileClass: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    ...typography.h4,
    color: colors.primary.main,
  },
  profileStatLabel: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  currentClassItem: {
    backgroundColor: colors.status.successLight,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
  },
  classItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  classIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.default,
    marginRight: spacing.md,
  },
  currentClassIndicator: {
    backgroundColor: colors.status.success,
  },
  classInfo: {
    flex: 1,
  },
  classSubject: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  currentClassSubject: {
    color: colors.status.successDark,
  },
  classTime: {
    ...typography.small,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  liveTag: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  liveTagText: {
    ...typography.tiny,
    color: colors.text.white,
    fontWeight: '700',
  },
  quickActionsScroll: {
    paddingRight: spacing.md,
  },
  quickActionCard: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadows.medium,
  },
  quickActionTitle: {
    ...typography.small,
    color: colors.text.white,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  activityList: {
    gap: spacing.sm,
  },
  contactSection: {
    marginTop: spacing.lg,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default ParentDashboard;

