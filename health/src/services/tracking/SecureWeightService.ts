import { WeightReading } from './WeightService';
import SecureDatabaseService from '../../database/SecureDatabaseService';
import ApiSecurity from '../../utils/security/ApiSecurity';
import AuthService from '../../utils/security/AuthService';
import ErrorHandler, { ErrorType } from '../../utils/error/ErrorHandler';
import HealthDataValidator from '../../utils/validation/DataValidator';

export class SecureWeightService {
  private static readonly ENCRYPTED_FIELDS = ['notes'];
  private static readonly API_CATEGORY = 'health-data';

  // Add weight reading with full security
  static async addReading(reading: Omit<WeightReading, 'id'>): Promise<string> {
    try {
      // Get current user session
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/add',
        session.user.id,
        this.API_CATEGORY
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Too many weight entries', 'add_weight');
      }

      // Validate input data
      const validatedReading = HealthDataValidator.validateWeight(reading);

      // Add user ID and generate unique ID
      const readingWithId = {
        id: this.generateId(),
        ...validatedReading,
        userId: session.user.id,
      };

      // Insert using secure database service
      const result = await SecureDatabaseService.secureInsert(
        'weight_readings',
        readingWithId,
        this.ENCRYPTED_FIELDS
      );

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/add',
        'POST',
        session.user.id,
        true,
        this.API_CATEGORY
      );

      return readingWithId.id;
    } catch (error) {
      // Record failed API request
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/add',
          'POST',
          session.user.id,
          false,
          this.API_CATEGORY
        );
      }

      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      
      throw ErrorHandler.handleDatabaseError(`Failed to add weight reading: ${error.message}`);
    }
  }

  // Get weight readings with security checks
  static async getReadings(
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<WeightReading[]> {
    try {
      // Get current user session
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/get',
        session.user.id,
        this.API_CATEGORY
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Too many requests', 'get_weight');
      }

      // Build conditions
      const conditions: any = { userId: session.user.id };
      
      if (startDate) {
        conditions.timestamp_gte = startDate.toISOString();
      }
      
      if (endDate) {
        conditions.timestamp_lte = endDate.toISOString();
      }

      // Get readings using secure database service
      let readings = await SecureDatabaseService.secureSelect(
        'weight_readings',
        conditions,
        this.ENCRYPTED_FIELDS
      );

      // Apply additional filtering and sorting
      readings = readings
        .filter(reading => {
          if (startDate && new Date(reading.timestamp) < startDate) return false;
          if (endDate && new Date(reading.timestamp) > endDate) return false;
          return true;
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit
      if (limit) {
        readings = readings.slice(0, limit);
      }

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/get',
        'GET',
        session.user.id,
        true,
        this.API_CATEGORY
      );

      return readings.map(this.mapDatabaseToReading);
    } catch (error) {
      // Record failed API request
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/get',
          'GET',
          session.user.id,
          false,
          this.API_CATEGORY
        );
      }

      if (error instanceof Error && error.message.includes('authentication')) {
        throw error;
      }
      
      throw ErrorHandler.handleDatabaseError(`Failed to get weight readings: ${error.message}`);
    }
  }

  // Update weight reading
  static async updateReading(id: string, updates: Partial<WeightReading>): Promise<void> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/update',
        session.user.id,
        this.API_CATEGORY
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Too many update requests', 'update_weight');
      }

      // Validate updates
      if (updates.weight !== undefined || updates.unit !== undefined) {
        const validatedData = HealthDataValidator.validateWeight({
          weight: updates.weight || 0,
          unit: updates.unit || 'kg',
          timestamp: updates.timestamp || new Date(),
          ...updates,
        });
        Object.assign(updates, validatedData);
      }

      // Update using secure database service
      await SecureDatabaseService.secureUpdate(
        'weight_readings',
        updates,
        { id, userId: session.user.id },
        this.ENCRYPTED_FIELDS
      );

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/update',
        'PUT',
        session.user.id,
        true,
        this.API_CATEGORY
      );
    } catch (error) {
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/update',
          'PUT',
          session.user.id,
          false,
          this.API_CATEGORY
        );
      }

      throw ErrorHandler.handleDatabaseError(`Failed to update weight reading: ${error.message}`);
    }
  }

  // Delete weight reading
  static async deleteReading(id: string): Promise<void> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/delete',
        session.user.id,
        this.API_CATEGORY
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Too many delete requests', 'delete_weight');
      }

      // Delete using secure database service
      await SecureDatabaseService.secureDelete(
        'weight_readings',
        { id, userId: session.user.id }
      );

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/delete',
        'DELETE',
        session.user.id,
        true,
        this.API_CATEGORY
      );
    } catch (error) {
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/delete',
          'DELETE',
          session.user.id,
          false,
          this.API_CATEGORY
        );
      }

      throw ErrorHandler.handleDatabaseError(`Failed to delete weight reading: ${error.message}`);
    }
  }

  // Get weight statistics with caching
  static async getStatistics(days: number = 30): Promise<{
    currentWeight: number | null;
    weightChange: number;
    averageWeight: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    bmi?: number;
    bodyFatAverage?: number;
  }> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/stats',
        session.user.id,
        this.API_CATEGORY
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Too many statistics requests', 'weight_stats');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const readings = await this.getReadings(startDate, endDate);

      if (readings.length === 0) {
        return {
          currentWeight: null,
          weightChange: 0,
          averageWeight: 0,
          trend: 'stable',
        };
      }

      // Calculate statistics
      const weights = readings.map(r => r.weight);
      const currentWeight = weights[0];
      const oldestWeight = weights[weights.length - 1];
      const weightChange = currentWeight - oldestWeight;
      const averageWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(weightChange) > 0.5) {
        trend = weightChange > 0 ? 'increasing' : 'decreasing';
      }

      // Calculate BMI if height is available
      let bmi: number | undefined;
      // This would come from user profile in a real implementation

      // Calculate body fat average
      const bodyFatReadings = readings.filter(r => r.bodyFat !== undefined);
      const bodyFatAverage = bodyFatReadings.length > 0
        ? bodyFatReadings.reduce((sum, r) => sum + r.bodyFat!, 0) / bodyFatReadings.length
        : undefined;

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/stats',
        'GET',
        session.user.id,
        true,
        this.API_CATEGORY
      );

      return {
        currentWeight,
        weightChange,
        averageWeight,
        trend,
        bmi,
        bodyFatAverage,
      };
    } catch (error) {
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/stats',
          'GET',
          session.user.id,
          false,
          this.API_CATEGORY
        );
      }

      throw ErrorHandler.handleDatabaseError(`Failed to get weight statistics: ${error.message}`);
    }
  }

  // Export weight data securely
  static async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const session = await AuthService.getCurrentSession();
      if (!session) {
        throw ErrorHandler.handleAuthenticationError('User not authenticated');
      }

      // Check rate limiting for exports
      const rateLimitOk = await ApiSecurity.checkRateLimit(
        'weight/export',
        session.user.id,
        'export'
      );
      
      if (!rateLimitOk) {
        throw ErrorHandler.handleRateLimitError('Export limit exceeded', 'export_weight');
      }

      const readings = await this.getReadings();

      let exportData: string;
      if (format === 'csv') {
        exportData = this.convertToCSV(readings);
      } else {
        exportData = JSON.stringify(readings, null, 2);
      }

      // Record API request
      await ApiSecurity.recordApiRequest(
        'weight/export',
        'GET',
        session.user.id,
        true,
        'export'
      );

      return exportData;
    } catch (error) {
      const session = await AuthService.getCurrentSession();
      if (session) {
        await ApiSecurity.recordApiRequest(
          'weight/export',
          'GET',
          session.user.id,
          false,
          'export'
        );
      }

      throw ErrorHandler.handleDatabaseError(`Failed to export weight data: ${error.message}`);
    }
  }

  // Helper methods
  private static generateId(): string {
    return `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static mapDatabaseToReading(dbRecord: any): WeightReading {
    return {
      id: dbRecord.id,
      weight: dbRecord.weight,
      unit: dbRecord.unit,
      bodyFat: dbRecord.body_fat,
      muscleMass: dbRecord.muscle_mass,
      timestamp: new Date(dbRecord.timestamp),
      notes: dbRecord.notes,
    };
  }

  private static convertToCSV(readings: WeightReading[]): string {
    const headers = ['Date', 'Weight', 'Unit', 'Body Fat %', 'Muscle Mass', 'Notes'];
    const rows = readings.map(reading => [
      reading.timestamp.toISOString().split('T')[0],
      reading.weight.toString(),
      reading.unit,
      reading.bodyFat?.toString() || '',
      reading.muscleMass?.toString() || '',
      reading.notes || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export default SecureWeightService;
