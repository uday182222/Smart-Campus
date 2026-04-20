import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatCardProps {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  trend?: string;
}

export function StatCard({
  value,
  label,
  icon,
  iconBg,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <View
      className="bg-card rounded-2xl p-4 mr-3"
      style={{
        width: 140,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text className="text-2xl font-extrabold text-dark">{value}</Text>
      <Text className="text-xs text-muted mt-0.5">{label}</Text>
      {trend && <Text className="text-xs text-success mt-1">{trend}</Text>}
    </View>
  );
}

export default StatCard;
