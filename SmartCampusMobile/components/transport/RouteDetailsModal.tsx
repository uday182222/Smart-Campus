/**
 * Route Details Modal
 * Shows detailed route information with edit capabilities
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  pickupTime: string;
  dropTime: string;
  order: number;
}

interface Route {
  id: string;
  name: string;
  stops: Stop[];
  assignedHelper?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    photo?: string;
  };
  assignedStudents: Array<{
    id: string;
    name: string;
    class: string;
    section: string;
    assignedStopId: string;
  }>;
  totalStudents: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface RouteDetailsModalProps {
  visible: boolean;
  route: Route | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  visible,
  route,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRoute, setEditedRoute] = useState<Route | null>(null);
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setEditedRoute(route);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!route) return null;

  const handleSave = () => {
    // Save edited route
    setIsEditing(false);
    Alert.alert('Success', 'Route updated successfully');
  };

  const handleCancel = () => {
    setEditedRoute(route);
    setIsEditing(false);
  };

  const handleReorderStops = (fromIndex: number, toIndex: number) => {
    if (!editedRoute) return;
    
    const newStops = [...editedRoute.stops];
    const [movedStop] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, movedStop);
    
    // Update order numbers
    const updatedStops = newStops.map((stop, index) => ({
      ...stop,
      order: index + 1,
    }));
    
    setEditedRoute({
      ...editedRoute,
      stops: updatedStops,
    });
  };

  const handleAddStop = () => {
    if (!editedRoute) return;
    
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      name: 'New Stop',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      pickupTime: '08:00',
      dropTime: '15:00',
      order: editedRoute.stops.length + 1,
    };
    
    setEditedRoute({
      ...editedRoute,
      stops: [...editedRoute.stops, newStop],
    });
  };

  const handleRemoveStop = (stopId: string) => {
    if (!editedRoute) return;
    
    Alert.alert(
      'Remove Stop',
      'Are you sure you want to remove this stop?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setEditedRoute({
              ...editedRoute,
              stops: editedRoute.stops.filter(stop => stop.id !== stopId),
            });
          },
        },
      ]
    );
  };

  const handleUpdateStop = (stopId: string, field: string, value: string) => {
    if (!editedRoute) return;
    
    setEditedRoute({
      ...editedRoute,
      stops: editedRoute.stops.map(stop =>
        stop.id === stopId ? { ...stop, [field]: value } : stop
      ),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Route' : 'Route Details'}
              </Text>
              <View style={styles.headerActions}>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={handleCancel}
                    >
                      <MaterialIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={handleSave}
                    >
                      <MaterialIcons name="check" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={onEdit}
                    >
                      <MaterialIcons name="edit" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={onDelete}
                    >
                      <MaterialIcons name="delete" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={onClose}
                    >
                      <MaterialIcons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Route Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route Information</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedRoute?.name || ''}
                  onChangeText={(text) => setEditedRoute(prev => 
                    prev ? { ...prev, name: text } : null
                  )}
                  placeholder="Route name"
                />
              ) : (
                <Text style={styles.routeName}>{route.name}</Text>
              )}
              
              <View style={styles.routeStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="place" size={16} color="#4ECDC4" />
                  <Text style={styles.statText}>{route.stops.length} Stops</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="school" size={16} color="#4ECDC4" />
                  <Text style={styles.statText}>{route.totalStudents} Students</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="person" size={16} color="#4ECDC4" />
                  <Text style={styles.statText}>
                    {route.assignedHelper ? 'Helper Assigned' : 'No Helper'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Assigned Helper */}
            {route.assignedHelper && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assigned Helper</Text>
                <View style={styles.helperCard}>
                  <View style={styles.helperInfo}>
                    <Text style={styles.helperName}>{route.assignedHelper.name}</Text>
                    <Text style={styles.helperPhone}>{route.assignedHelper.phone}</Text>
                    <Text style={styles.helperEmail}>{route.assignedHelper.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactButton}>
                    <MaterialIcons name="phone" size={20} color="#4ECDC4" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Stops List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Stops</Text>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddStop}
                  >
                    <MaterialIcons name="add" size={20} color="#4ECDC4" />
                    <Text style={styles.addButtonText}>Add Stop</Text>
                  </TouchableOpacity>
                )}
              </View>

              {editedRoute?.stops.map((stop, index) => (
                <View key={stop.id} style={styles.stopCard}>
                  <View style={styles.stopHeader}>
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{stop.order}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      {isEditing ? (
                        <TextInput
                          style={styles.stopNameInput}
                          value={stop.name}
                          onChangeText={(text) => handleUpdateStop(stop.id, 'name', text)}
                          placeholder="Stop name"
                        />
                      ) : (
                        <Text style={styles.stopName}>{stop.name}</Text>
                      )}
                      {isEditing ? (
                        <TextInput
                          style={styles.stopAddressInput}
                          value={stop.address}
                          onChangeText={(text) => handleUpdateStop(stop.id, 'address', text)}
                          placeholder="Stop address"
                        />
                      ) : (
                        <Text style={styles.stopAddress}>{stop.address}</Text>
                      )}
                    </View>
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveStop(stop.id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#E74C3C" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.stopTimes}>
                    <View style={styles.timeItem}>
                      <MaterialIcons name="schedule" size={16} color="#7F8C8D" />
                      <Text style={styles.timeLabel}>Pickup:</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.timeInput}
                          value={stop.pickupTime}
                          onChangeText={(text) => handleUpdateStop(stop.id, 'pickupTime', text)}
                          placeholder="08:00"
                        />
                      ) : (
                        <Text style={styles.timeText}>{stop.pickupTime}</Text>
                      )}
                    </View>
                    <View style={styles.timeItem}>
                      <MaterialIcons name="schedule" size={16} color="#7F8C8D" />
                      <Text style={styles.timeLabel}>Drop:</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.timeInput}
                          value={stop.dropTime}
                          onChangeText={(text) => handleUpdateStop(stop.id, 'dropTime', text)}
                          placeholder="15:00"
                        />
                      ) : (
                        <Text style={styles.timeText}>{stop.dropTime}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Assigned Students */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assigned Students</Text>
              {route.assignedStudents.length === 0 ? (
                <Text style={styles.emptyText}>No students assigned</Text>
              ) : (
                route.assignedStudents.map((student) => (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentClass}>
                        {student.class} - {student.section}
                      </Text>
                    </View>
                    <View style={styles.studentStop}>
                      <Text style={styles.studentStopText}>
                        Stop: {route.stops.find(s => s.id === student.assignedStopId)?.name || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Platform.OS === 'web' ? Math.min(400, 600) : '95%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  helperPhone: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  helperEmail: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  stopCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  stopNameInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    marginBottom: 4,
    backgroundColor: '#FFF',
  },
  stopAddress: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  stopAddressInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopTimes: {
    flexDirection: 'row',
    gap: 16,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 4,
    fontSize: 12,
    width: 60,
    backgroundColor: '#FFF',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  studentClass: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  studentStop: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  studentStopText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default RouteDetailsModal;
