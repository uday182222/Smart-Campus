import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LT } from '../../constants/lightTheme';

interface LightInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
}

export function LightInput({ label, icon, isPassword, error, ...props }: LightInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: LT.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: LT.input,
          borderRadius: LT.radius.lg,
          borderWidth: 1.5,
          borderColor: focused ? LT.primary : error ? LT.danger : LT.inputBorder,
          paddingHorizontal: 14,
          paddingVertical: 2,
          ...LT.shadow,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? LT.primary : LT.textMuted}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, color: LT.textPrimary, fontSize: 15, paddingVertical: 12 }}
          placeholderTextColor={LT.textMuted}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={LT.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={{ color: LT.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

