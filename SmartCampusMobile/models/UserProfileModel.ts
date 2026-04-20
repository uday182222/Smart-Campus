export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
  schoolName: string;
  profilePicture?: string;
  phoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences: UserPreferences;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  defaultDashboard: string;
  showTutorials: boolean;
  autoSave: boolean;
  offlineMode: boolean;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  attendanceAlerts: boolean;
  homeworkReminders: boolean;
  feeReminders: boolean;
  transportUpdates: boolean;
  academicUpdates: boolean;
  systemAnnouncements: boolean;
  marketingEmails: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'school_only';
  showContactInfo: boolean;
  showAcademicProgress: boolean;
  allowDataSharing: boolean;
  analyticsOptIn: boolean;
  locationTracking: boolean;
  biometricAuth: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  sessionTimeout: number; // minutes
  passwordChangeRequired: boolean;
  lastPasswordChange?: Date;
  trustedDevices: TrustedDevice[];
  loginHistory: LoginRecord[];
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  lastUsed: Date;
  location?: string;
  isActive: boolean;
}

export interface LoginRecord {
  id: string;
  timestamp: Date;
  deviceType: string;
  location?: string;
  ipAddress?: string;
  success: boolean;
  failureReason?: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  phoneNumber?: string;
  address?: Address;
  emergencyContact?: EmergencyContact;
  preferences?: Partial<UserPreferences>;
  notifications?: Partial<NotificationSettings>;
  privacy?: Partial<PrivacySettings>;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetup {
  qrCode: string;
  secretKey: string;
  backupCodes: string[];
}

export interface AccountDeletionRequest {
  reason: string;
  confirmDeletion: boolean;
  backupData: boolean;
}
