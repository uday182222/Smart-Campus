import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StyleProp,
  TextStyle,
} from 'react-native';
import { FreedomColors, FreedomTypography } from '../../theme/FreedomTheme';

interface EnhancedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  rightIcon,
  onRightIconPress,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleRightIconPress = () => {
    if (secureTextEntry) {
      setShowPassword(!showPassword);
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  React.useEffect(() => {
    if (error) {
      Animated.timing(errorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(errorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [error]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FreedomColors.lightGray, FreedomColors.primary.start],
  });

  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            shadowOpacity,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          {icon && (
            <Text style={styles.leftIcon}>{icon}</Text>
          )}
          <TextInput
            style={[
              styles.input,
              icon && styles.inputWithLeftIcon,
              rightIcon && styles.inputWithRightIcon,
              multiline && styles.multilineInput,
              disabled && styles.disabledInput,
            ] as StyleProp<TextStyle>}
            placeholder={placeholder}
            placeholderTextColor={FreedomColors.text.tertiary}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize="none"
            editable={!disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIconContainer}
              onPress={handleRightIconPress}
            >
              <Text style={styles.rightIcon}>
                {secureTextEntry ? (showPassword ? '👁️' : '👁️‍🗨️') : rightIcon}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      {error && (
        <Animated.View
          style={[
            styles.errorContainer,
            {
              opacity: errorAnim,
              transform: [{
                translateY: errorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.semibold,
    fontSize: FreedomTypography.sizes.base,
    color: FreedomColors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: FreedomColors.white,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: FreedomColors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  leftIcon: {
    position: 'absolute',
    left: 16,
    fontSize: 18,
    color: FreedomColors.text.tertiary,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: FreedomTypography.sizes.base,
    fontFamily: FreedomTypography.fontFamily,
    color: FreedomColors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: 50,
  },
  inputWithRightIcon: {
    paddingRight: 50,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: FreedomColors.lightGray,
    color: FreedomColors.text.tertiary,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  rightIcon: {
    fontSize: 18,
    color: FreedomColors.text.tertiary,
  },
  errorContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: FreedomTypography.fontFamily,
    fontWeight: FreedomTypography.weights.regular,
    fontSize: FreedomTypography.sizes.sm,
    color: '#FF3B30',
  },
});

export default EnhancedInput;

