import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between mb-3 mt-6">
      <Text className="text-xl font-bold text-dark">{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sm text-primary font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default SectionHeader;
