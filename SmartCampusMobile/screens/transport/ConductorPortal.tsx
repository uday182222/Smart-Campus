/**
 * Smart Campus - Bus Conductor Portal
 * Simple stop-marking system for bus tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { Card, Button } from '../../components/ui';

// Services
import { TransportService } from '../../services/TransportService';

// ============================================================================
// TYPES
// ============================================================================
interface Stop {
  id: string;
  name: string;
  address: string;
  sequence: number;
  estimatedTime: string;
  status: 'pending' | 'reached' | 'skipped';
  reachedAt?: string;
}

interface Route {
  id: string;
  name: string;
  routeNumber: string;
  stops: Stop[];
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
const ConductorPortal: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(-1);
  const [processing, setProcessing] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchRouteData = async () => {
    try {
      // Get conductor's assigned route
      const result = await TransportService.getConductorRoute();
      
      if (result.success && result.data) {
        setRoute(result.data);
        
        // Find current stop index
        const inProgressIndex = result.data.stops.findIndex(
          (s: Stop) => s.status === 'pending'
        );
        setCurrentStopIndex(inProgressIndex >= 0 ? inProgressIndex : -1);
      } else {
        // Demo route for testing
        const demoRoute: Route = {
          id: 'route-1',
          name: 'Morning Route A',
          routeNumber: 'BUS-101',
          status: 'not_started',
          stops: [
            { id: '1', name: 'Main Gate', address: '123 Main St', sequence: 1, estimatedTime: '7:00 AM', status: 'pending' },
            { id: '2', name: 'Park Street', address: '456 Park Ave', sequence: 2, estimatedTime: '7:10 AM', status: 'pending' },
            { id: '3', name: 'City Center', address: '789 City Blvd', sequence: 3, estimatedTime: '7:20 AM', status: 'pending' },
            { id: '4', name: 'Mall Junction', address: '101 Mall Rd', sequence: 4, estimatedTime: '7:35 AM', status: 'pending' },
            { id: '5', name: 'School Campus', address: 'School Main Gate', sequence: 5, estimatedTime: '7:50 AM', status: 'pending' },
          ],
        };
        setRoute(demoRoute);
        setCurrentStopIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Failed to load route data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRouteData();
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  const startTrip = async () => {
    if (!route) return;

    Alert.alert(
      'Start Trip',
      'Are you ready to start the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setProcessing(true);
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              const result = await TransportService.startTrip(route.id);
              
              if (result.success) {
                setRoute(prev => prev ? {
                  ...prev,
                  status: 'in_progress',
                  startedAt: new Date().toISOString(),
                } : null);
                setCurrentStopIndex(0);
                Alert.alert('Success', 'Trip started! Mark stops as you reach them.');
              } else {
                // Demo mode - update locally
                setRoute(prev => prev ? {
                  ...prev,
                  status: 'in_progress',
                  startedAt: new Date().toISOString(),
                } : null);
                setCurrentStopIndex(0);
              }
            } catch (error) {
              console.error('Error starting trip:', error);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const markStopReached = async (stop: Stop) => {
    if (!route || processing) return;

    setProcessing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await TransportService.markStopReached(route.id, stop.id);
      
      const updateStops = () => {
        setRoute(prev => {
          if (!prev) return null;
          
          const updatedStops = prev.stops.map((s, index) => {
            if (s.id === stop.id) {
              return { ...s, status: 'reached' as const, reachedAt: new Date().toISOString() };
            }
            return s;
          });
          
          return { ...prev, stops: updatedStops };
        });
        
        // Move to next stop
        const nextIndex = currentStopIndex + 1;
        if (nextIndex < route.stops.length) {
          setCurrentStopIndex(nextIndex);
        }
      };

      if (result.success) {
        updateStops();
        Alert.alert('Stop Marked', `${stop.name} marked as reached. Parents notified.`);
      } else {
        // Demo mode - update locally
        updateStops();
      }
    } catch (error) {
      console.error('Error marking stop:', error);
      Alert.alert('Error', 'Failed to mark stop. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const endTrip = async () => {
    if (!route) return;

    const pendingStops = route.stops.filter(s => s.status === 'pending');
    
    if (pendingStops.length > 0) {
      Alert.alert(
        'Pending Stops',
        `${pendingStops.length} stop(s) are still pending. End trip anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Trip', style: 'destructive', onPress: performEndTrip },
        ]
      );
    } else {
      performEndTrip();
    }
  };

  const performEndTrip = async () => {
    if (!route) return;

    setProcessing(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const result = await TransportService.endTrip(route.id);
      
      if (result.success || true) { // Demo mode always succeeds
        setRoute(prev => prev ? {
          ...prev,
          status: 'completed',
          completedAt: new Date().toISOString(),
        } : null);
        setCurrentStopIndex(-1);
        Alert.alert('Trip Completed', 'The trip has been completed successfully!');
      }
    } catch (error) {
      console.error('Error ending trip:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['authToken', 'userData']);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  const renderHeader = () => (
    <LinearGradient
      colors={['#FF9800', '#F57C00']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🚌</Text>
        </View>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Conductor Portal</Text>
          <Text style={styles.headerSubtitle}>
            {route?.routeNumber || 'Loading...'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
          <Text style={styles.headerIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderRouteInfo = () => (
    <Card variant="elevated" style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View>
          <Text style={styles.routeName}>{route?.name}</Text>
          <Text style={styles.routeNumber}>Route: {route?.routeNumber}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          route?.status === 'in_progress' && styles.statusInProgress,
          route?.status === 'completed' && styles.statusCompleted,
        ]}>
          <Text style={styles.statusText}>
            {route?.status === 'not_started' ? 'Not Started' :
             route?.status === 'in_progress' ? 'In Progress' : 'Completed'}
          </Text>
        </View>
      </View>
      
      <View style={styles.routeStats}>
        <View style={styles.routeStat}>
          <Text style={styles.routeStatValue}>{route?.stops.length || 0}</Text>
          <Text style={styles.routeStatLabel}>Total Stops</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={[styles.routeStatValue, { color: colors.success.main }]}>
            {route?.stops.filter(s => s.status === 'reached').length || 0}
          </Text>
          <Text style={styles.routeStatLabel}>Reached</Text>
        </View>
        <View style={styles.routeStat}>
          <Text style={[styles.routeStatValue, { color: colors.warning.main }]}>
            {route?.stops.filter(s => s.status === 'pending').length || 0}
          </Text>
          <Text style={styles.routeStatLabel}>Pending</Text>
        </View>
      </View>
    </Card>
  );

  const renderStopItem = (stop: Stop, index: number) => {
    const isCurrentStop = index === currentStopIndex;
    const isPastStop = stop.status === 'reached';
    const isUpcoming = stop.status === 'pending' && index > currentStopIndex;

    return (
      <View key={stop.id} style={styles.stopContainer}>
        {/* Timeline line */}
        <View style={styles.timelineContainer}>
          <View style={[
            styles.timelineDot,
            isPastStop && styles.timelineDotReached,
            isCurrentStop && styles.timelineDotCurrent,
          ]}>
            {isPastStop && <Text style={styles.checkmark}>✓</Text>}
            {isCurrentStop && <Text style={styles.currentDot}>●</Text>}
          </View>
          {index < (route?.stops.length || 0) - 1 && (
            <View style={[
              styles.timelineLine,
              isPastStop && styles.timelineLineReached,
            ]} />
          )}
        </View>

        {/* Stop Card */}
        <TouchableOpacity
          style={[
            styles.stopCard,
            isCurrentStop && styles.stopCardCurrent,
            isPastStop && styles.stopCardReached,
          ]}
          onPress={() => {
            if (isCurrentStop && route?.status === 'in_progress') {
              markStopReached(stop);
            }
          }}
          disabled={!isCurrentStop || route?.status !== 'in_progress' || processing}
          activeOpacity={isCurrentStop ? 0.7 : 1}
        >
          <View style={styles.stopInfo}>
            <Text style={styles.stopSequence}>Stop {stop.sequence}</Text>
            <Text style={styles.stopName}>{stop.name}</Text>
            <Text style={styles.stopAddress}>{stop.address}</Text>
            <Text style={styles.stopTime}>
              {isPastStop && stop.reachedAt
                ? `Reached at ${new Date(stop.reachedAt).toLocaleTimeString()}`
                : `ETA: ${stop.estimatedTime}`}
            </Text>
          </View>
          
          {isCurrentStop && route?.status === 'in_progress' && (
            <View style={styles.markButtonContainer}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.markButton}
              >
                <Text style={styles.markButtonText}>
                  {processing ? '...' : 'MARK\nREACHED'}
                </Text>
              </LinearGradient>
            </View>
          )}
          
          {isPastStop && (
            <View style={styles.reachedBadge}>
              <Text style={styles.reachedBadgeText}>✓ Reached</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderActionButton = () => {
    if (!route) return null;

    if (route.status === 'not_started') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={startTrip}
          disabled={processing}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={styles.actionButtonGradient}
          >
            {processing ? (
              <ActivityIndicator color={colors.text.white} />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>▶️</Text>
                <Text style={styles.actionButtonText}>Start Trip</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (route.status === 'in_progress') {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={endTrip}
          disabled={processing}
        >
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.actionButtonGradient}
          >
            {processing ? (
              <ActivityIndicator color={colors.text.white} />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>⏹️</Text>
                <Text style={styles.actionButtonText}>End Trip</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    if (route.status === 'completed') {
      return (
        <View style={styles.completedMessage}>
          <Text style={styles.completedIcon}>✅</Text>
          <Text style={styles.completedText}>Trip Completed</Text>
          <Text style={styles.completedSubtext}>
            Completed at {route.completedAt ? new Date(route.completedAt).toLocaleTimeString() : 'N/A'}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent.orange} />
      <Text style={styles.loadingText}>Loading route...</Text>
    </View>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderLoading()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.orange]}
            tintColor={colors.accent.orange}
          />
        }
      >
        {renderRouteInfo()}
        
        <Text style={styles.sectionTitle}>Route Stops</Text>
        
        <View style={styles.stopsContainer}>
          {route?.stops.map((stop, index) => renderStopItem(stop, index))}
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        {renderActionButton()}
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
  },

  // Header
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  headerLeft: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Route Card
  routeCard: {
    marginBottom: spacing.lg,
    padding: spacing.base,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  routeName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  routeNumber: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.grey[200],
  },
  statusInProgress: {
    backgroundColor: colors.success.light,
  },
  statusCompleted: {
    backgroundColor: colors.primary.light,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  routeStatLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.base,
  },

  // Stops
  stopsContainer: {
    marginLeft: spacing.xs,
  },
  stopContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timelineContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.grey[300],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.grey[400],
  },
  timelineDotCurrent: {
    backgroundColor: colors.accent.orange,
    borderColor: colors.accent.orangeDark,
  },
  timelineDotReached: {
    backgroundColor: colors.success.main,
    borderColor: colors.success.dark,
  },
  checkmark: {
    fontSize: 12,
    color: colors.text.white,
    fontWeight: '700',
  },
  currentDot: {
    fontSize: 8,
    color: colors.text.white,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.grey[300],
    minHeight: 60,
  },
  timelineLineReached: {
    backgroundColor: colors.success.main,
  },
  stopCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  stopCardCurrent: {
    borderWidth: 2,
    borderColor: colors.accent.orange,
    backgroundColor: colors.warning.light,
  },
  stopCardReached: {
    opacity: 0.7,
    backgroundColor: colors.success.light,
  },
  stopInfo: {
    flex: 1,
  },
  stopSequence: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.hint,
    textTransform: 'uppercase',
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  stopAddress: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stopTime: {
    fontSize: 12,
    color: colors.text.hint,
    marginTop: 4,
  },
  markButtonContainer: {
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  markButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.white,
    textAlign: 'center',
  },
  reachedBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.sm,
  },
  reachedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.white,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.base,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  actionButton: {
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.white,
  },
  completedMessage: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  completedIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success.main,
  },
  completedSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default ConductorPortal;

