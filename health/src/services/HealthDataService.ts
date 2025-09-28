import DatabaseService from '../database/DatabaseService';
import AuthenticationService from './auth/AuthenticationService';

// Type definitions for health readings
export interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  heart_rate?: number;
  timestamp: string;
  notes?: string;
}

export interface WeightReading {
  id: string;
  weight: number;
  unit: string;
  timestamp: string;
  notes?: string;
}

export interface BloodSugarReading {
  id: string;
  value: number;
  type: string; // Maps to meal_context in DB
  timestamp: string;
  notes?: string;
}

export interface MedicationReading {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  timeTaken: string;
  timestamp: string;
  notes?: string;
  skipped?: boolean;
}

class HealthDataService {
  private dbService = DatabaseService;

  private async getCurrentUserId(): Promise<string | undefined> {
    try {
      const user = await AuthenticationService.getCurrentUser();
      return user?.id;
    } catch (error) {
      console.warn('No authenticated user found, using undefined user_id');
      return undefined;
    }
  }

  // Blood Pressure Methods
  async saveBloodPressureReading(reading: BloodPressureReading): Promise<void> {
    try {
      const user_id = await this.getCurrentUserId();
      await this.dbService.saveBloodPressureReading({
        ...reading,
        user_id
      });
      console.log('Blood pressure reading saved to database');
    } catch (error) {
      console.error('Failed to save blood pressure reading:', error);
      throw error;
    }
  }

  async getBloodPressureReadings(limit: number = 50): Promise<BloodPressureReading[]> {
    try {
      const user_id = await this.getCurrentUserId();
      const readings = await this.dbService.getBloodPressureReadings(user_id, limit);
      return readings.map(r => ({
        id: r.id,
        systolic: r.systolic,
        diastolic: r.diastolic,
        heart_rate: r.heart_rate,
        timestamp: r.timestamp,
        notes: r.notes
      }));
    } catch (error) {
      console.error('Failed to load blood pressure readings:', error);
      return [];
    }
  }

  async updateBloodPressureReading(reading: BloodPressureReading): Promise<void> {
    await this.saveBloodPressureReading(reading); // INSERT OR REPLACE
  }

  async deleteBloodPressureReading(id: string): Promise<void> {
    try {
      await this.dbService.deleteBloodPressureReading(id);
      console.log('Blood pressure reading deleted from database');
    } catch (error) {
      console.error('Failed to delete blood pressure reading:', error);
      throw error;
    }
  }

  // Weight Methods
  async saveWeightReading(reading: WeightReading): Promise<void> {
    try {
      const user_id = await this.getCurrentUserId();
      await this.dbService.saveWeightReading({
        ...reading,
        user_id
      });
      console.log('Weight reading saved to database');
    } catch (error) {
      console.error('Failed to save weight reading:', error);
      throw error;
    }
  }

  async getWeightReadings(limit: number = 50): Promise<WeightReading[]> {
    try {
      const user_id = await this.getCurrentUserId();
      const readings = await this.dbService.getWeightReadings(user_id, limit);
      return readings.map(r => ({
        id: r.id,
        weight: r.weight,
        unit: r.unit,
        timestamp: r.timestamp,
        notes: r.notes
      }));
    } catch (error) {
      console.error('Failed to load weight readings:', error);
      return [];
    }
  }

  async updateWeightReading(reading: WeightReading): Promise<void> {
    await this.saveWeightReading(reading); // INSERT OR REPLACE
  }

  async deleteWeightReading(id: string): Promise<void> {
    try {
      await this.dbService.deleteWeightReading(id);
      console.log('Weight reading deleted from database');
    } catch (error) {
      console.error('Failed to delete weight reading:', error);
      throw error;
    }
  }

  // Blood Sugar Methods
  async saveBloodSugarReading(reading: BloodSugarReading): Promise<void> {
    try {
      const user_id = await this.getCurrentUserId();
      await this.dbService.saveBloodSugarReading({
        id: reading.id,
        value: reading.value,
        meal_context: reading.type, // Map type to meal_context
        timestamp: reading.timestamp,
        notes: reading.notes,
        user_id
      });
      console.log('Blood sugar reading saved to database');
    } catch (error) {
      console.error('Failed to save blood sugar reading:', error);
      throw error;
    }
  }

  async getBloodSugarReadings(limit: number = 50): Promise<BloodSugarReading[]> {
    try {
      const user_id = await this.getCurrentUserId();
      const readings = await this.dbService.getBloodSugarReadings(user_id, limit);
      return readings.map(r => ({
        id: r.id,
        value: r.value,
        type: r.meal_context, // Map meal_context back to type
        timestamp: r.timestamp,
        notes: r.notes
      }));
    } catch (error) {
      console.error('Failed to load blood sugar readings:', error);
      return [];
    }
  }

  async updateBloodSugarReading(reading: BloodSugarReading): Promise<void> {
    await this.saveBloodSugarReading(reading); // INSERT OR REPLACE
  }

  async deleteBloodSugarReading(id: string): Promise<void> {
    try {
      await this.dbService.deleteBloodSugarReading(id);
      console.log('Blood sugar reading deleted from database');
    } catch (error) {
      console.error('Failed to delete blood sugar reading:', error);
      throw error;
    }
  }

  // Medication Methods
  async saveMedicationReading(reading: MedicationReading): Promise<void> {
    try {
      const user_id = await this.getCurrentUserId();
      await this.dbService.saveMedicationReading({
        ...reading,
        user_id
      });
      console.log('Medication reading saved to database');
    } catch (error) {
      console.error('Failed to save medication reading:', error);
      throw error;
    }
  }

  async getMedicationReadings(limit: number = 50): Promise<MedicationReading[]> {
    try {
      const user_id = await this.getCurrentUserId();
      const readings = await this.dbService.getMedicationReadings(user_id, limit);
      return readings.map(r => ({
        id: r.id,
        name: r.name,
        dosage: r.dosage,
        unit: r.unit,
        frequency: r.frequency,
        timeTaken: r.timeTaken,
        timestamp: r.timestamp,
        notes: r.notes,
        skipped: r.skipped === 1
      }));
    } catch (error) {
      console.error('Failed to load medication readings:', error);
      return [];
    }
  }

  async updateMedicationReading(reading: MedicationReading): Promise<void> {
    await this.saveMedicationReading(reading); // INSERT OR REPLACE
  }

  async deleteMedicationReading(id: string): Promise<void> {
    try {
      await this.dbService.deleteMedicationReading(id);
      console.log('Medication reading deleted from database');
    } catch (error) {
      console.error('Failed to delete medication reading:', error);
      throw error;
    }
  }

  // Database Health and Initialization
  async initializeDatabase(): Promise<void> {
    try {
      await this.dbService.initialize();
      console.log('Health data service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize health data service:', error);
      throw error;
    }
  }

  async checkDatabaseHealth(): Promise<{
    tablesExist: boolean;
    version: number;
    tableCount: number;
    missingTables: string[];
  }> {
    return await this.dbService.checkDatabaseHealth();
  }

  async recreateDatabase(): Promise<void> {
    try {
      await this.dbService.recreateDatabase();
      console.log('Database recreated successfully');
    } catch (error) {
      console.error('Failed to recreate database:', error);
      throw error;
    }
  }

  // Bulk operations for data analysis
  async getAllHealthData(): Promise<{
    bloodPressure: BloodPressureReading[];
    weight: WeightReading[];
    bloodSugar: BloodSugarReading[];
    medication: MedicationReading[];
  }> {
    try {
      const [bloodPressure, weight, bloodSugar, medication] = await Promise.all([
        this.getBloodPressureReadings(1000), // Get more for analysis
        this.getWeightReadings(1000),
        this.getBloodSugarReadings(1000),
        this.getMedicationReadings(1000)
      ]);

      return {
        bloodPressure,
        weight,
        bloodSugar,
        medication
      };
    } catch (error) {
      console.error('Failed to load all health data:', error);
      throw error;
    }
  }
}

export default new HealthDataService();
