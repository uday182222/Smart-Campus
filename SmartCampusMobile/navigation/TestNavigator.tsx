import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';

const Stack = createStackNavigator();

function PlaceholderScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#CBFF00', fontSize: 24 }}>OK</Text>
    </View>
  );
}

export default function TestNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Test" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
