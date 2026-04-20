import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SchoolRideColors, SchoolRideTypography } from '../theme/SchoolRideTheme';
import GlassCard from './GlassCard';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  title = 'Quick Actions',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <GlassCard
              variant="white"
              padding={20}
              borderRadius={20}
              style={styles.card}
            >
              <View style={[styles.iconContainer, { backgroundColor: action.color || SchoolRideColors.primary.start }]}>
                <Text style={styles.icon}>{action.icon}</Text>
              </View>
              <Text style={styles.label}>{action.label}</Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.semibold,
    fontSize: SchoolRideTypography.sizes.lg,
    color: SchoolRideColors.dark,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  actionCard: {
    marginRight: 16,
  },
  card: {
    minWidth: 120,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: SchoolRideColors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 20,
    color: SchoolRideColors.white,
  },
  label: {
    fontFamily: SchoolRideTypography.fontFamily,
    fontWeight: SchoolRideTypography.weights.medium,
    fontSize: SchoolRideTypography.sizes.sm,
    color: SchoolRideColors.darkGray,
    textAlign: 'center',
  },
});

export default QuickActions;
