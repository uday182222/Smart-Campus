// @ts-nocheck
/**
 * ActionCard - Action item card like "Academics", "Homework" sections
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { ModernCard } from './ModernCard';
import { Badge } from './Badge';
import { colors, typography, spacing } from '../../theme';

interface ActionCardProps {
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  badge?: number;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'error';
  onPress?: () => void;
  delay?: number;
  showChevron?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  iconColor = colors.primary.main,
  iconBgColor = colors.primary[100],
  title,
  subtitle,
  badge,
  badgeVariant = 'primary',
  onPress,
  delay = 0,
  showChevron = true,
}) => {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
      <ModernCard variant="default" onPress={onPress}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
            <MaterialCommunityIcons
              name={icon as any}
              size={28}
              color={iconColor}
            />
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right Side */}
          <View style={styles.rightContainer}>
            {badge !== undefined && badge > 0 && (
              <Badge count={badge} variant={badgeVariant} />
            )}
            {showChevron && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={colors.text.tertiary}
                style={styles.chevron}
              />
            )}
          </View>
        </View>
      </ModernCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});

export default ActionCard;

