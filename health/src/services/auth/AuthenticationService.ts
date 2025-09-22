import UserRepository, { User, CreateUserData, LoginCredentials } from '../../database/repositories/UserRepository';
import AuthService, { AuthSession } from '../../utils/security/AuthService';
import { ErrorHandler, ErrorType, ErrorSeverity } from '../../utils/error/ErrorHandler';

export interface SignupData extends CreateUserData {
  confirmPassword: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export class AuthenticationService {
  // Sign up a new user
  static async signup(signupData: SignupData): Promise<AuthResult> {
    try {
      // Validate input
      if (!signupData.email || !signupData.password || !signupData.name) {
        return {
          success: false,
          error: 'All fields are required',
        };
      }

      if (signupData.password !== signupData.confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
        };
      }

      if (signupData.password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters long',
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupData.email)) {
        return {
          success: false,
          error: 'Please enter a valid email address',
        };
      }

      // Create user
      const user = await UserRepository.createUser({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });

      // Create session
      const session = await AuthService.createSession(user);

      // Log security event
      await AuthService.logSecurityEvent('user_signup', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        user,
        session,
      };
    } catch (error: any) {
      ErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        `Signup failed: ${error.message}`,
        ErrorSeverity.MEDIUM
      );

      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Check if account is locked
      const isLocked = await AuthService.isAccountLocked();
      if (isLocked) {
        const remainingTime = await AuthService.getRemainingLockoutTime();
        const minutes = Math.ceil(remainingTime / (1000 * 60));
        
        return {
          success: false,
          error: `Account is locked. Try again in ${minutes} minutes.`,
        };
      }

      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      // Authenticate user
      const user = await UserRepository.authenticateUser(credentials);
      
      if (!user) {
        // Record failed login attempt
        await AuthService.recordLoginAttempt(false);
        
        ErrorHandler.createError(
          ErrorType.AUTHENTICATION,
          'Invalid login credentials',
          ErrorSeverity.MEDIUM
        );

        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      // Record successful login
      await AuthService.recordLoginAttempt(true);

      // Create session
      const session = await AuthService.createSession(user);

      // Log security event
      await AuthService.logSecurityEvent('user_login', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        user,
        session,
      };
    } catch (error: any) {
      ErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        `Login failed: ${error.message}`,
        ErrorSeverity.MEDIUM
      );

      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      const session = await AuthService.getCurrentSession();
      if (session) {
        await AuthService.logSecurityEvent('user_logout', {
          userId: session.user.id,
        });
      }

      await AuthService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return null;
      }

      // Get fresh user data from database
      const user = await UserRepository.getUserById(session.user.id);
      return user;
    } catch (error: any) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    return await AuthService.isAuthenticated();
  }

  // Update user profile
  static async updateProfile(updateData: Partial<User>): Promise<AuthResult> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const updatedUser = await UserRepository.updateUser(session.user.id, updateData);
      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update profile',
        };
      }

      // Log security event
      await AuthService.logSecurityEvent('profile_updated', {
        userId: session.user.id,
      });

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: any) {
      ErrorHandler.createError(
        ErrorType.VALIDATION,
        `Profile update failed: ${error.message}`,
        ErrorSeverity.LOW
      );

      return {
        success: false,
        error: error.message || 'Failed to update profile',
      };
    }
  }

  // Change password
  static async changePassword(oldPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          error: 'New password must be at least 8 characters long',
        };
      }

      await UserRepository.changePassword(session.user.id, oldPassword, newPassword);

      // Log security event
      await AuthService.logSecurityEvent('password_changed', {
        userId: session.user.id,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      ErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        `Password change failed: ${error.message}`,
        ErrorSeverity.MEDIUM
      );

      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  }

  // Delete account
  static async deleteAccount(password: string): Promise<AuthResult> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Verify password before deletion
      const user = await UserRepository.authenticateUser({
        email: session.user.email,
        password,
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid password',
        };
      }

      // Delete user and all data
      const deleted = await UserRepository.deleteUser(session.user.id);
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete account',
        };
      }

      // Log security event
      await AuthService.logSecurityEvent('account_deleted', {
        userId: session.user.id,
      });

      // Logout
      await AuthService.logout();

      return {
        success: true,
      };
    } catch (error: any) {
      ErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        `Account deletion failed: ${error.message}`,
        ErrorSeverity.HIGH
      );

      return {
        success: false,
        error: error.message || 'Failed to delete account',
      };
    }
  }

  // Get user statistics
  static async getUserStatistics(): Promise<any> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return null;
      }

      return await UserRepository.getUserStatistics(session.user.id);
    } catch (error: any) {
      console.error('Failed to get user statistics:', error);
      return null;
    }
  }

  // Verify email (placeholder for future email verification)
  static async verifyEmail(verificationCode: string): Promise<AuthResult> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // In a real app, you would verify the code against a stored verification code
      // For now, we'll just mark the user as verified
      const verified = await UserRepository.verifyUser(session.user.id);
      
      if (!verified) {
        return {
          success: false,
          error: 'Failed to verify email',
        };
      }

      // Log security event
      await AuthService.logSecurityEvent('email_verified', {
        userId: session.user.id,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Email verification failed',
      };
    }
  }
}

export default AuthenticationService;
