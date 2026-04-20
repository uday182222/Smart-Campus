/**
 * Results Sidebar Component
 * Slide-in panel displaying all user's service results
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ServiceResultsAPIClient, { ServiceResultsAPI, ServiceResult, ServiceType } from '../services/ServiceResultsAPI';
import ServiceResultCard from './ServiceResultCard';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Platform.OS === 'web' ? 320 : width;

interface ResultsSidebarProps {
  visible: boolean;
  onClose: () => void;
  onResultSelect: (result: ServiceResult) => void;
  onAskAbout: (result: ServiceResult) => void;
}

const ResultsSidebar: React.FC<ResultsSidebarProps> = ({
  visible,
  onClose,
  onResultSelect,
  onAskAbout,
}) => {
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<ServiceType | 'all'>('all');
  const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadResults();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    filterResults();
  }, [results, searchQuery, selectedTab]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await ServiceResultsAPIClient.getUserResults({ limit: 50 });
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = results;

    // Filter by service type
    if (selectedTab !== 'all') {
      filtered = filtered.filter(r => r.serviceType === selectedTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.summary?.toLowerCase().includes(query) ||
        ServiceResultsAPI.getServiceName(r.serviceType).toLowerCase().includes(query)
      );
    }

    setFilteredResults(filtered);
  };

  const tabs: Array<{ key: ServiceType | 'all'; label: string; icon: string }> = [
    { key: 'all', label: 'All', icon: '📚' },
    { key: ServiceType.PALM, label: 'Palm', icon: '🤚' },
    { key: ServiceType.ASTROLOGY, label: 'Astro', icon: '⭐' },
    { key: ServiceType.VASTU, label: 'Vastu', icon: '🏠' },
    { key: ServiceType.NUMEROLOGY, label: 'Number', icon: '🔢' },
    { key: ServiceType.TAROT, label: 'Tarot', icon: '🃏' },
  ];

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No readings yet</Text>
      <Text style={styles.emptyText}>
        Your service results will appear here
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
            pointerEvents: visible ? 'auto' : 'none',
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Readings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#95A5A6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search readings..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#95A5A6"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color="#95A5A6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <FlatList
            horizontal
            data={tabs}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedTab === item.key && styles.tabActive,
                ]}
                onPress={() => setSelectedTab(item.key)}
              >
                <Text style={styles.tabIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    selectedTab === item.key && styles.tabLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Results List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
          </View>
        ) : (
          <FlatList
            data={filteredResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ServiceResultCard
                result={item}
                variant="expanded"
                onPress={() => onResultSelect(item)}
                onAskAbout={() => onAskAbout(item)}
                isNew={
                  new Date().getTime() - item.createdAt.getTime() <
                  24 * 60 * 60 * 1000
                }
              />
            )}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            onEndReached={() => {
              // Load more results if needed
            }}
            onEndReachedThreshold={0.5}
          />
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  sidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F8F9FA',
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C3E50',
  },
  tabs: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#4ECDC4',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default ResultsSidebar;

