// @ts-nocheck
/**
 * Bus Helper Dashboard Screen
 * Main interface for bus helpers with route view and stop marking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

// Components
import StopMarkingModal from '../../components/helper/StopMarkingModal';
import StudentBoardingModal from '../../components/helper/StudentBoardingModal';
import NavigationModal from '../../components/helper/NavigationModal';

// Services
import HelperService from '../../services/HelperService';

const { width } = Dimensions.get('window');

interface BusStop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimatedTime: string;
  students: Student[];
  status: 'pending' | 'reached' | 'completed';
  actualArrivalTime?: Date;
  markedBy?: string;
}

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  photo?: string;
  parentName: string;
  parentPhone: string;
  boardingStatus?: 'boarded' | 'absent' | 'pending';
  boardingTime?: Date;
  notes?: string;
}

interface RouteData {
  id: string;
  name: string;
  busNumber: string;
  helper: {
    id: string;
    name: string;
    phone: string;
  };
  stops: BusStop[];
  totalStudents: number;
  startTime: string;
  endTime: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

const HelperDashboardScreen: React.FC = ({ route, navigation }: any) => {
  const { helper, route: initialRoute, offlineMode = false } = route.params;
  
  const [routeData, setRouteData] = useState<RouteData>(initialRoute);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);
  
  // Modal states
  const [showStopMarking, setShowStopMarking] = useState(false);
  const [showStudentBoarding, setShowStudentBoarding] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);

  useEffect(() => {
    startLocationTracking();
    loadTodaysSchedule();
  }, []);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking');
        return;
      }

      setLocationTracking(true);

      // Start continuous location tracking
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 50, // Or when moved 50 meters
        },
        (location) => {
          setCurrentLocation(location);
          
          // Broadcast location to server
          if (!offlineMode) {
            HelperService.updateLocation(helper.id, routeData.id, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date(location.timestamp),
            });
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const loadTodaysSchedule = async () => {
    try {
      if (!offlineMode) {
        const schedule = await HelperService.getTodaySchedule(routeData.id);
        setRouteData(schedule);
        
        // Find current stop
        const currentStop = schedule.stops.findIndex(stop => stop.status === 'pending');
        if (currentStop !== -1) {
          setCurrentStopIndex(currentStop);
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodaysSchedule();
    setRefreshing(false);
  };

  const handleStopPress = (stop: BusStop, index: number) => {
    setSelectedStop(stop);
    setCurrentStopIndex(index);
    setShowStopMarking(true);
  };

  const handleStopMarked = async (stopId: string, location: Location.LocationObject) => {
    try {
      if (offlineMode) {
        Alert.alert('Offline Mode', 'Stop will be synced when online');
      }

      // Update stop status
      await HelperService.markStopReached(routeData.id, stopId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(),
        helperId: helper.id,
      });

      // Update local state
      setRouteData(prev => ({
        ...prev,
        stops: prev.stops.map(stop =>
          stop.id === stopId
            ? { ...stop, status: 'reached', actualArrivalTime: new Date() }
            : stop
        ),
      }));

      // Show student boarding modal
      setShowStopMarking(false);
      setShowStudentBoarding(true);

      Alert.alert('Success', 'Stop marked! Parents have been notified.');
    } catch (error) {
      console.error('Error marking stop:', error);
      Alert.alert('Error', 'Failed to mark stop. Please try again.');
    }
  };

  const handleStudentBoarding = async (studentId: string, status: 'boarded' | 'absent', notes?: string) => {
    try {
      await HelperService.updateStudentBoarding(routeData.id, selectedStop!.id, studentId, {
        status,
        boardingTime: new Date(),
        notes,
        helperId: helper.id,
      });

      // Update local state
      setRouteData(prev => ({
        ...prev,
        stops: prev.stops.map(stop =>
          stop.id === selectedStop!.id
            ? {
                ...stop,
                students: stop.students.map(student =>
                  student.id === studentId
                    ? { ...student, boardingStatus: status, boardingTime: new Date(), notes }
                    : student
                ),
              }
            : stop
        ),
      }));

      // Notify parent
      if (!offlineMode) {
        await HelperService.notifyParentBoarding(studentId, status, selectedStop!.name);
      }
    } catch (error) {
      console.error('Error updating student boarding:', error);
      Alert.alert('Error', 'Failed to update student status');
    }
  };

  const handleCompleteStop = async () => {
    if (!selectedStop) return;

    const allStudentsProcessed = selectedStop.students.every(
      student => student.boardingStatus && student.boardingStatus !== 'pending'
    );

    if (!allStudentsProcessed) {
      Alert.alert(
        'Incomplete',
        'Not all students have been marked. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: completeStop },
        ]
      );
    } else {
      completeStop();
    }
  };

  const completeStop = async () => {
    try {
      await HelperService.completeStop(routeData.id, selectedStop!.id);

      setRouteData(prev => ({
        ...prev,
        stops: prev.stops.map(stop =>
          stop.id === selectedStop!.id
            ? { ...stop, status: 'completed' }
            : stop
        ),
      }));

      setShowStudentBoarding(false);

      // Move to next stop
      if (currentStopIndex < routeData.stops.length - 1) {
        setCurrentStopIndex(currentStopIndex + 1);
      } else {
        Alert.alert('Route Complete', 'All stops have been completed!');
      }
    } catch (error) {
      console.error('Error completing stop:', error);
      Alert.alert('Error', 'Failed to complete stop');
    }
  };

  const handleNavigation = (stop: BusStop) => {
    setSelectedStop(stop);
    setShowNavigation(true);
  };

  const handleStartRoute = async () => {
    try {
      await HelperService.startRoute(routeData.id, helper.id);
      setRouteData(prev => ({ ...prev, status: 'in_progress' }));
      Alert.alert('Success', 'Route started! Parents will be notified.');
    } catch (error) {
      Alert.alert('Error', 'Failed to start route');
    }
  };

  const handleCompleteRoute = async () => {
    Alert.alert(
      'Complete Route',
      'Are you sure you want to complete this route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await HelperService.completeRoute(routeData.id);
              setRouteData(prev => ({ ...prev, status: 'completed' }));
              Alert.alert('Success', 'Route completed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete route');
            }
          },
        },
      ]
    );
  };

  const getStopStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#2ECC71';
      case 'reached': return '#F39C12';
      case 'pending': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getStopStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'reached': return 'location-on';
      case 'pending': return 'radio-button-unchecked';
      default: return 'help';
    }
  };

  const completedStops = routeData.stops.filter(stop => stop.status === 'completed').length;
  const totalStops = routeData.stops.length;
  const progress = (completedStops / totalStops) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F39C12', '#E67E22']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hello, {helper.name}!</Text>
            <Text style={styles.routeName}>Route: {routeData.name}</Text>
            <Text style={styles.busNumber}>Bus: {routeData.busNumber}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('HelperProfile')}
            >
              <MaterialIcons name="account-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <MaterialIcons name="location-on" size={16} color="#FFF" />
            <Text style={styles.statusText}>
              {locationTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </Text>
          </View>
          {offlineMode && (
            <View style={styles.offlineBadge}>
              <MaterialIcons name="cloud-off" size={16} color="#FFF" />
              <Text style={styles.statusText}>Offline</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {completedStops} of {totalStops} stops completed
          </Text>
          <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Route Controls */}
      {routeData.status === 'not_started' && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
            <MaterialIcons name="play-arrow" size={24} color="#FFF" />
            <Text style={styles.startButtonText}>Start Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {routeData.status === 'in_progress' && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.completeButton} onPress={handleCompleteRoute}>
            <MaterialIcons name="done-all" size={24} color="#FFF" />
            <Text style={styles.completeButtonText}>Complete Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Current Stop Highlight */}
      {routeData.status === 'in_progress' && currentStopIndex < routeData.stops.length && (
        <View style={styles.currentStopContainer}>
          <Text style={styles.currentStopLabel}>CURRENT STOP</Text>
          <View style={styles.currentStopCard}>
            <View style={styles.currentStopInfo}>
              <Text style={styles.currentStopName}>
                {routeData.stops[currentStopIndex].name}
              </Text>
              <Text style={styles.currentStopAddress}>
                {routeData.stops[currentStopIndex].address}
              </Text>
              <Text style={styles.currentStopStudents}>
                {routeData.stops[currentStopIndex].students.length} students
              </Text>
            </View>
            <View style={styles.currentStopActions}>
              <TouchableOpacity
                style={styles.markButton}
                onPress={() => handleStopPress(routeData.stops[currentStopIndex], currentStopIndex)}
              >
                <MaterialIcons name="check-circle" size={24} color="#FFF" />
                <Text style={styles.markButtonText}>Mark as Reached</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => handleNavigation(routeData.stops[currentStopIndex])}
              >
                <MaterialIcons name="navigation" size={20} color="#3498DB" />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* All Stops List */}
      <ScrollView
        style={styles.stopsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#F39C12']}
          />
        }
      >
        <Text style={styles.sectionTitle}>All Stops</Text>
        {routeData.stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id}
            style={[
              styles.stopCard,
              index === currentStopIndex && routeData.status === 'in_progress' && styles.stopCardActive,
            ]}
            onPress={() => handleStopPress(stop, index)}
          >
            <View style={styles.stopSequence}>
              <MaterialIcons
                name={getStopStatusIcon(stop.status) as any}
                size={32}
                color={getStopStatusColor(stop.status)}
              />
              <Text style={styles.stopNumber}>{index + 1}</Text>
            </View>

            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.stopAddress}>{stop.address}</Text>
              <View style={styles.stopDetails}>
                <View style={styles.stopDetailItem}>
                  <MaterialIcons name="schedule" size={14} color="#7F8C8D" />
                  <Text style={styles.stopDetailText}>{stop.estimatedTime}</Text>
                </View>
                <View style={styles.stopDetailItem}>
                  <MaterialIcons name="people" size={14} color="#7F8C8D" />
                  <Text style={styles.stopDetailText}>{stop.students.length} students</Text>
                </View>
              </View>
            </View>

            <View style={styles.stopActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleNavigation(stop)}
              >
                <MaterialIcons name="navigation" size={20} color="#3498DB" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modals */}
      <StopMarkingModal
        visible={showStopMarking}
        stop={selectedStop}
        currentLocation={currentLocation}
        onClose={() => setShowStopMarking(false)}
        onMarkReached={handleStopMarked}
      />

      <StudentBoardingModal
        visible={showStudentBoarding}
        stop={selectedStop}
        onClose={() => setShowStudentBoarding(false)}
        onStudentBoarding={handleStudentBoarding}
        onCompleteStop={handleCompleteStop}
      />

      <NavigationModal
        visible={showNavigation}
        stop={selectedStop}
        currentLocation={currentLocation}
        onClose={() => setShowNavigation(false)}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  busNumber: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  headerButton: {
    padding: 4,
  },
  statusBar: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F39C12',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F39C12',
    borderRadius: 4,
  },
  controlsContainer: {
    padding: 20,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  currentStopContainer: {
    padding: 20,
  },
  currentStopLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 12,
  },
  currentStopCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
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
  currentStopInfo: {
    marginBottom: 16,
  },
  currentStopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  currentStopAddress: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  currentStopStudents: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F39C12',
  },
  currentStopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  markButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F39C12',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  markButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  stopsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    marginTop: 8,
  },
  stopCard: {
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
  stopCardActive: {
    borderWidth: 2,
    borderColor: '#F39C12',
  },
  stopSequence: {
    alignItems: 'center',
    marginRight: 16,
  },
  stopNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginTop: 4,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  stopAddress: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  stopDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  stopDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopDetailText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  stopActions: {
    marginLeft: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HelperDashboardScreen;



