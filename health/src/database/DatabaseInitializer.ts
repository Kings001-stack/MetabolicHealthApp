import DatabaseService from './DatabaseService';
import DataMigration, { MigrationResult } from './DataMigration';

export interface InitializationResult {
  success: boolean;
  databaseInitialized: boolean;
  migrationPerformed: boolean;
  migrationResult?: MigrationResult;
  error?: string;
}

class DatabaseInitializer {
  private isInitialized = false;

  async initialize(): Promise<InitializationResult> {
    if (this.isInitialized) {
      return {
        success: true,
        databaseInitialized: true,
        migrationPerformed: false,
      };
    }

    try {
      // Initialize database
      await DatabaseService.initialize();
      console.log('SQLite database initialized successfully');

      // Check if migration is needed
      const asyncStorageData = await DataMigration.hasAsyncStorageData();
      let migrationResult: MigrationResult | undefined;

      if (asyncStorageData.totalRecords > 0) {
        console.log(`Found ${asyncStorageData.totalRecords} records in AsyncStorage, starting migration...`);
        
        // Create backup before migration
        const backup = await DataMigration.createBackup();
        console.log('Backup created successfully');

        // Perform migration
        migrationResult = await DataMigration.migrateAllData();
        
        if (migrationResult.success) {
          console.log('Migration completed successfully:', migrationResult.migratedCounts);
          
          // Clear AsyncStorage data after successful migration
          await DataMigration.clearAsyncStorageData();
          console.log('AsyncStorage data cleared');
        } else {
          console.error('Migration failed:', migrationResult.errors);
        }
      }

      this.isInitialized = true;

      return {
        success: true,
        databaseInitialized: true,
        migrationPerformed: asyncStorageData.totalRecords > 0,
        migrationResult,
      };
    } catch (error) {
      console.error('Database initialization failed:', error);
      return {
        success: false,
        databaseInitialized: false,
        migrationPerformed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async reset(): Promise<void> {
    await DatabaseService.resetDatabase();
    this.isInitialized = false;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export default new DatabaseInitializer();
