import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSchoolTheme } from '../../contexts/SchoolThemeContext';
import { darkenHex } from '../../constants/parentDesign';

type Props = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
  /** Extra bottom padding inside gradient */
  paddingBottom?: number;
};

export function ParentGradientHeader({ title, subtitle, rightSlot, bottomSlot, paddingBottom = 24 }: Props) {
  const { theme } = useSchoolTheme();
  const primary = theme.primaryColor || '#2B5CE6';
  const primaryDark = darkenHex(primary, 0.22);
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={[primary, primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <StatusBar barStyle="light-content" backgroundColor={primaryDark} />
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom,
          paddingHorizontal: 20,
        }}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightSlot}
        </View>
        {bottomSlot}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});
