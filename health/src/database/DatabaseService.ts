import * as SQLite from 'expo-sqlite';

export interface DatabaseConfig {
  name: string;
  version: number;
}

export interface Migration {
  version: number;
  up: string[];
  down: string[];
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly config: DatabaseConfig = {
    name: 'health_app.db',
    version: 1,
  };

  private migrations: Migration[] = [
    {
      version: 1,
      up: [
        `CREATE TABLE IF NOT EXISTS weight_readings (
          id TEXT PRIMARY KEY,
          weight REAL NOT NULL,
          unit TEXT NOT NULL CHECK (unit IN ('kg', 'lbs')),
          body_fat REAL,
          muscle_mass REAL,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_weight_timestamp ON weight_readings(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_weight_created_at ON weight_readings(created_at)`,

        `CREATE TABLE IF NOT EXISTS blood_sugar_readings (
          id TEXT PRIMARY KEY,
          value REAL NOT NULL,
          meal_context TEXT CHECK (meal_context IN ('fasting', 'before-meal', 'after-meal', 'bedtime')),
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_blood_sugar_timestamp ON blood_sugar_readings(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_blood_sugar_meal_context ON blood_sugar_readings(meal_context)`,

        `CREATE TABLE IF NOT EXISTS blood_pressure_readings (
          id TEXT PRIMARY KEY,
          systolic INTEGER NOT NULL,
          diastolic INTEGER NOT NULL,
          heart_rate INTEGER,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_blood_pressure_timestamp ON blood_pressure_readings(timestamp)`,

        `CREATE TABLE IF NOT EXISTS activity_sessions (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          duration INTEGER NOT NULL,
          calories_burned REAL,
          distance REAL,
          steps INTEGER,
          timestamp TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_sessions(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_sessions(type)`,

        `CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY,
          name TEXT,
          date_of_birth TEXT,
          gender TEXT CHECK (gender IN ('male', 'female', 'other')),
          height REAL,
          height_unit TEXT CHECK (height_unit IN ('cm', 'ft')),
          target_weight REAL,
          target_weight_unit TEXT CHECK (target_weight_unit IN ('kg', 'lbs')),
          activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS database_version (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ],
      down: [
        'DROP TABLE IF EXISTS weight_readings',
        'DROP TABLE IF EXISTS blood_sugar_readings',
        'DROP TABLE IF EXISTS blood_pressure_readings',
        'DROP TABLE IF EXISTS activity_sessions',
        'DROP TABLE IF EXISTS user_profile',
        'DROP TABLE IF EXISTS app_settings',
        'DROP TABLE IF EXISTS database_version',
      ],
    },
  ];

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.config.name);
      await this.runMigrations();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion();
      
      // Run migrations
      for (const migration of this.migrations) {
        if (migration.version > currentVersion) {
          console.log(`Running migration ${migration.version}`);
          
          await this.db.withTransactionAsync(async () => {
            for (const statement of migration.up) {
              await this.db!.execAsync(statement);
            }
            
            // Update version
            await this.db!.runAsync(
              'INSERT OR REPLACE INTO database_version (version) VALUES (?)',
              [migration.version]
            );
          });
          
          console.log(`Migration ${migration.version} completed`);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async getCurrentVersion(): Promise<number> {
    if (!this.db) return 0;

    try {
      const result = await this.db.getFirstAsync<{ version: number }>(
        'SELECT version FROM database_version ORDER BY version DESC LIMIT 1'
      );
      return result?.version || 0;
    } catch (error) {
      // Table doesn't exist yet, return 0
      return 0;
    }
  }

  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    const db = await this.getDatabase();
    try {
      const result = await db.getAllAsync<T>(query, params);
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async executeQueryFirst<T>(query: string, params: any[] = []): Promise<T | null> {
    const db = await this.getDatabase();
    try {
      const result = await db.getFirstAsync<T>(query, params);
      return result || null;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async executeUpdate(query: string, params: any[] = []): Promise<SQLite.SQLiteRunResult> {
    const db = await this.getDatabase();
    try {
      const result = await db.runAsync(query, params);
      return result;
    } catch (error) {
      console.error('Update execution failed:', error);
      throw error;
    }
  }

  async executeTransaction(operations: (() => Promise<void>)[]): Promise<void> {
    const db = await this.getDatabase();
    try {
      await db.withTransactionAsync(async () => {
        for (const operation of operations) {
          await operation();
        }
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) return;

    try {
      // Run down migrations in reverse order
      const reversedMigrations = [...this.migrations].reverse();
      
      await this.db.withTransactionAsync(async () => {
        for (const migration of reversedMigrations) {
          for (const statement of migration.down) {
            await this.db!.execAsync(statement);
          }
        }
      });

      console.log('Database reset completed');
    } catch (error) {
      console.error('Database reset failed:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
