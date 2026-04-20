import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

const DRAWER_WIDTH = 280;

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drawerContent: React.ReactNode;
  children: React.ReactNode;
}

export function CustomDrawer({ isOpen, onClose, drawerContent, children }: CustomDrawerProps) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [renderDrawer, setRenderDrawer] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRenderDrawer(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.3,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => setRenderDrawer(false));
    }
  }, [isOpen]);

  return (
    <View style={styles.container}>
      <View style={styles.main}>{children}</View>

      {renderDrawer && (
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {renderDrawer && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.panel,
            {
              width: DRAWER_WIDTH,
              transform: [{ translateX }],
            },
          ]}
        >
          {drawerContent}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  main: { flex: 1 },
  backdrop: {
    backgroundColor: '#000000',
    zIndex: 998,
  },
  panel: {
    zIndex: 999,
    left: 0,
    right: undefined,
  },
});
