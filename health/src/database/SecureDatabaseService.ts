import DatabaseService from './DatabaseService';
import EncryptionService from '../utils/security/EncryptionService';
import AuthService from '../utils/security/AuthService';
import HealthDataValidator from '../utils/validation/DataValidator';

// Define interface for SQLite query results
interface IntegrityCheckResult {
  integrity_check: string;
}

export class SecureDatabaseService {
  // Initialize database with all required tables
  static async initDatabase(): Promise<void> {
    try {
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS weight_readings (
          id TEXT PRIMARY KEY,
          weight REAL NOT NULL,
          unit TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS blood_sugar_readings (
          id TEXT PRIMARY KEY,
          level INTEGER NOT NULL,
          unit TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS blood_pressure_readings (
          id TEXT PRIMARY KEY,
          systolic INTEGER NOT NULL,
          diastolic INTEGER NOT NULL,
          heart_rate INTEGER,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS activity_sessions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          duration INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          height_cm REAL,
          conditions TEXT, // JSON string of conditions (e.g., ["Obesity"])
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          preferences TEXT, // JSON string
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS medication_readings (
          id TEXT PRIMARY KEY,
          medication_name TEXT NOT NULL,
          dose REAL NOT NULL,
          unit TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS bookmarked_topics (
          id TEXT PRIMARY KEY,
          topic_name TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS learning_progress (
          id TEXT PRIMARY KEY,
          topic_id TEXT NOT NULL,
          progress REAL NOT NULL, // e.g., 0.75 for 75% complete
          last_updated TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      await DatabaseService.executeUpdate(
        `CREATE TABLE IF NOT EXISTS user_achievements (
          id TEXT PRIMARY KEY,
          achievement_name TEXT NOT NULL,
          description TEXT,
          achieved_on TEXT NOT NULL,
          badge_icon TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`
      );
      console.log('Database initialized successfully');
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Database initialization failed:', err.message);
      throw new Error(`Database initialization failed: ${err.message}`);
    }
  }

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
    } catch (error: unknown) {
      const err = error as Error;
      await AuthService.logSecurityEvent('data_insert_failed', {
        table,
        error: err.message || 'Unknown error',
      });
      throw err;
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
              } catch (error: unknown) {
                console.warn(`Failed to decrypt field ${field}:`, (error as Error).message);
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
    } catch (error: unknown) {
      const err = error as Error;
      await AuthService.logSecurityEvent('data_select_failed', {
        table,
        error: err.message || 'Unknown error',
      });
      throw err;
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
    } catch (error: unknown) {
      const err = error as Error;
      await AuthService.logSecurityEvent('data_update_failed', {
        table,
        error: err.message || 'Unknown error',
      });
      throw err;
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
    } catch (error: unknown) {
      const err = error as Error;
      await AuthService.logSecurityEvent('data_delete_failed', {
        table,
        error: err.message || 'Unknown error',
      });
      throw err;
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
      const whereParts: string[] = [];
      for (const [key, value] of Object.entries(conditions)) {
        if (key.endsWith('_gte')) {
          whereParts.push(`${key.replace('_gte', '')} >= ?`);
          values.push(value);
        } else if (key.endsWith('_lte')) {
          whereParts.push(`${key.replace('_lte', '')} <= ?`);
          values.push(value);
        } else {
          whereParts.push(`${key} = ?`);
          values.push(value);
        }
      }
      if (whereParts.length > 0) {
        query += ` WHERE ${whereParts.join(' AND ')}`;
      }
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
    
    const whereParts: string[] = [];
    const whereValues: any[] = [];
    for (const [key, value] of Object.entries(conditions)) {
      if (key.endsWith('_gte')) {
        whereParts.push(`${key.replace('_gte', '')} >= ?`);
        whereValues.push(value);
      } else if (key.endsWith('_lte')) {
        whereParts.push(`${key.replace('_lte', '')} <= ?`);
        whereValues.push(value);
      } else {
        whereParts.push(`${key} = ?`);
        whereValues.push(value);
      }
    }

    const whereClause = whereParts.join(' AND ');
    const query = `UPDATE ${this.sanitizeTableName(table)} SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...whereValues];

    return { query, values };
  }

  private static buildDeleteQuery(table: string, conditions: any): { query: string; values: any[] } {
    const whereParts: string[] = [];
    const whereValues: any[] = [];
    for (const [key, value] of Object.entries(conditions)) {
      if (key.endsWith('_gte')) {
        whereParts.push(`${key.replace('_gte', '')} >= ?`);
        whereValues.push(value);
      } else if (key.endsWith('_lte')) {
        whereParts.push(`${key.replace('_lte', '')} <= ?`);
        whereValues.push(value);
      } else {
        whereParts.push(`${key} = ?`);
        whereValues.push(value);
      }
    }

    const whereClause = whereParts.join(' AND ');
    const query = `DELETE FROM ${this.sanitizeTableName(table)} WHERE ${whereClause}`;
    const values = whereValues;

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
      'medication_readings',
      'bookmarked_topics',
      'learning_progress',
      'user_achievements',
    ];

    if (!allowedTables.includes(sanitized)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    return sanitized;
  }

  // Database integrity check
  static async performIntegrityCheck(): Promise<boolean> {
    try {
      const result = await DatabaseService.executeQuery<IntegrityCheckResult>('PRAGMA integrity_check');
      return result.length === 1 && (result as any)[0].integrity_check === 'ok';
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Database integrity check failed:', err.message || 'Unknown error');
      return false;
    }
  }

  // Backup database
  static async createSecureBackup(): Promise<string> {
    try {
      // Get all data from critical tables
      const tables = [
        'weight_readings',
        'blood_sugar_readings',
        'blood_pressure_readings',
        'bookmarked_topics',
        'learning_progress',
        'user_achievements',
      ];
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
    } catch (error: unknown) {
      const err = error as Error;
      await AuthService.logSecurityEvent('backup_failed', {
        error: err.message || 'Unknown error',
      });
      throw err;
    }
  }
}

export default SecureDatabaseService;