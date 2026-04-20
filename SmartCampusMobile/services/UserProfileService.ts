import { 
  UserProfile, 
  ProfileUpdateRequest, 
  PasswordChangeRequest, 
  TwoFactorSetup, 
  AccountDeletionRequest,
  TrustedDevice,
  LoginRecord 
} from '../models/UserProfileModel';

export class UserProfileService {
  private static instance: UserProfileService;
  private profileData: UserProfile[] = [];

  static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
      UserProfileService.instance.initializeMockData();
    }
    return UserProfileService.instance;
  }

  // Initialize mock data
  initializeMockData(): void {
    this.profileData = [
      {
        id: 'profile_1',
        userId: 'teacher_1',
        email: 'teacher@school.com',
        name: 'Ms. Sarah Wilson',
        role: 'teacher',
        schoolId: 'school_1',
        schoolName: 'Smart Campus Elementary',
        profilePicture: '/images/profile_teacher.jpg',
        phoneNumber: '+1 (555) 123-4567',
        address: {
          street: '123 Education Street',
          city: 'Learning City',
          state: 'Education State',
          zipCode: '12345',
          country: 'United States',
        },
        emergencyContact: {
          name: 'John Wilson',
          relationship: 'Spouse',
          phoneNumber: '+1 (555) 987-6543',
          email: 'john.wilson@email.com',
        },
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light',
          fontSize: 'medium',
          defaultDashboard: 'teacher',
          showTutorials: true,
          autoSave: true,
          offlineMode: false,
        },
        notifications: {
          pushNotifications: true,
          emailNotifications: true,
          smsNotifications: false,
          attendanceAlerts: true,
          homeworkReminders: true,
          feeReminders: false,
          transportUpdates: false,
          academicUpdates: true,
          systemAnnouncements: true,
          marketingEmails: false,
          quietHours: {
            enabled: true,
            startTime: '22:00',
            endTime: '07:00',
          },
        },
        privacy: {
          profileVisibility: 'school_only',
          showContactInfo: true,
          showAcademicProgress: true,
          allowDataSharing: false,
          analyticsOptIn: true,
          locationTracking: false,
          biometricAuth: true,
        },
        security: {
          twoFactorAuth: false,
          loginNotifications: true,
          sessionTimeout: 30,
          passwordChangeRequired: false,
          lastPasswordChange: new Date('2024-12-01'),
          trustedDevices: [
            {
              id: 'device_1',
              deviceName: 'iPhone 15 Pro',
              deviceType: 'mobile',
              lastUsed: new Date('2025-01-15'),
              location: 'New York, NY',
              isActive: true,
            },
            {
              id: 'device_2',
              deviceName: 'MacBook Pro',
              deviceType: 'desktop',
              lastUsed: new Date('2025-01-14'),
              location: 'New York, NY',
              isActive: true,
            },
          ],
          loginHistory: [
            {
              id: 'login_1',
              timestamp: new Date('2025-01-15T08:30:00'),
              deviceType: 'iPhone 15 Pro',
              location: 'New York, NY',
              ipAddress: '192.168.1.100',
              success: true,
            },
            {
              id: 'login_2',
              timestamp: new Date('2025-01-14T18:45:00'),
              deviceType: 'MacBook Pro',
              location: 'New York, NY',
              ipAddress: '192.168.1.101',
              success: true,
            },
            {
              id: 'login_3',
              timestamp: new Date('2025-01-14T07:15:00'),
              deviceType: 'iPhone 15 Pro',
              location: 'New York, NY',
              ipAddress: '192.168.1.100',
              success: false,
              failureReason: 'Invalid password',
            },
          ],
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2025-01-15'),
      },
    ];
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = this.profileData.find(p => p.userId === userId);
        resolve(profile || null);
      }, 300);
    });
  }

  // Update user profile
  async updateProfile(userId: string, updates: ProfileUpdateRequest): Promise<{ success: boolean; profile?: UserProfile; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          const profile = this.profileData[profileIndex];
          const updatedProfile: UserProfile = {
            ...profile,
            ...updates,
            preferences: { ...profile.preferences, ...updates.preferences },
            notifications: { ...profile.notifications, ...updates.notifications },
            privacy: { ...profile.privacy, ...updates.privacy },
            updatedAt: new Date(),
          };

          this.profileData[profileIndex] = updatedProfile;
          resolve({ success: true, profile: updatedProfile, message: 'Profile updated successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to update profile' });
        }
      }, 500);
    });
  }

  // Change password
  async changePassword(userId: string, passwordData: PasswordChangeRequest): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // Validate password requirements
          if (passwordData.newPassword.length < 8) {
            resolve({ success: false, message: 'Password must be at least 8 characters long' });
            return;
          }

          if (passwordData.newPassword !== passwordData.confirmPassword) {
            resolve({ success: false, message: 'New passwords do not match' });
            return;
          }

          // In a real app, you would validate current password and hash the new password
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          this.profileData[profileIndex].security.lastPasswordChange = new Date();
          this.profileData[profileIndex].updatedAt = new Date();

          resolve({ success: true, message: 'Password changed successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to change password' });
        }
      }, 600);
    });
  }

  // Setup two-factor authentication
  async setupTwoFactor(userId: string): Promise<{ success: boolean; setup?: TwoFactorSetup; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          // Generate mock 2FA setup data
          const setup: TwoFactorSetup = {
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            secretKey: 'JBSWY3DPEHPK3PXP',
            backupCodes: [
              '12345678',
              '87654321',
              '11111111',
              '22222222',
              '33333333',
              '44444444',
              '55555555',
              '66666666',
            ],
          };

          this.profileData[profileIndex].security.twoFactorAuth = true;
          this.profileData[profileIndex].updatedAt = new Date();

          resolve({ success: true, setup, message: 'Two-factor authentication setup completed' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to setup two-factor authentication' });
        }
      }, 700);
    });
  }

  // Disable two-factor authentication
  async disableTwoFactor(userId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          this.profileData[profileIndex].security.twoFactorAuth = false;
          this.profileData[profileIndex].updatedAt = new Date();

          resolve({ success: true, message: 'Two-factor authentication disabled' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to disable two-factor authentication' });
        }
      }, 500);
    });
  }

  // Upload profile picture
  async uploadProfilePicture(userId: string, imageData: string): Promise<{ success: boolean; imageUrl?: string; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          // Mock image upload - in real app, upload to cloud storage
          const imageUrl = `/images/profiles/${userId}_${Date.now()}.jpg`;
          
          this.profileData[profileIndex].profilePicture = imageUrl;
          this.profileData[profileIndex].updatedAt = new Date();

          resolve({ success: true, imageUrl, message: 'Profile picture updated successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to upload profile picture' });
        }
      }, 800);
    });
  }

  // Get login history
  async getLoginHistory(userId: string, limit: number = 20): Promise<LoginRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = this.profileData.find(p => p.userId === userId);
        if (profile) {
          const history = profile.security.loginHistory
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
          resolve(history);
        } else {
          resolve([]);
        }
      }, 300);
    });
  }

  // Get trusted devices
  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = this.profileData.find(p => p.userId === userId);
        resolve(profile?.security.trustedDevices || []);
      }, 300);
    });
  }

  // Remove trusted device
  async removeTrustedDevice(userId: string, deviceId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profileIndex = this.profileData.findIndex(p => p.userId === userId);
          if (profileIndex === -1) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          const deviceIndex = this.profileData[profileIndex].security.trustedDevices.findIndex(d => d.id === deviceId);
          if (deviceIndex === -1) {
            resolve({ success: false, message: 'Device not found' });
            return;
          }

          this.profileData[profileIndex].security.trustedDevices.splice(deviceIndex, 1);
          this.profileData[profileIndex].updatedAt = new Date();

          resolve({ success: true, message: 'Device removed successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to remove device' });
        }
      }, 400);
    });
  }

  // Request account deletion
  async requestAccountDeletion(userId: string, request: AccountDeletionRequest): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (!request.confirmDeletion) {
            resolve({ success: false, message: 'Please confirm account deletion' });
            return;
          }

          // In a real app, this would queue the deletion request for admin approval
          resolve({ success: true, message: 'Account deletion request submitted. You will receive a confirmation email within 24 hours.' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to submit deletion request' });
        }
      }, 600);
    });
  }

  // Export user data
  async exportUserData(userId: string): Promise<{ success: boolean; downloadUrl?: string; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const profile = this.profileData.find(p => p.userId === userId);
          if (!profile) {
            resolve({ success: false, message: 'Profile not found' });
            return;
          }

          // Mock data export - in real app, generate and upload export file
          const downloadUrl = `/exports/user_data_${userId}_${Date.now()}.zip`;
          resolve({ success: true, downloadUrl, message: 'Data export completed successfully' });
        } catch (error) {
          resolve({ success: false, message: 'Failed to export user data' });
        }
      }, 1000);
    });
  }

  // Validate profile completeness
  async validateProfileCompleteness(userId: string): Promise<{ completeness: number; missingFields: string[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const profile = this.profileData.find(p => p.userId === userId);
        if (!profile) {
          resolve({ completeness: 0, missingFields: ['Profile not found'] });
          return;
        }

        const requiredFields = ['name', 'phoneNumber', 'address', 'emergencyContact'];
        const missingFields: string[] = [];

        if (!profile.name) missingFields.push('Name');
        if (!profile.phoneNumber) missingFields.push('Phone Number');
        if (!profile.address) missingFields.push('Address');
        if (!profile.emergencyContact) missingFields.push('Emergency Contact');

        const completeness = Math.round(((requiredFields.length - missingFields.length) / requiredFields.length) * 100);

        resolve({ completeness, missingFields });
      }, 200);
    });
  }
}

export default UserProfileService.getInstance();
