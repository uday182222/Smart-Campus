/**
 * Error Handling Utilities
 * Comprehensive error handling, logging, and recovery mechanisms
 */

import React from 'react';
import { Alert, View, Text, TouchableOpacity, Platform } from 'react-native';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from 'sentry-expo';

export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'validation'
  | 'server'
  | 'timeout'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface ErrorLog {
  id: string;
  error: AppError;
  userId?: string;
  deviceInfo: any;
  appVersion: string;
  reportedToServer: boolean;
}

// Initialize Sentry (if configured)
export const initializeErrorTracking = () => {
  if (__DEV__) {
    console.log('Error tracking disabled in development');
    return;
  }

  try {
    Sentry.init({
      dsn: 'your-sentry-dsn-here',
      enableInExpoDevelopment: false,
      debug: false,
      tracesSampleRate: 1.0,
    });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service
    logError(createAppError('unknown', error.message, error, {
      componentStack: errorInfo.componentStack,
    }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="error-outline" size={64} color="#E74C3C" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>
            Oops! Something went wrong
          </Text>
          <Text style={{ textAlign: 'center', color: '#7F8C8D', marginBottom: 20 }}>
            We're sorry for the inconvenience. Please try again.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#4ECDC4',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={this.handleRetry}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Create standardized app error
 */
export const createAppError = (
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): AppError => {
  return {
    type,
    message,
    originalError,
    timestamp: new Date(),
    context,
    recoverable: isRecoverable(type),
  };
};

/**
 * Determine if error is recoverable
 */
const isRecoverable = (type: ErrorType): boolean => {
  switch (type) {
    case 'network':
    case 'timeout':
      return true;
    case 'authentication':
    case 'validation':
      return false;
    case 'server':
    case 'unknown':
      return false;
    default:
      return false;
  }
};

/**
 * Handle API errors
 */
export const handleAPIError = (error: any): AppError => {
  // Network error
  if (error.message === 'Network request failed') {
    return createAppError(
      'network',
      'Unable to connect. Please check your internet connection.',
      error
    );
  }

  // Timeout error
  if (error.message.includes('timeout')) {
    return createAppError(
      'timeout',
      'Request timed out. Please try again.',
      error
    );
  }

  // Authentication error (401)
  if (error.status === 401) {
    return createAppError(
      'authentication',
      'Session expired. Please login again.',
      error
    );
  }

  // Validation error (400)
  if (error.status === 400) {
    return createAppError(
      'validation',
      error.message || 'Invalid request. Please check your input.',
      error,
      { validationErrors: error.errors }
    );
  }

  // Server error (500+)
  if (error.status >= 500) {
    return createAppError(
      'server',
      'Server error. Our team has been notified.',
      error
    );
  }

  // Unknown error
  return createAppError(
    'unknown',
    error.message || 'An unexpected error occurred.',
    error
  );
};

/**
 * Log error to tracking service
 */
export const logError = async (error: AppError): Promise<void> => {
  try {
    // Log to Sentry
    if (!__DEV__) {
      Sentry.Native.captureException(error.originalError || new Error(error.message), {
        tags: {
          errorType: error.type,
        },
        contexts: {
          error: {
            ...error.context,
            timestamp: error.timestamp.toISOString(),
            recoverable: error.recoverable,
          },
        },
      });
    }

    // Store locally
    await storeErrorLocally(error);

    // Send to backend
    await sendErrorToBackend(error);
  } catch (e) {
    console.error('Failed to log error:', e);
  }
};

/**
 * Store error locally for later analysis
 */
const storeErrorLocally = async (error: AppError): Promise<void> => {
  try {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      error,
      userId: await AsyncStorage.getItem('userId') || undefined,
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
      appVersion: Constants.expoConfig?.version || 'unknown',
      reportedToServer: false,
    };

    const existing = await AsyncStorage.getItem('errorLogs');
    const logs = existing ? JSON.parse(existing) : [];
    
    logs.push({
      ...errorLog,
      error: {
        ...errorLog.error,
        timestamp: errorLog.error.timestamp.toISOString(),
      },
    });

    // Keep only last 50 errors
    const trimmed = logs.slice(-50);
    
    await AsyncStorage.setItem('errorLogs', JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to store error locally:', e);
  }
};

/**
 * Send error to backend
 */
const sendErrorToBackend = async (error: AppError): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    await fetch(`${API_BASE_URL}/errors/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        ...error,
        timestamp: error.timestamp.toISOString(),
        originalError: error.originalError?.message,
      }),
    });
  } catch (e) {
    // Silently fail - don't want error logging to cause more errors
    console.error('Failed to send error to backend:', e);
  }
};

/**
 * Show user-friendly error message
 */
export const showError = (error: AppError, onRetry?: () => void): void => {
  const buttons: any[] = [{ text: 'OK' }];
  
  if (error.recoverable && onRetry) {
    buttons.unshift({
      text: 'Retry',
      onPress: onRetry,
    });
  }

  Alert.alert(
    getErrorTitle(error.type),
    error.message,
    buttons
  );
};

/**
 * Get user-friendly error title
 */
const getErrorTitle = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'Connection Error';
    case 'authentication':
      return 'Authentication Required';
    case 'validation':
      return 'Invalid Input';
    case 'server':
      return 'Server Error';
    case 'timeout':
      return 'Request Timeout';
    default:
      return 'Error';
  }
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async <T extends unknown>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Form validation helper
 */
export interface ValidationRule {
  field: string;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
  };
  message: string;
}

export const validateForm = (
  data: Record<string, any>,
  rules: ValidationRule[]
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];

    // Required check
    if (rule.rules.required && (!value || value.toString().trim() === '')) {
      errors[rule.field] = `${rule.field} is required`;
      continue;
    }

    // Skip other validations if value is empty and not required
    if (!value) continue;

    // Min length check
    if (rule.rules.minLength && value.toString().length < rule.rules.minLength) {
      errors[rule.field] = rule.message || `${rule.field} must be at least ${rule.rules.minLength} characters`;
      continue;
    }

    // Max length check
    if (rule.rules.maxLength && value.toString().length > rule.rules.maxLength) {
      errors[rule.field] = rule.message || `${rule.field} must not exceed ${rule.rules.maxLength} characters`;
      continue;
    }

    // Pattern check
    if (rule.rules.pattern && !rule.rules.pattern.test(value.toString())) {
      errors[rule.field] = rule.message || `${rule.field} format is invalid`;
      continue;
    }

    // Custom validation
    if (rule.rules.custom && !rule.rules.custom(value)) {
      errors[rule.field] = rule.message || `${rule.field} is invalid`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get all stored error logs
 */
export const getErrorLogs = async (): Promise<ErrorLog[]> => {
  try {
    const logs = await AsyncStorage.getItem('errorLogs');
    if (logs) {
      return JSON.parse(logs).map((log: any) => ({
        ...log,
        error: {
          ...log.error,
          timestamp: new Date(log.error.timestamp),
        },
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return [];
  }
};

/**
 * Clear error logs
 */
export const clearErrorLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('errorLogs');
  } catch (error) {
    console.error('Failed to clear error logs:', error);
  }
};

/**
 * Report error to support
 */
export const reportErrorToSupport = async (
  error: AppError,
  userDescription?: string
): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    await fetch(`${API_BASE_URL}/support/report-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        error: {
          ...error,
          timestamp: error.timestamp.toISOString(),
        },
        userDescription,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      }),
    });

    Alert.alert('Success', 'Error reported to support team. We\'ll look into it!');
  } catch (e) {
    Alert.alert('Error', 'Failed to report error. Please try again later.');
  }
};

// Export constants
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[0-9]{10}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
};



