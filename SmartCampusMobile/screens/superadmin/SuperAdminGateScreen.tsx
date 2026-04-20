/**
 * Initial screen when Super Admin logs in. Checks isFirstLaunch and redirects to AccentColorPicker or Dashboard.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSuperAdminAccent } from '../../hooks/useSuperAdminAccent';
import { DT } from '../../constants/darkTheme';

export default function SuperAdminGateScreen() {
  const navigation = useNavigation<any>();
  const { isFirstLaunch } = useSuperAdminAccent();

  useEffect(() => {
    let cancelled = false;
    isFirstLaunch().then((first) => {
      if (cancelled) return;
      if (first) {
        navigation.replace('AccentColorPicker');
      } else {
        navigation.replace('SuperAdminDashboard');
      }
    });
    return () => { cancelled = true; };
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: DT.bg, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={DT.lime} />
      <Text style={{ color: DT.textMuted, marginTop: 16, fontSize: 14 }}>Loading...</Text>
    </View>
  );
}
