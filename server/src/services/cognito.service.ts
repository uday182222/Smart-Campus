import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  AdminDisableUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  AdminResetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * AWS Cognito Service
 * Handles user management in AWS Cognito User Pool
 */

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || '';
const REGION = process.env.AWS_REGION || 'eu-north-1';

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Generate a random temporary password
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export class CognitoService {
  /**
   * Create a new user in Cognito
   */
  static async createUser(
    email: string,
    name: string,
    role: string,
    temporaryPassword?: string
  ): Promise<{ cognitoId: string; temporaryPassword: string }> {
    try {
      if (!USER_POOL_ID) {
        logger.warn('Cognito User Pool ID not configured. Skipping Cognito user creation.');
        // Return a mock ID for development
        return {
          cognitoId: `mock-cognito-id-${Date.now()}`,
          temporaryPassword: temporaryPassword || generateTemporaryPassword(),
        };
      }

      const tempPassword = temporaryPassword || generateTemporaryPassword();

      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: name },
          { Name: 'email_verified', Value: 'true' },
        ],
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email (we'll send custom email)
        DesiredDeliveryMediums: ['EMAIL'],
      });

      const createUserResponse = await cognitoClient.send(createUserCommand);

      if (!createUserResponse.User?.Username) {
        throw new AppError('Failed to create user in Cognito', 500);
      }

      const cognitoId = createUserResponse.User.Username;

      // Add user to role group
      const roleGroupName = this.getRoleGroupName(role);
      if (roleGroupName) {
        try {
          const addToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: cognitoId,
            GroupName: roleGroupName,
          });

          await cognitoClient.send(addToGroupCommand);
        } catch (groupError) {
          logger.warn(`Failed to add user to group ${roleGroupName}:`, groupError);
          // Continue even if group assignment fails
        }
      }

      // Set permanent password (user will be forced to change on first login)
      try {
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: USER_POOL_ID,
          Username: cognitoId,
          Password: tempPassword,
          Permanent: false, // User must change password on first login
        });

        await cognitoClient.send(setPasswordCommand);
      } catch (passwordError) {
        logger.warn('Failed to set user password:', passwordError);
        // Continue even if password setting fails
      }

      logger.info(`User created in Cognito: ${cognitoId}`);

      return {
        cognitoId,
        temporaryPassword: tempPassword,
      };
    } catch (error: any) {
      logger.error('Error creating user in Cognito:', error);
      if (error.name === 'UsernameExistsException') {
        throw new AppError('User with this email already exists in Cognito', 400);
      }
      throw new AppError('Failed to create user in Cognito', 500);
    }
  }

  /**
   * Get Cognito group name for role
   */
  private static getRoleGroupName(role: string): string | null {
    const roleMap: Record<string, string> = {
      TEACHER: 'Teachers',
      PARENT: 'Parents',
      STUDENT: 'Students',
      ADMIN: 'Admins',
      PRINCIPAL: 'Principals',
      OFFICE_STAFF: 'OfficeStaff',
      BUS_HELPER: 'BusHelpers',
    };

    return roleMap[role] || null;
  }

  /**
   * Disable user in Cognito
   */
  static async disableUser(cognitoId: string): Promise<void> {
    try {
      if (!USER_POOL_ID) {
        logger.warn('Cognito User Pool ID not configured. Skipping Cognito user disable.');
        return;
      }

      const command = new AdminDisableUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId,
      });

      await cognitoClient.send(command);
      logger.info(`User disabled in Cognito: ${cognitoId}`);
    } catch (error) {
      logger.error('Error disabling user in Cognito:', error);
      // Don't throw - allow database update to proceed
    }
  }

  /**
   * Update user attributes in Cognito
   */
  static async updateUserAttributes(
    cognitoId: string,
    attributes: { email?: string; name?: string; phone?: string }
  ): Promise<void> {
    try {
      if (!USER_POOL_ID) {
        logger.warn('Cognito User Pool ID not configured. Skipping Cognito attribute update.');
        return;
      }

      const userAttributes: Array<{ Name: string; Value: string }> = [];

      if (attributes.email) {
        userAttributes.push({ Name: 'email', Value: attributes.email });
      }
      if (attributes.name) {
        userAttributes.push({ Name: 'name', Value: attributes.name });
      }
      if (attributes.phone) {
        userAttributes.push({ Name: 'phone_number', Value: attributes.phone });
      }

      if (userAttributes.length === 0) {
        return;
      }

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId,
        UserAttributes: userAttributes,
      });

      await cognitoClient.send(command);
      logger.info(`User attributes updated in Cognito: ${cognitoId}`);
    } catch (error) {
      logger.error('Error updating user attributes in Cognito:', error);
      // Don't throw - allow database update to proceed
    }
  }

  /**
   * Reset user password
   */
  static async resetPassword(cognitoId: string): Promise<void> {
    try {
      if (!USER_POOL_ID) {
        logger.warn('Cognito User Pool ID not configured. Skipping password reset.');
        return;
      }

      const command = new AdminResetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId,
      });

      await cognitoClient.send(command);
      logger.info(`Password reset initiated for user: ${cognitoId}`);
    } catch (error) {
      logger.error('Error resetting password in Cognito:', error);
      throw new AppError('Failed to reset password', 500);
    }
  }

  /**
   * Get user from Cognito
   */
  static async getUser(cognitoId: string): Promise<any> {
    try {
      if (!USER_POOL_ID) {
        return null;
      }

      const command = new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: cognitoId,
      });

      const response = await cognitoClient.send(command);
      return response;
    } catch (error) {
      logger.error('Error getting user from Cognito:', error);
      return null;
    }
  }
}

