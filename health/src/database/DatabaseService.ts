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
    version: 3,
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
    {
      version: 2,
      up: [
        // Create users table
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          is_verified BOOLEAN DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_login TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
        `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,

        // Add user_id to existing tables
        `ALTER TABLE weight_readings ADD COLUMN user_id TEXT REFERENCES users(id)`,
        `ALTER TABLE blood_sugar_readings ADD COLUMN user_id TEXT REFERENCES users(id)`,
        `ALTER TABLE blood_pressure_readings ADD COLUMN user_id TEXT REFERENCES users(id)`,
        `ALTER TABLE activity_sessions ADD COLUMN user_id TEXT REFERENCES users(id)`,
        `ALTER TABLE user_profile ADD COLUMN user_id TEXT REFERENCES users(id)`,

        // Create indexes for user_id columns
        `CREATE INDEX IF NOT EXISTS idx_weight_user_id ON weight_readings(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_blood_sugar_user_id ON blood_sugar_readings(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_blood_pressure_user_id ON blood_pressure_readings(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_sessions(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id)`,
      ],
      down: [
        'DROP INDEX IF EXISTS idx_weight_user_id',
        'DROP INDEX IF EXISTS idx_blood_sugar_user_id',
        'DROP INDEX IF EXISTS idx_blood_pressure_user_id',
        'DROP INDEX IF EXISTS idx_activity_user_id',
        'DROP INDEX IF EXISTS idx_user_profile_user_id',
        'DROP TABLE IF EXISTS users',
      ],
    },
    {
      version: 3,
      up: [
        // Meals and Hydration tables
        `CREATE TABLE IF NOT EXISTS meals (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          date TEXT NOT NULL,
          name TEXT NOT NULL,
          total_calories REAL,
          total_carbs REAL,
          total_protein REAL,
          total_fat REAL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date)`,

        `CREATE TABLE IF NOT EXISTS meal_items (
          id TEXT PRIMARY KEY,
          meal_id TEXT REFERENCES meals(id),
          food_name TEXT NOT NULL,
          brand_name TEXT,
          serving_qty REAL,
          serving_unit TEXT,
          calories REAL,
          carbs REAL,
          protein REAL,
          fat REAL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id)`,

        `CREATE TABLE IF NOT EXISTS hydration_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          date TEXT NOT NULL,
          amount_ml REAL NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_hydration_user_date ON hydration_logs(user_id, date)`,

        // Medication readings table
        `CREATE TABLE IF NOT EXISTS medication_readings (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          name TEXT NOT NULL,
          dosage TEXT NOT NULL,
          unit TEXT NOT NULL,
          frequency TEXT NOT NULL,
          timeTaken TEXT NOT NULL,
          notes TEXT,
          skipped BOOLEAN DEFAULT 0,
          timestamp TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_medication_user_id ON medication_readings(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_medication_timestamp ON medication_readings(timestamp)`,
      ],
      down: [
        'DROP INDEX IF EXISTS idx_meals_user_date',
        'DROP INDEX IF EXISTS idx_meal_items_meal_id',
        'DROP INDEX IF EXISTS idx_hydration_user_date',
        'DROP INDEX IF EXISTS idx_medication_user_id',
        'DROP INDEX IF EXISTS idx_medication_timestamp',
        'DROP TABLE IF EXISTS meal_items',
        'DROP TABLE IF EXISTS meals',
        'DROP TABLE IF EXISTS hydration_logs',
        'DROP TABLE IF EXISTS medication_readings',
      ],
    },
    {
      version: 4,
      up: [
        // Gamification tables for Learn section
        `CREATE TABLE IF NOT EXISTS bookmarked_topics (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          topic_id TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, topic_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarked_topics_user_id ON bookmarked_topics(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_bookmarked_topics_topic_id ON bookmarked_topics(topic_id)`,

        `CREATE TABLE IF NOT EXISTS topic_views (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          topic_id TEXT NOT NULL,
          viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE INDEX IF NOT EXISTS idx_topic_views_user_id ON topic_views(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_topic_views_topic_id ON topic_views(topic_id)`,
        `CREATE INDEX IF NOT EXISTS idx_topic_views_viewed_at ON topic_views(viewed_at)`,

        `CREATE TABLE IF NOT EXISTS learning_progress (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          total_topics_read INTEGER DEFAULT 0,
          streak_days INTEGER DEFAULT 0,
          last_read_date TEXT,
          points_earned INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          weekly_goal INTEGER DEFAULT 3,
          weekly_progress INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_learning_progress_level ON learning_progress(level)`,

        `CREATE TABLE IF NOT EXISTS user_achievements (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          achievement_id TEXT NOT NULL,
          unlocked_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, achievement_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id)`,
      ],
      down: [
        'DROP INDEX IF EXISTS idx_bookmarked_topics_user_id',
        'DROP INDEX IF EXISTS idx_bookmarked_topics_topic_id',
        'DROP INDEX IF EXISTS idx_topic_views_user_id',
        'DROP INDEX IF EXISTS idx_topic_views_topic_id',
        'DROP INDEX IF EXISTS idx_topic_views_viewed_at',
        'DROP INDEX IF EXISTS idx_learning_progress_user_id',
        'DROP INDEX IF EXISTS idx_learning_progress_level',
        'DROP INDEX IF EXISTS idx_user_achievements_user_id',
        'DROP INDEX IF EXISTS idx_user_achievements_achievement_id',
        'DROP TABLE IF EXISTS user_achievements',
        'DROP TABLE IF EXISTS learning_progress',
        'DROP TABLE IF EXISTS topic_views',
        'DROP TABLE IF EXISTS bookmarked_topics',
      ],
    },
    {
      version: 5,
      up: [
        `CREATE TABLE IF NOT EXISTS game_stats (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          level INTEGER DEFAULT 1,
          xp INTEGER DEFAULT 0,
          xpToNext INTEGER DEFAULT 100,
          streak INTEGER DEFAULT 0,
          totalPoints INTEGER DEFAULT 0,
          badges TEXT,
          dailyChallengeId TEXT,
          dailyProgress INTEGER DEFAULT 0,
          weeklyQuestId TEXT,
          weeklyProgress INTEGER DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id)`
      ],
      down: [
        'DROP INDEX IF EXISTS idx_game_stats_user_id',
        'DROP TABLE IF EXISTS game_stats',
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

  // Health Logger Database Methods
  
  // Blood Pressure Methods
  async saveBloodPressureReading(reading: {
    id: string;
    systolic: number;
    diastolic: number;
    heart_rate?: number;
    timestamp: string;
    notes?: string;
    user_id?: string;
  }): Promise<void> {
    await this.executeUpdate(
      `INSERT OR REPLACE INTO blood_pressure_readings 
       (id, systolic, diastolic, heart_rate, timestamp, notes, user_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [reading.id, reading.systolic, reading.diastolic, reading.heart_rate, reading.timestamp, reading.notes, reading.user_id]
    );
  }

  async getBloodPressureReadings(user_id?: string, limit: number = 50): Promise<any[]> {
    const query = user_id 
      ? `SELECT * FROM blood_pressure_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM blood_pressure_readings ORDER BY timestamp DESC LIMIT ?`;
    const params = user_id ? [user_id, limit] : [limit];
    return await this.executeQuery(query, params);
  }

  async deleteBloodPressureReading(id: string): Promise<void> {
    await this.executeUpdate('DELETE FROM blood_pressure_readings WHERE id = ?', [id]);
  }

  // Weight Methods
  async saveWeightReading(reading: {
    id: string;
    weight: number;
    unit: string;
    timestamp: string;
    notes?: string;
    user_id?: string;
  }): Promise<void> {
    await this.executeUpdate(
      `INSERT OR REPLACE INTO weight_readings 
       (id, weight, unit, timestamp, notes, user_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [reading.id, reading.weight, reading.unit, reading.timestamp, reading.notes, reading.user_id]
    );
  }

  async getWeightReadings(user_id?: string, limit: number = 50): Promise<any[]> {
    const query = user_id 
      ? `SELECT * FROM weight_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM weight_readings ORDER BY timestamp DESC LIMIT ?`;
    const params = user_id ? [user_id, limit] : [limit];
    return await this.executeQuery(query, params);
  }

  async deleteWeightReading(id: string): Promise<void> {
    await this.executeUpdate('DELETE FROM weight_readings WHERE id = ?', [id]);
  }

  // Blood Sugar Methods
  async saveBloodSugarReading(reading: {
    id: string;
    value: number;
    meal_context: string;
    timestamp: string;
    notes?: string;
    user_id?: string;
  }): Promise<void> {
    await this.executeUpdate(
      `INSERT OR REPLACE INTO blood_sugar_readings 
       (id, value, meal_context, timestamp, notes, user_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [reading.id, reading.value, reading.meal_context, reading.timestamp, reading.notes, reading.user_id]
    );
  }

  async getBloodSugarReadings(user_id?: string, limit: number = 50): Promise<any[]> {
    const query = user_id 
      ? `SELECT * FROM blood_sugar_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM blood_sugar_readings ORDER BY timestamp DESC LIMIT ?`;
    const params = user_id ? [user_id, limit] : [limit];
    return await this.executeQuery(query, params);
  }

  async deleteBloodSugarReading(id: string): Promise<void> {
    await this.executeUpdate('DELETE FROM blood_sugar_readings WHERE id = ?', [id]);
  }

  // Medication Methods
  async saveMedicationReading(reading: {
    id: string;
    name: string;
    dosage: string;
    unit: string;
    frequency: string;
    timeTaken: string;
    timestamp: string;
    notes?: string;
    skipped?: boolean;
    user_id?: string;
  }): Promise<void> {
    await this.executeUpdate(
      `INSERT OR REPLACE INTO medication_readings 
       (id, name, dosage, unit, frequency, timeTaken, timestamp, notes, skipped, user_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [reading.id, reading.name, reading.dosage, reading.unit, reading.frequency, reading.timeTaken, reading.timestamp, reading.notes, reading.skipped ? 1 : 0, reading.user_id]
    );
  }

  async getMedicationReadings(user_id?: string, limit: number = 50): Promise<any[]> {
    const query = user_id 
      ? `SELECT * FROM medication_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?`
      : `SELECT * FROM medication_readings ORDER BY timestamp DESC LIMIT ?`;
    const params = user_id ? [user_id, limit] : [limit];
    return await this.executeQuery(query, params);
  }

  async deleteMedicationReading(id: string): Promise<void> {
    await this.executeUpdate('DELETE FROM medication_readings WHERE id = ?', [id]);
  }

  // Database Health Check
  async checkDatabaseHealth(): Promise<{
    tablesExist: boolean;
    version: number;
    tableCount: number;
    missingTables: string[];
  }> {
    try {
      const version = await this.getCurrentVersion();
      
      // Check if all required tables exist
      const requiredTables = [
        'blood_pressure_readings',
        'weight_readings', 
        'blood_sugar_readings',
        'medication_readings',
        'users',
        'bookmarked_topics',
        'topic_views',
        'learning_progress',
        'user_achievements',
        'game_stats'
      ];
      
      const existingTables = await this.executeQuery<{name: string}>(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      
      const existingTableNames = existingTables.map(t => t.name);
      const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
      
      return {
        tablesExist: missingTables.length === 0,
        version,
        tableCount: existingTables.length,
        missingTables
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        tablesExist: false,
        version: 0,
        tableCount: 0,
        missingTables: ['all']
      };
    }
  }

  // Force Database Recreation (for debugging)
  async recreateDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
      }
      
      // Delete the database file and recreate
      this.db = await SQLite.openDatabaseAsync(this.config.name);
      
      // Force run all migrations
      await this.db.execAsync('DROP TABLE IF EXISTS database_version');
      await this.runMigrations();
      
      console.log('Database recreated successfully');
    } catch (error) {
      console.error('Failed to recreate database:', error);
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
