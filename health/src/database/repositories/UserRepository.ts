import DatabaseService from '../DatabaseService';
import SecureDatabaseService from '../SecureDatabaseService';
import EncryptionService from '../../utils/security/EncryptionService';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class UserRepository {
  // Create a new user
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await EncryptionService.hashData(userData.password);

      // Create user object
      const user: Omit<User, 'created_at' | 'updated_at'> = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: userData.name.trim(),
        is_verified: false,
      };

      // Insert user into database (bypass auth check for user creation)
      await DatabaseService.executeUpdate(
        `INSERT INTO users (id, email, password_hash, name, is_verified, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.email,
          user.password_hash,
          user.name,
          user.is_verified ? 1 : 0,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await DatabaseService.executeQueryFirst<User>(
        'SELECT * FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );

      return user || null;
    } catch (error) {
      console.error('Failed to get user by email:', error);
      return null;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await DatabaseService.executeQueryFirst<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      return user || null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  // Authenticate user
  static async authenticateUser(credentials: LoginCredentials): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(credentials.email);
      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await EncryptionService.verifyHash(
        credentials.password,
        user.password_hash
      );

      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Failed to authenticate user:', error);
      return null;
    }
  }

  // Update last login timestamp
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await DatabaseService.executeUpdate(
        'UPDATE users SET last_login = ?, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), new Date().toISOString(), userId]
      );
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  // Update user profile
  static async updateUser(userId: string, updateData: Partial<User>): Promise<User | null> {
    try {
      // Remove fields that shouldn't be updated directly
      const { id, created_at, password_hash, ...allowedUpdates } = updateData;

      const dataToUpdate = {
        ...allowedUpdates,
        updated_at: new Date().toISOString(),
      };

      await SecureDatabaseService.secureUpdate(
        'users',
        dataToUpdate,
        { id: userId }
      );

      return await this.getUserById(userId);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Change password
  static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isValidOldPassword = await EncryptionService.verifyHash(
        oldPassword,
        user.password_hash
      );

      if (!isValidOldPassword) {
        throw new Error('Invalid current password');
      }

      // Hash new password
      const newPasswordHash = await EncryptionService.hashData(newPassword);

      // Update password
      await SecureDatabaseService.secureUpdate(
        'users',
        { 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        },
        { id: userId },
        ['password_hash']
      );

      return true;
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  // Verify user email
  static async verifyUser(userId: string): Promise<boolean> {
    try {
      await SecureDatabaseService.secureUpdate(
        'users',
        { 
          is_verified: true,
          updated_at: new Date().toISOString()
        },
        { id: userId }
      );

      return true;
    } catch (error) {
      console.error('Failed to verify user:', error);
      return false;
    }
  }

  // Delete user (soft delete by marking as inactive)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      // In a production app, you might want to soft delete or anonymize data
      // For now, we'll actually delete the user and their data
      
      // Delete user's health data
      await SecureDatabaseService.secureDelete('weight_readings', { user_id: userId });
      await SecureDatabaseService.secureDelete('blood_sugar_readings', { user_id: userId });
      await SecureDatabaseService.secureDelete('blood_pressure_readings', { user_id: userId });
      await SecureDatabaseService.secureDelete('activity_sessions', { user_id: userId });
      await SecureDatabaseService.secureDelete('user_profile', { user_id: userId });

      // Delete user
      await SecureDatabaseService.secureDelete('users', { id: userId });

      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Get user statistics
  static async getUserStatistics(userId: string): Promise<any> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return null;
      }

      // Get counts of user's health data
      const weightCount = await DatabaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM weight_readings WHERE user_id = ?',
        [userId]
      );

      const bloodSugarCount = await DatabaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM blood_sugar_readings WHERE user_id = ?',
        [userId]
      );

      const bloodPressureCount = await DatabaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM blood_pressure_readings WHERE user_id = ?',
        [userId]
      );

      const activityCount = await DatabaseService.executeQueryFirst<{ count: number }>(
        'SELECT COUNT(*) as count FROM activity_sessions WHERE user_id = ?',
        [userId]
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login: user.last_login,
        },
        statistics: {
          weight_readings: weightCount?.count || 0,
          blood_sugar_readings: bloodSugarCount?.count || 0,
          blood_pressure_readings: bloodPressureCount?.count || 0,
          activity_sessions: activityCount?.count || 0,
        },
      };
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      return null;
    }
  }
}

export default UserRepository;
