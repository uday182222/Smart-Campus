/**
 * EmptyState - Empty state with illustration and action
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { GradientButton } from './GradientButton';
import { colors, typography, spacing } from '../../theme';

interface EmptyStateProps {
  icon?: string;
  illustration?: any;
  title: string;
  message: string;
  action?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  illustration,
  title,
  message,
  action,
  onActionPress,
}) => {
  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.container}>
      {illustration ? (
        <Image source={illustration} style={styles.illustration} />
      ) : icon ? (
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={icon as any}
            size={64}
            color={colors.text.disabled}
          />
        </View>
      ) : null}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {action && onActionPress && (
        <View style={styles.buttonContainer}>
          <GradientButton title={action} onPress={onActionPress} size="medium" />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  illustration: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});

export default EmptyState;
