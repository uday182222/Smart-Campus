import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useActiveChild } from '../contexts/ActiveChildContext';

export function ChildSwitcher() {
  const { children, activeChild, setActiveChild } = useActiveChild();

  if (children.length < 2) return null;

  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', paddingRight: 12 }}
      >
        {children.map((child) => {
          const isActive = activeChild?.studentId === child.studentId;
          return (
            <TouchableOpacity
              key={child.studentId}
              onPress={() => setActiveChild(child)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: isActive ? '#2B5CE6' : '#EEEEEE',
                backgroundColor: isActive ? '#FFFFFF' : '#FFFFFF',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? '800' : '600',
                  color: isActive ? '#2B5CE6' : '#FFFFFF',
                }}
              >
                {child.name}
              </Text>
              <Text style={{ fontSize: 11, color: isActive ? '#94A3B8' : '#94A3B8', marginTop: 2 }}>
                {child.className}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
