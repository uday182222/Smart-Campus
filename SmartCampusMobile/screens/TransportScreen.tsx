// @ts-nocheck
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import TransportService from '../services/TransportService';
import { TransportRoute, TransportStats, StopStatus, StudentStatus } from '../models/TransportModel';

const TransportScreen: React.FC = () => {
  const { userData } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [stats, setStats] = useState<TransportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [liveTracking, setLiveTracking] = useState<any>(null);
  const [trackingRouteId, setTrackingRouteId] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Poll for live tracking updates
  useEffect(() => {
    if (!trackingRouteId) return;

    const interval = setInterval(() => {
      loadLiveTracking(trackingRouteId);
    }, 5000); // Update every 5 seconds

    // Load immediately
    loadLiveTracking(trackingRouteId);

    return () => clearInterval(interval);
  }, [trackingRouteId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load transport routes
      const allRoutes = await TransportService.getAllRoutes();
      setRoutes(allRoutes);
      
      // Load transport statistics
      const transportStats = await TransportService.getTransportStats();
      setStats(transportStats);
    } catch (error) {
      console.error('Error loading transport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveTracking = async (routeId: string) => {
    try {
      setTrackingLoading(true);
      const tracking = await TransportService.getLiveTracking(routeId);
      setLiveTracking(tracking);
    } catch (error) {
      console.error('Error loading live tracking:', error);
      Alert.alert('Error', 'Failed to load live tracking data');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackLive = (routeId: string) => {
    setTrackingRouteId(routeId);
    setShowRouteModal(true);
    loadLiveTracking(routeId);
  };

  const updateStopStatus = async (routeId: string, stopId: string, status: StopStatus) => {
    try {
      const result = await TransportService.updateStopStatus(routeId, stopId, status);
      if (result.success) {
        await loadData();
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update stop status');
    }
  };

  const updateStudentStatus = async (routeId: string, stopId: string, studentId: string, status: StudentStatus) => {
    try {
      const result = await TransportService.updateStudentStatus(routeId, stopId, studentId, status);
      if (result.success) {
        await loadData();
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update student status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'maintenance': return '#F59E0B';
      case 'suspended': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'arrived': return '#10B981';
      case 'departed': return '#6366F1';
      case 'skipped': return '#EF4444';
      case 'waiting': return '#F59E0B';
      case 'boarded': return '#10B981';
      case 'dropped': return '#6366F1';
      case 'absent': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'van': return '🚐';
      case 'car': return '🚗';
      case 'minibus': return '🚐';
      default: return '🚌';
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading transport data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚌 Transport Management</Text>
        <Text style={styles.headerSubtitle}>Track buses and student transportation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalRoutes}</Text>
              <Text style={styles.statLabel}>Total Routes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeRoutes}</Text>
              <Text style={styles.statLabel}>Active Routes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.onTimePercentage}%</Text>
              <Text style={styles.statLabel}>On Time</Text>
            </View>
          </View>
        )}

        {/* Routes List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transport Routes ({routes.length})</Text>
          {routes.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.routeName}</Text>
                  <Text style={styles.routeNumber}>{route.routeNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(route.status) }]}>
                  <Text style={styles.statusText}>{route.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <View style={styles.routeDetails}>
                <View style={styles.routeDetail}>
                  <Text style={styles.routeDetailIcon}>{getVehicleIcon(route.vehicleType)}</Text>
                  <Text style={styles.routeDetailText}>{route.vehicleNumber}</Text>
                </View>
                <View style={styles.routeDetail}>
                  <Text style={styles.routeDetailIcon}>👨‍💼</Text>
                  <Text style={styles.routeDetailText}>{route.driverName}</Text>
                </View>
                <View style={styles.routeDetail}>
                  <Text style={styles.routeDetailIcon}>👥</Text>
                  <Text style={styles.routeDetailText}>{route.capacity} capacity</Text>
                </View>
              </View>

              <View style={styles.stopsPreview}>
                <Text style={styles.stopsTitle}>Stops ({route.stops.length}):</Text>
                {route.stops.slice(0, 2).map((stop) => (
                  <View key={stop.id} style={styles.stopPreview}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <Text style={styles.stopTime}>{formatTime(stop.estimatedArrivalTime)}</Text>
                    <View style={[styles.stopStatus, { backgroundColor: getStatusColor(stop.status) }]}>
                      <Text style={styles.stopStatusText}>{stop.status}</Text>
                    </View>
                  </View>
                ))}
                {route.stops.length > 2 && (
                  <Text style={styles.moreStops}>+{route.stops.length - 2} more stops</Text>
                )}
              </View>

              <View style={styles.routeActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedRoute(route);
                    setShowRouteModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.trackButton]}
                  onPress={() => handleTrackLive(route.id)}
                >
                  <Text style={styles.actionButtonText}>Track Live</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Route Details Modal */}
      <Modal
        visible={showRouteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRouteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedRoute?.routeName} - {selectedRoute?.routeNumber}
            </Text>
            
            {selectedRoute && (
              <ScrollView style={styles.modalScrollView}>
                {/* Live Tracking Section */}
                {trackingRouteId === selectedRoute.id && (
                  <View style={styles.liveTrackingSection}>
                    <Text style={styles.liveTrackingTitle}>📍 Live Bus Location</Text>
                    {trackingLoading && (
                      <Text style={styles.loadingText}>Loading location...</Text>
                    )}
                    {liveTracking?.latestLocation ? (
                      <View style={styles.locationInfo}>
                        <View style={styles.locationRow}>
                          <Text style={styles.locationLabel}>Latitude:</Text>
                          <Text style={styles.locationValue}>{liveTracking.latestLocation.latitude.toFixed(6)}</Text>
                        </View>
                        <View style={styles.locationRow}>
                          <Text style={styles.locationLabel}>Longitude:</Text>
                          <Text style={styles.locationValue}>{liveTracking.latestLocation.longitude.toFixed(6)}</Text>
                        </View>
                        {liveTracking.latestLocation.speed !== null && (
                          <View style={styles.locationRow}>
                            <Text style={styles.locationLabel}>Speed:</Text>
                            <Text style={styles.locationValue}>{liveTracking.latestLocation.speed.toFixed(1)} km/h</Text>
                          </View>
                        )}
                        {liveTracking.latestLocation.heading !== null && (
                          <View style={styles.locationRow}>
                            <Text style={styles.locationLabel}>Heading:</Text>
                            <Text style={styles.locationValue}>{liveTracking.latestLocation.heading.toFixed(0)}°</Text>
                          </View>
                        )}
                        <View style={styles.locationRow}>
                          <Text style={styles.locationLabel}>Last Update:</Text>
                          <Text style={styles.locationValue}>
                            {new Date(liveTracking.latestLocation.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                        {liveTracking.latestLocation.stopStatus && (
                          <View style={styles.stopStatusBadge}>
                            <Text style={styles.stopStatusText}>
                              Stop: {liveTracking.latestLocation.stopStatus.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        {liveTracking.recentPath.length > 0 && (
                          <View style={styles.pathInfo}>
                            <Text style={styles.pathLabel}>
                              Recent Path: {liveTracking.recentPath.length} points
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : !trackingLoading && (
                      <Text style={styles.noLocationText}>No live location data available</Text>
                    )}
                  </View>
                )}

                {/* Driver Info */}
                <View style={styles.driverInfo}>
                  <Text style={styles.driverTitle}>Driver Information</Text>
                  <Text style={styles.driverName}>👨‍💼 {selectedRoute.driverName}</Text>
                  <Text style={styles.driverPhone}>📞 {selectedRoute.driverPhone}</Text>
                  <Text style={styles.vehicleInfo}>
                    {getVehicleIcon(selectedRoute.vehicleType)} {selectedRoute.vehicleNumber} ({selectedRoute.vehicleType})
                  </Text>
                </View>

                {/* Schedule */}
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>Schedule</Text>
                  <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleSectionTitle}>Morning Route</Text>
                    <Text style={styles.scheduleTime}>
                      {selectedRoute.schedule.morning.startTime} - {selectedRoute.schedule.morning.endTime}
                    </Text>
                  </View>
                  <View style={styles.scheduleSection}>
                    <Text style={styles.scheduleSectionTitle}>Evening Route</Text>
                    <Text style={styles.scheduleTime}>
                      {selectedRoute.schedule.evening.startTime} - {selectedRoute.schedule.evening.endTime}
                    </Text>
                  </View>
                </View>

                {/* Stops */}
                <View style={styles.stopsInfo}>
                  <Text style={styles.stopsTitle}>Route Stops</Text>
                  {selectedRoute.stops.map((stop, index) => (
                    <View key={stop.id} style={styles.stopCard}>
                      <View style={styles.stopHeader}>
                        <Text style={styles.stopNumber}>{index + 1}</Text>
                        <Text style={styles.stopName}>{stop.name}</Text>
                        <View style={[styles.stopStatusBadge, { backgroundColor: getStatusColor(stop.status) }]}>
                          <Text style={styles.stopStatusText}>{stop.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.stopAddress}>📍 {stop.address}</Text>
                      <Text style={styles.stopTime}>
                        ETA: {formatTime(stop.estimatedArrivalTime)}
                        {stop.actualArrivalTime && ` | Actual: ${formatTime(stop.actualArrivalTime)}`}
                      </Text>
                      
                      <View style={styles.stopActions}>
                        <TouchableOpacity
                          style={[styles.stopActionButton, { backgroundColor: '#10B981' }]}
                          onPress={() => updateStopStatus(selectedRoute.id, stop.id, 'arrived')}
                        >
                          <Text style={styles.stopActionButtonText}>Arrived</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.stopActionButton, { backgroundColor: '#6366F1' }]}
                          onPress={() => updateStopStatus(selectedRoute.id, stop.id, 'departed')}
                        >
                          <Text style={styles.stopActionButtonText}>Departed</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Students at this stop */}
                      <View style={styles.studentsSection}>
                        <Text style={styles.studentsTitle}>Students ({stop.students.length})</Text>
                        {stop.students.map((student) => (
                          <View key={student.id} style={styles.studentCard}>
                            <View style={styles.studentInfo}>
                              <Text style={styles.studentName}>{student.name}</Text>
                              <Text style={styles.studentClass}>{student.className}</Text>
                              <Text style={styles.studentTimes}>
                                Board: {formatTime(student.boardingTime)} | Drop: {formatTime(student.alightingTime)}
                              </Text>
                            </View>
                            <View style={styles.studentActions}>
                              <TouchableOpacity
                                style={[styles.studentActionButton, { backgroundColor: getStatusColor(student.status) }]}
                                onPress={() => updateStudentStatus(selectedRoute.id, stop.id, student.id, 'boarded')}
                              >
                                <Text style={styles.studentActionButtonText}>Board</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.studentActionButton, { backgroundColor: '#6366F1' }]}
                                onPress={() => updateStudentStatus(selectedRoute.id, stop.id, student.id, 'dropped')}
                              >
                                <Text style={styles.studentActionButtonText}>Drop</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowRouteModal(false)}
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
    color: '#6366F1',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#6366F1',
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  routeNumber: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeDetailIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  routeDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stopsPreview: {
    marginBottom: 16,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  stopPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stopTime: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  stopStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stopStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  moreStops: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    width: '95%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  driverInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  driverTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#374151',
  },
  scheduleInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  scheduleSection: {
    marginBottom: 8,
  },
  scheduleSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  stopsInfo: {
    marginBottom: 16,
  },
  stopCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 8,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  stopStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stopAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  stopActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stopActionButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  stopActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  studentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  studentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  studentTimes: {
    fontSize: 10,
    color: '#6b7280',
  },
  studentActions: {
    flexDirection: 'row',
  },
  studentActionButton: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  studentActionButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#6366F1',
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
  liveTrackingSection: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  liveTrackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  locationInfo: {
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  pathInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pathLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  noLocationText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default TransportScreen;