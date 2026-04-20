/**
 * Onboarding Tooltip Component
 * First-time user experience tooltips
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TooltipProps {
  id: string;
  title: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  targetRef?: React.RefObject<View>;
  onDismiss?: () => void;
}

const OnboardingTooltip: React.FC<TooltipProps> = ({
  id,
  title,
  message,
  position = 'bottom',
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    checkIfSeen();
  }, [id]);

  const checkIfSeen = async () => {
    try {
      const seen = await AsyncStorage.getItem(`tooltip_${id}`);
      if (!seen) {
        setTimeout(() => {
          setVisible(true);
          animateIn();
        }, 500);
      }
    } catch (error) {
      console.error('Error checking tooltip:', error);
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(`tooltip_${id}`, 'true');
      animateOut();
      if (onDismiss) {
        onDismiss();
      }
    } catch (error) {
      console.error('Error saving tooltip state:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        
        <Animated.View
          style={[
            styles.tooltip,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Arrow */}
          <View style={[styles.arrow, styles[`arrow${position}`]]} />

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.header}>
              <MaterialIcons name="lightbulb" size={20} color="#FFA500" />
              <Text style={styles.title}>{title}</Text>
            </View>
            
            <Text style={styles.message}>{message}</Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleDismiss}
            >
              <Text style={styles.buttonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Tooltip Manager for sequential tooltips
export class TooltipManager {
  private static tooltips: Array<{
    id: string;
    title: string;
    message: string;
  }> = [];
  private static currentIndex = 0;

  static registerTooltips(tooltips: Array<{ id: string; title: string; message: string }>) {
    this.tooltips = tooltips;
  }

  static async resetAll() {
    for (const tooltip of this.tooltips) {
      await AsyncStorage.removeItem(`tooltip_${tooltip.id}`);
    }
    this.currentIndex = 0;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tooltip: {
    maxWidth: 300,
    backgroundColor: '#FFF',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
  },
  arrowtop: {
    top: -10,
    left: '50%',
    marginLeft: -10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
  },
  arrowbottom: {
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFF',
  },
  arrowleft: {
    left: -10,
    top: '50%',
    marginTop: -10,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFF',
  },
  arrowright: {
    right: -10,
    top: '50%',
    marginTop: -10,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFF',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default OnboardingTooltip;

