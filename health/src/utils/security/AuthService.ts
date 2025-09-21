import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptionService from './EncryptionService';

export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private static readonly SESSION_KEY = 'auth_session';
  private static readonly BIOMETRIC_KEY = 'biometric_enabled';
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Check if biometric authentication is available
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }

  // Enable biometric authentication
  static async enableBiometric(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      return false;
    }
  }

  // Authenticate with biometrics
  static async authenticateWithBiometric(): Promise<boolean> {
    try {
      const isEnabled = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      if (isEnabled !== 'true') {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your health data',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Create user session
  static async createSession(user: User): Promise<AuthSession> {
    try {
      const token = await this.generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session: AuthSession = {
        user: {
          ...user,
          lastLogin: new Date(),
        },
        token,
        expiresAt,
      };

      // Encrypt and store session
      const encryptedSession = await EncryptionService.encryptHealthData(
        JSON.stringify(session)
      );
      
      await SecureStore.setItemAsync(
        this.SESSION_KEY,
        JSON.stringify(encryptedSession)
      );

      return session;
    } catch (error) {
      console.error('Session creation failed:', error);
      throw new Error('Failed to create user session');
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const encryptedSessionData = await SecureStore.getItemAsync(this.SESSION_KEY);
      if (!encryptedSessionData) {
        return null;
      }

      const encryptedSession = JSON.parse(encryptedSessionData);
      const sessionData = await EncryptionService.decryptHealthData(encryptedSession);
      const session: AuthSession = JSON.parse(sessionData);

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.logout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession();
    return session !== null;
  }

  // Logout user
  static async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.SESSION_KEY);
      await this.clearLoginAttempts();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Generate secure token
  private static async generateSecureToken(): Promise<string> {
    const timestamp = Date.now().toString();
    const randomData = Math.random().toString(36);
    const tokenData = `${timestamp}_${randomData}`;
    
    return await EncryptionService.hashData(tokenData);
  }

  // Login attempt tracking
  static async recordLoginAttempt(success: boolean): Promise<void> {
    try {
      const attempts = await this.getLoginAttempts();
      const now = Date.now();

      if (success) {
        // Clear attempts on successful login
        await AsyncStorage.removeItem('login_attempts');
        await AsyncStorage.removeItem('lockout_until');
      } else {
        // Record failed attempt
        attempts.push(now);
        await AsyncStorage.setItem('login_attempts', JSON.stringify(attempts));

        // Check if we should lockout
        if (attempts.length >= this.MAX_LOGIN_ATTEMPTS) {
          const lockoutUntil = now + this.LOCKOUT_DURATION;
          await AsyncStorage.setItem('lockout_until', lockoutUntil.toString());
        }
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  }

  // Check if account is locked
  static async isAccountLocked(): Promise<boolean> {
    try {
      const lockoutUntil = await AsyncStorage.getItem('lockout_until');
      if (!lockoutUntil) {
        return false;
      }

      const lockoutTime = parseInt(lockoutUntil);
      const now = Date.now();

      if (now < lockoutTime) {
        return true;
      }

      // Lockout expired, clear it
      await AsyncStorage.removeItem('lockout_until');
      await this.clearLoginAttempts();
      return false;
    } catch (error) {
      console.error('Failed to check account lock status:', error);
      return false;
    }
  }

  // Get remaining lockout time
  static async getRemainingLockoutTime(): Promise<number> {
    try {
      const lockoutUntil = await AsyncStorage.getItem('lockout_until');
      if (!lockoutUntil) {
        return 0;
      }

      const lockoutTime = parseInt(lockoutUntil);
      const now = Date.now();
      
      return Math.max(0, lockoutTime - now);
    } catch (error) {
      console.error('Failed to get lockout time:', error);
      return 0;
    }
  }

  private static async getLoginAttempts(): Promise<number[]> {
    try {
      const attempts = await AsyncStorage.getItem('login_attempts');
      if (!attempts) {
        return [];
      }

      const attemptTimes: number[] = JSON.parse(attempts);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      // Only keep attempts from the last hour
      return attemptTimes.filter(time => time > oneHourAgo);
    } catch (error) {
      console.error('Failed to get login attempts:', error);
      return [];
    }
  }

  private static async clearLoginAttempts(): Promise<void> {
    try {
      await AsyncStorage.removeItem('login_attempts');
    } catch (error) {
      console.error('Failed to clear login attempts:', error);
    }
  }

  // Security audit log
  static async logSecurityEvent(event: string, details?: any): Promise<void> {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        details,
        userAgent: 'HealthApp/1.0.0',
      };

      const existingLogs = await AsyncStorage.getItem('security_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(logEntry);
      
      // Keep only last 100 entries
      const recentLogs = logs.slice(-100);
      
      await AsyncStorage.setItem('security_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

export default AuthService;
