// @ts-nocheck
/**
 * Transport Management Screen
 * Complete transport system for admin users
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Plus, Search, Bus, Eye, Pencil, Trash2, User, School, UserPlus, Users, CheckCircle2, XCircle } from 'lucide-react-native';
import { T } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

// Components
import RouteList from '../../components/transport/RouteList';
import RouteDetailsModal from '../../components/transport/RouteDetailsModal';
import HelperAssignmentModal from '../../components/transport/HelperAssignmentModal';
import StudentAssignmentModal from '../../components/transport/StudentAssignmentModal';
import AddRouteModal from '../../components/transport/AddRouteModal';

// Services
import TransportService from '../../services/TransportService';

interface Route {
  id: string;
  name: string;
  stops: Stop[];
  assignedHelper?: Helper;
  assignedStudents: Student[];
  totalStudents: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface Stop {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  pickupTime: string;
  dropTime: string;
  order: number;
}

interface Helper {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  assignedRouteId?: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  parentPhone: string;
  assignedRouteId?: string;
  assignedStopId?: string;
  pickupPreference: 'morning' | 'evening' | 'both';
}

const TransportManagementScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  if (userData?.role === 'PRINCIPAL') {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: T.textMuted }}>Access restricted to Admin only.</Text>
      </View>
    );
  }
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showHelperAssignment, setShowHelperAssignment] = useState(false);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [showAddRoute, setShowAddRoute] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [routes, searchQuery, filterStatus]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await TransportService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const filterRoutes = () => {
    let filtered = routes;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.stops.some(stop =>
          stop.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(route => route.status === filterStatus);
    }

    setFilteredRoutes(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const handleRoutePress = (route: Route) => {
    setSelectedRoute(route);
    setShowRouteDetails(true);
  };

  const handleEditRoute = (route: Route) => {
    setSelectedRoute(route);
    setShowRouteDetails(true);
  };

  const handleDeleteRoute = async (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TransportService.deleteRoute(routeId);
              await loadRoutes();
              Alert.alert('Success', 'Route deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete route');
            }
          },
        },
      ]
    );
  };

  const handleAssignHelper = (route: Route) => {
    setSelectedRoute(route);
    setShowHelperAssignment(true);
  };

  const handleAssignStudents = (route: Route) => {
    setSelectedRoute(route);
    setShowStudentAssignment(true);
  };

  const handleAddRoute = () => {
    setShowAddRoute(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2ECC71';
      case 'inactive': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'check-circle';
      case 'inactive': return 'cancel';
      default: return 'help';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: T.px, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...T.font.appTitle, color: T.textDark }}>Admin</Text>
            <Text style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Transport Management</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }}>
              <Bell size={20} color={T.textDark} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadowSm }} onPress={handleAddRoute}>
              <Plus size={20} color={T.textWhite} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={T.textPlaceholder} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or stops..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={T.textPlaceholder}
          />
        </View>

        <View style={styles.filterContainer}>
          {['all', 'active', 'inactive'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{routes.length}</Text>
          <Text style={styles.statLabel}>Total Routes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {routes.filter(r => r.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active Routes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {routes.reduce((sum, r) => sum + r.totalStudents, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
      </View>

      {/* Routes List */}
      <ScrollView
        style={styles.routesContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading routes...</Text>
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primaryLight, borderWidth: 1.5, borderColor: T.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={34} color={T.primary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>No Routes Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first route to get started'}
            </Text>
          </View>
        ) : (
          filteredRoutes.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <View style={styles.routeMeta}>
                    <View style={styles.routeStatus}>
                      {route.status === 'active' ? <CheckCircle2 size={16} color={T.success} strokeWidth={1.8} /> : <XCircle size={16} color={T.danger} strokeWidth={1.8} />}
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(route.status) },
                        ]}
                      >
                        {route.status}
                      </Text>
                    </View>
                    <Text style={styles.stopsCount}>
                      {route.stops.length} stops
                    </Text>
                  </View>
                </View>

                <View style={styles.routeActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRoutePress(route)}
                  >
                    <Eye size={18} color={T.primary} strokeWidth={1.8} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditRoute(route)}
                  >
                    <Pencil size={18} color={T.primary} strokeWidth={1.8} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteRoute(route.id)}
                  >
                    <Trash2 size={18} color={T.danger} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.routeDetails}>
                <View style={styles.detailItem}>
                  <User size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={styles.detailText}>
                    {route.assignedHelper?.name || 'No helper assigned'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <School size={16} color={T.textPlaceholder} strokeWidth={1.8} />
                  <Text style={styles.detailText}>
                    {route.totalStudents} students
                  </Text>
                </View>
              </View>

              <View style={styles.routeFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.assignButton]}
                  onPress={() => handleAssignHelper(route)}
                >
                  <UserPlus size={16} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={styles.footerButtonText}>Assign Helper</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.studentsButton]}
                  onPress={() => handleAssignStudents(route)}
                >
                  <Users size={16} color={T.textWhite} strokeWidth={1.8} />
                  <Text style={styles.footerButtonText}>Assign Students</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <RouteDetailsModal
        visible={showRouteDetails}
        route={selectedRoute}
        onClose={() => setShowRouteDetails(false)}
        onEdit={() => {
          setShowRouteDetails(false);
          // Handle edit
        }}
        onDelete={() => {
          setShowRouteDetails(false);
          if (selectedRoute) {
            handleDeleteRoute(selectedRoute.id);
          }
        }}
      />

      <HelperAssignmentModal
        visible={showHelperAssignment}
        route={selectedRoute}
        onClose={() => setShowHelperAssignment(false)}
        onAssign={async (helperId) => {
          if (selectedRoute) {
            try {
              await TransportService.assignHelper(selectedRoute.id, helperId);
              await loadRoutes();
              Alert.alert('Success', 'Helper assigned successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to assign helper');
            }
          }
          setShowHelperAssignment(false);
        }}
      />

      <StudentAssignmentModal
        visible={showStudentAssignment}
        route={selectedRoute}
        onClose={() => setShowStudentAssignment(false)}
        onAssign={async (studentIds) => {
          if (selectedRoute) {
            try {
              await TransportService.assignStudents(selectedRoute.id, studentIds);
              await loadRoutes();
              Alert.alert('Success', 'Students assigned successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to assign students');
            }
          }
          setShowStudentAssignment(false);
        }}
      />

      <AddRouteModal
        visible={showAddRoute}
        onClose={() => setShowAddRoute(false)}
        onSave={async (routeData) => {
          try {
            await TransportService.createRoute(routeData);
            await loadRoutes();
            Alert.alert('Success', 'Route created successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to create route');
          }
          setShowAddRoute(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  searchContainer: {
    paddingHorizontal: T.px,
    paddingBottom: 12,
    backgroundColor: T.bg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: T.textDark,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    ...T.shadowSm,
  },
  filterButtonActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.textMuted,
  },
  filterButtonTextActive: {
    color: T.textWhite,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: T.px,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    padding: 16,
    borderRadius: T.radius.xxl,
    alignItems: 'center',
    ...T.shadowSm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: T.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: T.textMuted,
    textAlign: 'center',
  },
  routesContainer: {
    flex: 1,
    paddingHorizontal: T.px,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: T.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: T.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: T.card,
    borderRadius: T.radius.xxl,
    padding: 16,
    marginBottom: 16,
    ...T.shadowSm,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: T.textDark,
    marginBottom: 4,
  },
  routeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stopsCount: {
    fontSize: 12,
    color: T.textMuted,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.primaryLight,
    borderWidth: 1.5,
    borderColor: T.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: T.textMuted,
  },
  routeFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  assignButton: {
    backgroundColor: T.primary,
  },
  studentsButton: {
    backgroundColor: T.primary,
  },
  footerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: T.textWhite,
  },
});

export default TransportManagementScreen;
