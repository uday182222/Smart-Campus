import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LightHeader } from '../components/ui';
import { LT } from '../constants/lightTheme';
import { useNavigation } from '@react-navigation/native';

const FeeManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={LT.primaryDark} />
      <LightHeader title="Fee Management" showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.title}>💰 Fee Management</Text>
        <Text style={styles.subtitle}>Manage school fees and payments</Text>
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>🚧 Coming Soon</Text>
          <Text style={styles.description}>
            This feature will allow you to view fee structures, make payments, and track payment history.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LT.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LT.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: LT.textMuted,
    marginBottom: 40,
    textAlign: 'center',
  },
  comingSoon: {
    backgroundColor: LT.card,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LT.cardBorder,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LT.primary,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: LT.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default FeeManagementScreen;
