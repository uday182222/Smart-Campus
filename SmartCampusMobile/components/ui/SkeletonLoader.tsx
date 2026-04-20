import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface SkeletonBoxProps {
  width?: number;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = 12,
  style,
}: SkeletonBoxProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <Animated.View
      style={[
        {
          width: width ?? undefined,
          flex: width === undefined ? 1 : undefined,
          height,
          borderRadius,
          backgroundColor: '#E5E5E5',
        },
        { opacity },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ padding: 20, backgroundColor: '#F5F5F5' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>
      <SkeletonBox width={200} height={16} style={{ marginBottom: 8 }} />
      <SkeletonBox width={280} height={36} style={{ marginBottom: 24 }} />
      <SkeletonBox height={180} borderRadius={24} style={{ marginBottom: 24, flex: 1 }} />
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} width={140} height={100} borderRadius={20} style={{ marginRight: 12 }} />
        ))}
      </View>
      {[1, 2, 3].map((i) => (
        <SkeletonBox key={i} height={72} borderRadius={16} style={{ marginBottom: 12, flex: 1 }} />
      ))}
    </View>
  );
}
