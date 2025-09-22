import DatabaseService from './DatabaseService';
import EncryptionService from '../utils/security/EncryptionService';
import AuthService from '../utils/security/AuthService';
import HealthDataValidator from '../utils/validation/DataValidator';

export class SecureDatabaseService {
  // Secure data insertion with validation and encryption
  static async secureInsert(
    table: string,
    data: any,
    encryptFields: string[] = []
  ): Promise<any> {
    try {
      // Check authentication
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Validate data based on table
      const validatedData = await this.validateTableData(table, data);

      // Encrypt sensitive fields
      const processedData = { ...validatedData };
      for (const field of encryptFields) {
        if (processedData[field]) {
          const encrypted = await EncryptionService.encryptHealthData(
            JSON.stringify(processedData[field])
          );
          processedData[field] = JSON.stringify(encrypted);
        }
      }

      // Add security metadata
      processedData.created_at = new Date().toISOString();
      processedData.updated_at = new Date().toISOString();

      // Insert into database
      const query = this.buildInsertQuery(table, processedData);
      const values = Object.values(processedData);
      
      const result = await DatabaseService.executeUpdate(query, values);

      // Log security event
      await AuthService.logSecurityEvent('data_insert', {
        table,
        recordId: result.lastInsertRowId,
      });

      return result;
    } catch (error) {
      await AuthService.logSecurityEvent('data_insert_failed', {
        table,
        error: error.message,
      });
      throw error;
    }
  }

  // Secure data retrieval with decryption
  static async secureSelect(
    table: string,
    conditions: any = {},
    encryptedFields: string[] = []
  ): Promise<any[]> {
    try {
      // Check authentication
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Build and execute query
      const { query, values } = this.buildSelectQuery(table, conditions);
      const results = await DatabaseService.executeQuery(query, values);

      // Decrypt sensitive fields
      const decryptedResults = await Promise.all(
        results.map(async (row: any) => {
          const decryptedRow = { ...row };
          
          for (const field of encryptedFields) {
            if (decryptedRow[field]) {
              try {
                const encryptedData = JSON.parse(decryptedRow[field]);
                const decrypted = await EncryptionService.decryptHealthData(encryptedData);
                decryptedRow[field] = JSON.parse(decrypted);
              } catch (error) {
                console.warn(`Failed to decrypt field ${field}:`, error);
              }
            }
          }
          
          return decryptedRow;
        })
      );

      // Log security event
      await AuthService.logSecurityEvent('data_select', {
        table,
        recordCount: results.length,
      });

      return decryptedResults;
    } catch (error) {
      await AuthService.logSecurityEvent('data_select_failed', {
        table,
        error: error.message,
      });
      throw error;
    }
  }

  // Secure data update
  static async secureUpdate(
    table: string,
    data: any,
    conditions: any,
    encryptFields: string[] = []
  ): Promise<any> {
    try {
      // Check authentication
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Validate data
      const validatedData = await this.validateTableData(table, data);

      // Encrypt sensitive fields
      const processedData = { ...validatedData };
      for (const field of encryptFields) {
        if (processedData[field]) {
          const encrypted = await EncryptionService.encryptHealthData(
            JSON.stringify(processedData[field])
          );
          processedData[field] = JSON.stringify(encrypted);
        }
      }

      // Add update timestamp
      processedData.updated_at = new Date().toISOString();

      // Build and execute query
      const { query, values } = this.buildUpdateQuery(table, processedData, conditions);
      const result = await DatabaseService.executeUpdate(query, values);

      // Log security event
      await AuthService.logSecurityEvent('data_update', {
        table,
        affectedRows: result.changes,
      });

      return result;
    } catch (error) {
      await AuthService.logSecurityEvent('data_update_failed', {
        table,
        error: error.message,
      });
      throw error;
    }
  }

  // Secure data deletion
  static async secureDelete(table: string, conditions: any): Promise<any> {
    try {
      // Check authentication
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        throw new Error('User not authenticated');
      }

      // Build and execute query
      const { query, values } = this.buildDeleteQuery(table, conditions);
      const result = await DatabaseService.executeUpdate(query, values);

      // Log security event
      await AuthService.logSecurityEvent('data_delete', {
        table,
        affectedRows: result.changes,
      });

      return result;
    } catch (error) {
      await AuthService.logSecurityEvent('data_delete_failed', {
        table,
        error: error.message,
      });
      throw error;
    }
  }

  // Data validation based on table
  private static async validateTableData(table: string, data: any): Promise<any> {
    switch (table) {
      case 'blood_sugar_readings':
        return HealthDataValidator.validateBloodSugar(data);
      case 'blood_pressure_readings':
        return HealthDataValidator.validateBloodPressure(data);
      case 'weight_readings':
        return HealthDataValidator.validateWeight(data);
      case 'user_profile':
        return HealthDataValidator.validateUserProfile(data);
      default:
        return data; // No specific validation
    }
  }

  // Query builders with SQL injection protection
  private static buildInsertQuery(table: string, data: any): string {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const fieldNames = fields.join(', ');
    
    return `INSERT INTO ${this.sanitizeTableName(table)} (${fieldNames}) VALUES (${placeholders})`;
  }

  private static buildSelectQuery(table: string, conditions: any): { query: string; values: any[] } {
    let query = `SELECT * FROM ${this.sanitizeTableName(table)}`;
    const values: any[] = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    return { query, values };
  }

  private static buildUpdateQuery(
    table: string,
    data: any,
    conditions: any
  ): { query: string; values: any[] } {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');

    const query = `UPDATE ${this.sanitizeTableName(table)} SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...Object.values(conditions)];

    return { query, values };
  }

  private static buildDeleteQuery(table: string, conditions: any): { query: string; values: any[] } {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = ?`)
      .join(' AND ');

    const query = `DELETE FROM ${this.sanitizeTableName(table)} WHERE ${whereClause}`;
    const values = Object.values(conditions);

    return { query, values };
  }

  // Sanitize table names to prevent SQL injection
  private static sanitizeTableName(tableName: string): string {
    // Only allow alphanumeric characters and underscores
    const sanitized = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Whitelist of allowed table names
    const allowedTables = [
      'users',
      'weight_readings',
      'blood_sugar_readings',
      'blood_pressure_readings',
      'activity_sessions',
      'user_profile',
      'app_settings',
    ];

    if (!allowedTables.includes(sanitized)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    return sanitized;
  }

  // Database integrity check
  static async performIntegrityCheck(): Promise<boolean> {
    try {
      const result = await DatabaseService.executeQuery('PRAGMA integrity_check');
      return result.length === 1 && result[0].integrity_check === 'ok';
    } catch (error) {
      console.error('Database integrity check failed:', error);
      return false;
    }
  }

  // Backup database
  static async createSecureBackup(): Promise<string> {
    try {
      // Get all data from critical tables
      const tables = ['weight_readings', 'blood_sugar_readings', 'blood_pressure_readings'];
      const backup: any = {};

      for (const table of tables) {
        backup[table] = await this.secureSelect(table);
      }

      // Encrypt backup data
      const backupData = JSON.stringify(backup);
      const encryptedBackup = await EncryptionService.encryptHealthData(backupData);

      // Log security event
      await AuthService.logSecurityEvent('backup_created', {
        timestamp: new Date().toISOString(),
      });

      return JSON.stringify(encryptedBackup);
    } catch (error) {
      await AuthService.logSecurityEvent('backup_failed', {
        error: error.message,
      });
      throw error;
    }
  }
}

export default SecureDatabaseService;
