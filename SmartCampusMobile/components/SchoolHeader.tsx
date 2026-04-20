import React from 'react';
import { View, Text, Image } from 'react-native';
import { useSchoolTheme } from '../contexts/SchoolThemeContext';

export function SchoolHeader() {
  const { theme } = useSchoolTheme();

  return (
    <View
      style={{
        backgroundColor: theme.primaryColor + '18',
        borderBottomWidth: 2,
        borderBottomColor: theme.primaryColor,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {theme.logoUrl ? (
        <Image
          source={{ uri: theme.logoUrl }}
          style={{ width: 40, height: 40, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: theme.primaryColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {theme.schoolName ? theme.schoolName.charAt(0) : '?'}
          </Text>
        </View>
      )}
      <Text
        style={{
          marginLeft: 10,
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.primaryColor,
        }}
      >
        {theme.schoolName || 'School'}
      </Text>
    </View>
  );
}
