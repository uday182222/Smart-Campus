import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { MotiView } from 'moti';

interface AnimatedInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  error,
  disabled = false,
  autoCapitalize = 'none',
  maxLength,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <View style={styles.marginBottom}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputRow,
            {
              borderColor: error ? '#EF4444' : isFocused ? '#6366F1' : '#E2E8F0',
            },
          ]}
        >
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            maxLength={maxLength}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {error ? (
          <MotiView from={{ opacity: 0, translateY: -5 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 200 }}>
            <Text style={styles.errorText}>{error}</Text>
          </MotiView>
        ) : null}
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  marginBottom: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 8,
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
});
