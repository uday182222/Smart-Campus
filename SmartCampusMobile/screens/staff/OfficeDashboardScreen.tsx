// @ts-nocheck
/**
 * Office Staff Dashboard Screen
 * Central hub for office staff with quick actions and overview
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

// Services
import AppointmentService from '../../services/AppointmentService';
import GalleryService from '../../services/GalleryService';
import CalendarService from '../../services/CalendarService';

const { width } = Dimensions.get('window');

interface DashboardStats {
  pendingAppointments: number;
  recentCommunications: number;
  upcomingEvents: number;
  recentGalleryUploads: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
}

interface RecentActivity {
  id: string;
  type: 'communication' | 'appointment' | 'gallery' | 'event';
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
}

const OfficeDashboardScreen: React.FC = ({ navigation }: any) => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingAppointments: 0,
    recentCommunications: 0,
    upcomingEvents: 0,
    recentGalleryUploads: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Post Announcement',
      icon: 'campaign',
      color: '#3498DB',
      route: 'PostAnnouncement',
    },
    {
      id: '2',
      title: 'Upload Photos',
      icon: 'photo-library',
      color: '#2ECC71',
      route: 'GalleryManagement',
    },
    {
      id: '3',
      title: 'Add Event',
      icon: 'event',
      color: '#9B59B6',
      route: 'CalendarManagement',
    },
    {
      id: '4',
      title: 'Fee Reminder',
      icon: 'payment',
      color: '#E67E22',
      route: 'FeeReminder',
    },
    {
      id: '5',
      title: 'Appointments',
      icon: 'schedule',
      color: '#1ABC9C',
      route: 'AppointmentManagement',
    },
    {
      id: '6',
      title: 'Communications',
      icon: 'message',
      color: '#E74C3C',
      route: 'Communications',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load statistics
      const [appointmentsData, eventsData, galleryStats] = await Promise.all([
        AppointmentService.getAppointmentsByStatus('pending'),
        CalendarService.getAllEvents(),
        GalleryService.getGalleryStatistics(),
      ]);

      const now = new Date();
      const upcomingEventsData = eventsData.filter(
        event => new Date(event.startDate) > now
      ).slice(0, 5);

      setStats({
        pendingAppointments: appointmentsData.length,
        recentCommunications: 12, // This would come from communications service
        upcomingEvents: upcomingEventsData.length,
        recentGalleryUploads: galleryStats.recentUploads || 0,
      });

      setUpcomingEvents(upcomingEventsData);

      // Generate recent activities (mock data - would come from activity log)
      setRecentActivities([
        {
          id: '1',
          type: 'communication',
          title: 'Announcement Posted',
          description: 'Holiday notice sent to all parents',
          time: '10 minutes ago',
          icon: 'campaign',
          color: '#3498DB',
        },
        {
          id: '2',
          type: 'gallery',
          title: 'Photos Uploaded',
          description: 'Sports Day event - 24 photos',
          time: '1 hour ago',
          icon: 'photo-library',
          color: '#2ECC71',
        },
        {
          id: '3',
          type: 'appointment',
          title: 'Appointment Approved',
          description: 'Parent meeting scheduled for tomorrow',
          time: '2 hours ago',
          icon: 'check-circle',
          color: '#1ABC9C',
        },
        {
          id: '4',
          type: 'event',
          title: 'Event Created',
          description: 'Annual Day scheduled for next month',
          time: '3 hours ago',
          icon: 'event',
          color: '#9B59B6',
        },
        {
          id: '5',
          type: 'communication',
          title: 'Fee Reminder Sent',
          description: 'Sent to 45 parents with pending dues',
          time: '5 hours ago',
          icon: 'payment',
          color: '#E67E22',
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

  const handleQuickAction = (action: QuickAction) => {
    navigation.navigate(action.route);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'communication': return 'campaign';
      case 'appointment': return 'schedule';
      case 'gallery': return 'photo-library';
      case 'event': return 'event';
      default: return 'notifications';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Good Morning!</Text>
            <Text style={styles.headerTitle}>Office Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color="#FFF" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {stats.pendingAppointments}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4ECDC4']}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#3498DB' }]}>
            <MaterialIcons name="schedule" size={32} color="#FFF" />
            <Text style={styles.statNumber}>{stats.pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pending Appointments</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#2ECC71' }]}>
            <MaterialIcons name="photo-library" size={32} color="#FFF" />
            <Text style={styles.statNumber}>{stats.recentGalleryUploads}</Text>
            <Text style={styles.statLabel}>Recent Uploads</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#9B59B6' }]}>
            <MaterialIcons name="event" size={32} color="#FFF" />
            <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
            <Text style={styles.statLabel}>Upcoming Events</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E67E22' }]}>
            <MaterialIcons name="message" size={32} color="#FFF" />
            <Text style={styles.statNumber}>{stats.recentCommunications}</Text>
            <Text style={styles.statLabel}>Communications</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <MaterialIcons name={action.icon as any} size={28} color="#FFF" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CalendarManagement')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming events</Text>
          ) : (
            upcomingEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDay}>
                    {new Date(event.startDate).getDate()}
                  </Text>
                  <Text style={styles.eventMonth}>
                    {new Date(event.startDate).toLocaleDateString('en', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventTime}>
                    {event.startTime} - {event.endTime}
                  </Text>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                </View>
                <View style={[styles.eventType, { backgroundColor: getEventTypeColor(event.type) }]}>
                  <MaterialIcons name={getEventTypeIcon(event.type) as any} size={16} color="#FFF" />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                <MaterialIcons name={activity.icon as any} size={20} color="#FFF" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'holiday': return '#E74C3C';
    case 'exam': return '#9B59B6';
    case 'sports': return '#2ECC71';
    case 'meeting': return '#3498DB';
    case 'celebration': return '#F39C12';
    default: return '#95A5A6';
  }
};

const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'holiday': return 'beach-access';
    case 'exam': return 'school';
    case 'sports': return 'sports';
    case 'meeting': return 'group';
    case 'celebration': return 'celebration';
    default: return 'event';
  }
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
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
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  statLabel: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
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
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  eventDate: {
    width: 50,
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  eventDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  eventMonth: {
    fontSize: 10,
    color: '#FFF',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#4ECDC4',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  eventType: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default OfficeDashboardScreen;



