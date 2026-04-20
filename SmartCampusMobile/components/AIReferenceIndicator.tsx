/**
 * AI Reference Indicator Component
 * Visual indicators when AI references service results
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ServiceResultsAPI, ServiceResult } from '../services/ServiceResultsAPI';

interface AIReferenceIndicatorProps {
  result: ServiceResult;
  onPress?: () => void;
  variant?: 'chip' | 'badge' | 'inline';
}

const AIReferenceIndicator: React.FC<AIReferenceIndicatorProps> = ({
  result,
  onPress,
  variant = 'chip',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Highlight flash
    Animated.sequence([
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(highlightAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const icon = ServiceResultsAPI.getServiceIcon(result.serviceType);
  const color = ServiceResultsAPI.getServiceColor(result.serviceType);
  const serviceName = ServiceResultsAPI.getServiceName(result.serviceType);

  if (variant === 'badge') {
    return (
      <Animated.View
        style={[
          styles.badge,
          { 
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.badgeText}>AI mentioned</Text>
      </Animated.View>
    );
  }

  if (variant === 'inline') {
    return (
      <TouchableOpacity
        style={[styles.inline, { borderColor: color }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.inlineHighlight,
            {
              backgroundColor: color,
              opacity: highlightAnim,
            },
          ]}
        />
        <Text style={styles.inlineIcon}>{icon}</Text>
        <Text style={styles.inlineText}>Referring to your {serviceName}</Text>
        <MaterialIcons name="open-in-new" size={16} color={color} />
      </TouchableOpacity>
    );
  }

  // Default: chip
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: `${color}15` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.chipGlow,
          {
            backgroundColor: color,
            opacity: highlightAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
      <Text style={styles.chipIcon}>{icon}</Text>
      <Text style={[styles.chipText, { color }]}>{serviceName}</Text>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
      >
        <MaterialIcons name="check-circle" size={16} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Connection Line Component
export const ConnectionLine: React.FC<{
  fromY: number;
  toY: number;
  color: string;
}> = ({ fromY, toY, color }) => {
  const dashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(dashAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.connectionLine,
        {
          top: fromY,
          height: toY - fromY,
          borderColor: color,
          opacity: 0.4,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginVertical: 4,
    overflow: 'hidden',
  },
  chipGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FFF',
    gap: 8,
    marginVertical: 8,
    overflow: 'hidden',
  },
  inlineHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  inlineIcon: {
    fontSize: 20,
  },
  inlineText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  connectionLine: {
    position: 'absolute',
    left: 20,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
});

export default AIReferenceIndicator;

