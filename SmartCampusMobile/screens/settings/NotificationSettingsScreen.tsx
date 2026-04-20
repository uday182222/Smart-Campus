// @ts-nocheck
/**
 * Notification Settings Screen
 * Comprehensive notification preferences management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

// Services
import NotificationService, { NotificationPreferences } from '../../services/NotificationService';

const NotificationSettingsScreen: React.FC = ({ navigation }: any) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emergency: true,
    announcement: true,
    homework: true,
    fee: true,
    attendance: true,
    transport: true,
    appointment: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    sound: 'default',
    vibrate: true,
  });
  const [loading, setLoading] = useState(true);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const notificationCategories = [
    {
      key: 'emergency' as const,
      title: 'Emergency Alerts',
      description: 'Critical alerts that override silent mode',
      icon: 'warning',
      color: '#E74C3C',
      lockable: true,
    },
    {
      key: 'transport' as const,
      title: 'Transport Updates',
      description: 'Bus location and ETA notifications',
      icon: 'directions-bus',
      color: '#F39C12',
      lockable: false,
    },
    {
      key: 'attendance' as const,
      title: 'Attendance Alerts',
      description: 'Daily attendance notifications',
      icon: 'how-to-reg',
      color: '#3498DB',
      lockable: false,
    },
    {
      key: 'announcement' as const,
      title: 'Announcements',
      description: 'School announcements and updates',
      icon: 'campaign',
      color: '#9B59B6',
      lockable: false,
    },
    {
      key: 'homework' as const,
      title: 'Homework Reminders',
      description: 'Homework due date reminders',
      icon: 'assignment',
      color: '#2ECC71',
      lockable: false,
    },
    {
      key: 'fee' as const,
      title: 'Fee Reminders',
      description: 'Fee payment reminders',
      icon: 'payment',
      color: '#E67E22',
      lockable: false,
    },
    {
      key: 'appointment' as const,
      title: 'Appointments',
      description: 'Appointment confirmations and reminders',
      icon: 'event',
      color: '#1ABC9C',
      lockable: false,
    },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await NotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPreferences: NotificationPreferences) => {
    try {
      await NotificationService.savePreferences(updatedPreferences);
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const handleCategoryToggle = (category: keyof NotificationPreferences, value: boolean) => {
    // Emergency alerts cannot be disabled
    if (category === 'emergency' && !value) {
      Alert.alert(
        'Cannot Disable',
        'Emergency alerts are critical for student safety and cannot be disabled.'
      );
      return;
    }

    const updated = { ...preferences, [category]: value };
    savePreferences(updated);
  };

  const handleQuietHoursToggle = (value: boolean) => {
    const updated = { ...preferences, quietHoursEnabled: value };
    savePreferences(updated);
  };

  const handleTimeChange = (type: 'start' | 'end', time: Date) => {
    const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    const updated = {
      ...preferences,
      [type === 'start' ? 'quietHoursStart' : 'quietHoursEnd']: timeString,
    };
    
    savePreferences(updated);
    
    if (type === 'start') {
      setShowStartTimePicker(false);
    } else {
      setShowEndTimePicker(false);
    }
  };

  const handleSoundChange = (sound: 'default' | 'none' | 'custom') => {
    const updated = { ...preferences, sound };
    savePreferences(updated);
  };

  const handleVibrateToggle = (value: boolean) => {
    const updated = { ...preferences, vibrate: value };
    savePreferences(updated);
  };

  const handleTestNotification = async () => {
    await NotificationService.sendLocalNotification(
      'announcement',
      'Test Notification',
      'This is a test notification from Smart Campus',
      { test: true }
    );
    Alert.alert('Success', 'Test notification sent!');
  };

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Test Notification */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <MaterialIcons name="notifications-active" size={20} color="#FFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Categories</Text>
          <Text style={styles.sectionDescription}>
            Choose which types of notifications you want to receive
          </Text>

          {notificationCategories.map((category) => (
            <View key={category.key} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <MaterialIcons name={category.icon as any} size={24} color="#FFF" />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <Switch
                value={preferences[category.key]}
                onValueChange={(value) => handleCategoryToggle(category.key, value)}
                trackColor={{ false: '#E0E0E0', true: category.color }}
                thumbColor="#FFF"
                disabled={category.lockable && category.key === 'emergency'}
              />
            </View>
          ))}
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <Text style={styles.sectionDescription}>
            Mute non-critical notifications during specified hours (Emergency alerts excluded)
          </Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={handleQuietHoursToggle}
              trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
              thumbColor="#FFF"
            />
          </View>

          {preferences.quietHoursEnabled && (
            <>
              <TouchableOpacity
                style={styles.timeSelector}
                onPress={() => setShowStartTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color="#4ECDC4" />
                <Text style={styles.timeSelectorLabel}>Start Time</Text>
                <Text style={styles.timeSelectorValue}>{preferences.quietHoursStart}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#95A5A6" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeSelector}
                onPress={() => setShowEndTimePicker(true)}
              >
                <MaterialIcons name="access-time" size={20} color="#4ECDC4" />
                <Text style={styles.timeSelectorLabel}>End Time</Text>
                <Text style={styles.timeSelectorValue}>{preferences.quietHoursEnd}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#95A5A6" />
              </TouchableOpacity>

              {showStartTimePicker && (
                <DateTimePicker
                  value={parseTime(preferences.quietHoursStart)}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      handleTimeChange('start', selectedDate);
                    } else {
                      setShowStartTimePicker(false);
                    }
                  }}
                />
              )}

              {showEndTimePicker && (
                <DateTimePicker
                  value={parseTime(preferences.quietHoursEnd)}
                  mode="time"
                  is24Hour={false}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      handleTimeChange('end', selectedDate);
                    } else {
                      setShowEndTimePicker(false);
                    }
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Vibrate</Text>
            <Switch
              value={preferences.vibrate}
              onValueChange={handleVibrateToggle}
              trackColor={{ false: '#E0E0E0', true: '#4ECDC4' }}
              thumbColor="#FFF"
            />
          </View>

          <Text style={styles.settingGroupLabel}>Notification Sound</Text>
          {['default', 'none', 'custom'].map((sound) => (
            <TouchableOpacity
              key={sound}
              style={styles.radioOption}
              onPress={() => handleSoundChange(sound as any)}
            >
              <MaterialIcons
                name={preferences.sound === sound ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color="#4ECDC4"
              />
              <Text style={styles.radioLabel}>
                {sound.charAt(0).toUpperCase() + sound.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <MaterialIcons name="info" size={20} color="#3498DB" />
          <Text style={styles.infoText}>
            Your notification preferences are synced across all your devices
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
    lineHeight: 20,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#7F8C8D',
    lineHeight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  settingGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 20,
    marginBottom: 12,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  timeSelectorLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  timeSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  radioLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F4F8',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3498DB',
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;



