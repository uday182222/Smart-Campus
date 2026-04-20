// @ts-nocheck
/**
 * Modern Transport Tracking Screen - Real-time bus tracking
 * Like modern map apps with bottom sheet
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

// UI Components
import { IconButton, Avatar, GradientButton, ModernCard } from '../../components/ui';

// Theme
import { colors, spacing, typography, gradients, shadows, borderRadius } from '../../theme';

interface Stop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'passed' | 'current' | 'upcoming';
  eta?: string;
  time?: string;
  isChildStop?: boolean;
}

interface BusLocation {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  lastUpdate: Date;
}

const { width, height } = Dimensions.get('window');

const TransportTrackingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  
  // Mock data
  const [busInfo] = useState({
    number: '12',
    name: 'Green Route',
    helperName: 'John Driver',
    helperPhone: '+1234567890',
    helperPhoto: null,
  });

  const [busLocation, setBusLocation] = useState<BusLocation>({
    latitude: 28.6139,
    longitude: 77.2090,
    heading: 45,
    speed: 35,
    lastUpdate: new Date(),
  });

  const [stops] = useState<Stop[]>([
    {
      id: '1',
      name: 'School',
      address: '123 School Street',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'passed',
      time: '7:00 AM',
    },
    {
      id: '2',
      name: 'Market Road Stop',
      address: '456 Market Road',
      latitude: 28.6159,
      longitude: 77.2110,
      status: 'passed',
      time: '7:15 AM',
    },
    {
      id: '3',
      name: 'Park Avenue Stop',
      address: '789 Park Avenue',
      latitude: 28.6179,
      longitude: 77.2130,
      status: 'current',
      eta: '2 min',
    },
    {
      id: '4',
      name: 'Maple Street Stop',
      address: '101 Maple Street',
      latitude: 28.6199,
      longitude: 77.2150,
      status: 'upcoming',
      eta: '8 min',
      isChildStop: true,
    },
    {
      id: '5',
      name: 'Final Stop',
      address: '202 Final Road',
      latitude: 28.6219,
      longitude: 77.2170,
      status: 'upcoming',
      eta: '15 min',
    },
  ]);

  const childStop = stops.find(s => s.isChildStop);

  // Simulate bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBusLocation(prev => ({
        ...prev,
        latitude: prev.latitude + 0.0002,
        longitude: prev.longitude + 0.0001,
        heading: (prev.heading + 5) % 360,
        lastUpdate: new Date(),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCallHelper = () => {
    Linking.openURL(`tel:${busInfo.helperPhone}`);
  };

  const handleEmergency = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Call school emergency number
    Linking.openURL('tel:911');
  };

  const recenterMap = () => {
    mapRef.current?.animateToRegion({
      latitude: busLocation.latitude,
      longitude: busLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const getStopColor = (status: Stop['status']) => {
    switch (status) {
      case 'passed':
        return colors.text.disabled;
      case 'current':
        return colors.status.success;
      case 'upcoming':
        return colors.primary.main;
    }
  };

  const routeCoordinates = stops.map(s => ({
    latitude: s.latitude,
    longitude: s.longitude,
  }));

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: busLocation.latitude,
          longitude: busLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Route Line */}
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={colors.primary.main}
          strokeWidth={4}
        />

        {/* Stop Markers */}
        {stops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={[
                styles.stopMarker,
                {
                  backgroundColor: stop.isChildStop
                    ? colors.accent.orange
                    : getStopColor(stop.status),
                  width: stop.isChildStop ? 32 : 24,
                  height: stop.isChildStop ? 32 : 24,
                  borderRadius: stop.isChildStop ? 16 : 12,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  stop.status === 'passed'
                    ? 'check'
                    : stop.isChildStop
                    ? 'star'
                    : 'map-marker'
                }
                size={stop.isChildStop ? 18 : 14}
                color={colors.text.white}
              />
            </View>
          </Marker>
        ))}

        {/* Bus Marker */}
        <Marker
          coordinate={{
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.busMarker}>
            <MaterialCommunityIcons
              name="bus"
              size={24}
              color={colors.text.white}
            />
          </View>
        </Marker>
      </MapView>

      {/* Top Info Bar */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.topBar}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarContent}>
            <IconButton
              icon="arrow-left"
              variant="white"
              onPress={() => navigation.goBack()}
            />
            <ModernCard variant="default" style={styles.etaCard}>
              <View style={styles.etaContent}>
                <MaterialCommunityIcons
                  name="bus"
                  size={24}
                  color={colors.primary.main}
                />
                <View style={styles.etaText}>
                  <Text style={styles.busNumber}>Bus {busInfo.number}</Text>
                  <Text style={styles.etaValue}>
                    {childStop?.eta || 'N/A'} away
                  </Text>
                </View>
              </View>
            </ModernCard>
            <IconButton
              icon="refresh"
              variant="white"
              onPress={recenterMap}
            />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={recenterMap}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={colors.primary.main}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.delay(500).springify()}
        style={[
          styles.bottomSheet,
          isBottomSheetExpanded && styles.bottomSheetExpanded,
        ]}
      >
        {/* Handle */}
        <TouchableOpacity
          style={styles.bottomSheetHandle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsBottomSheetExpanded(!isBottomSheetExpanded);
          }}
        >
          <View style={styles.handleBar} />
        </TouchableOpacity>

        {/* Collapsed Content: Child's Stop */}
        {!isBottomSheetExpanded && childStop && (
          <View style={styles.collapsedContent}>
            <View style={styles.childStopIcon}>
              <MaterialCommunityIcons
                name="star"
                size={24}
                color={colors.accent.orange}
              />
            </View>
            <View style={styles.childStopInfo}>
              <Text style={styles.childStopName}>{childStop.name}</Text>
              <Text style={styles.childStopAddress}>{childStop.address}</Text>
            </View>
            <View style={styles.childStopEta}>
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaLarge}>{childStop.eta}</Text>
            </View>
          </View>
        )}

        {/* Expanded Content */}
        {isBottomSheetExpanded && (
          <View style={styles.expandedContent}>
            {/* Bus Info */}
            <View style={styles.busInfoCard}>
              <Avatar
                name={busInfo.helperName}
                source={busInfo.helperPhoto}
                size="large"
              />
              <View style={styles.busInfoText}>
                <Text style={styles.busName}>
                  Bus {busInfo.number} - {busInfo.name}
                </Text>
                <Text style={styles.helperName}>{busInfo.helperName}</Text>
              </View>
              <View style={styles.busInfoActions}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallHelper}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={20}
                    color={colors.text.white}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyButton}
                  onPress={handleEmergency}
                >
                  <MaterialCommunityIcons
                    name="alert"
                    size={20}
                    color={colors.text.white}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* All Stops */}
            <Text style={styles.stopsTitle}>Route Stops</Text>
            <View style={styles.stopsList}>
              {stops.map((stop, index) => (
                <View key={stop.id} style={styles.stopItem}>
                  <View style={styles.stopTimeline}>
                    <View
                      style={[
                        styles.stopDot,
                        {
                          backgroundColor: stop.isChildStop
                            ? colors.accent.orange
                            : getStopColor(stop.status),
                        },
                      ]}
                    >
                      {stop.status === 'current' && (
                        <Animated.View
                          style={styles.pulsingDot}
                        />
                      )}
                      {stop.isChildStop && (
                        <MaterialCommunityIcons
                          name="star"
                          size={10}
                          color={colors.text.white}
                        />
                      )}
                    </View>
                    {index < stops.length - 1 && (
                      <View
                        style={[
                          styles.stopLine,
                          {
                            backgroundColor:
                              stop.status === 'passed'
                                ? colors.text.disabled
                                : colors.border.default,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.stopDetails}>
                    <Text
                      style={[
                        styles.stopName,
                        stop.status === 'passed' && styles.stopNamePassed,
                        stop.isChildStop && styles.stopNameHighlight,
                      ]}
                    >
                      {stop.name}
                      {stop.isChildStop && ' ⭐'}
                    </Text>
                    <Text style={styles.stopTime}>
                      {stop.status === 'passed'
                        ? stop.time
                        : stop.eta
                        ? `ETA: ${stop.eta}`
                        : 'Pending'}
                    </Text>
                  </View>
                  {stop.status === 'passed' && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={colors.text.disabled}
                    />
                  )}
                </View>
              ))}
            </View>

            {/* Live Status */}
            <View style={styles.liveStatus}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>
                Speed: {busLocation.speed} km/h • Updated{' '}
                {Math.round(
                  (Date.now() - busLocation.lastUpdate.getTime()) / 1000
                )}
                s ago
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  etaCard: {
    flex: 1,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  etaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    marginLeft: spacing.sm,
  },
  busNumber: {
    ...typography.captionBold,
    color: colors.text.secondary,
  },
  etaValue: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: 260,
    gap: spacing.sm,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  stopMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.white,
    ...shadows.small,
  },
  busMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary.main,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background.white,
    ...shadows.medium,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    paddingBottom: spacing.xl,
    ...shadows.large,
    maxHeight: height * 0.25,
  },
  bottomSheetExpanded: {
    maxHeight: height * 0.65,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  childStopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childStopInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  childStopName: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  childStopAddress: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  childStopEta: {
    alignItems: 'center',
  },
  etaLabel: {
    ...typography.tiny,
    color: colors.text.tertiary,
  },
  etaLarge: {
    ...typography.h3,
    color: colors.primary.main,
  },
  expandedContent: {
    paddingHorizontal: spacing.lg,
  },
  busInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.subtle,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  busInfoText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  busName: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  helperName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  busInfoActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopsTitle: {
    ...typography.captionBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  stopsList: {
    marginBottom: spacing.md,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopTimeline: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.md,
  },
  stopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.status.success,
    opacity: 0.3,
  },
  stopLine: {
    width: 2,
    height: 32,
  },
  stopDetails: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  stopName: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  stopNamePassed: {
    color: colors.text.disabled,
  },
  stopNameHighlight: {
    color: colors.accent.orange,
  },
  stopTime: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
    marginRight: spacing.xs,
  },
  liveText: {
    ...typography.small,
    color: colors.text.tertiary,
  },
});

export default TransportTrackingScreen;

