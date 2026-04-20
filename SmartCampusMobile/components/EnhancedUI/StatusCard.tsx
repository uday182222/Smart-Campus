import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { FreedomColors, FreedomTypography } from '../../theme/FreedomTheme';

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
  style?: any;
}

const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = FreedomColors.primary.start,
  trend,
  trendValue,
  onPress,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'neutral':
        return '➡️';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#34C759';
      case 'down':
        return '#FF3B30';
      case 'neutral':
        return FreedomColors.text.secondary;
      default:
        return FreedomColors.text.secondary;
    }
  };

  const CardContent = () => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
          ],
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {trend && trendValue && (
          <View style={[styles.trendContainer, { backgroundColor: getTrendColor() + '20' }]}>
            <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: FreedomColors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: FreedomColors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: FreedomColors.lightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.medium,
    fontSize: FreedomTypography.sizes.sm,
    color: FreedomColors.text.secondary,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  trendText: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.semibold,
    fontSize: FreedomTypography.sizes.xs,
  },
  valueContainer: {
    alignItems: 'flex-start',
  },
  value: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.bold,
    fontSize: FreedomTypography.sizes['3xl'],
    lineHeight: FreedomTypography.sizes['3xl'] * FreedomTypography.lineHeights.tight,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.regular,
    fontSize: FreedomTypography.sizes.sm,
    color: FreedomColors.text.tertiary,
  },
});

export default StatusCard;

