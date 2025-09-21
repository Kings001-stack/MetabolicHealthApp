import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightRepository, BloodSugarRepository, BloodPressureRepository } from './repositories';
import { WeightReading } from '../services/tracking/WeightService';
import { BloodSugarReading } from '../services/tracking/BloodSugarService';
import { BloodPressureReading } from '../services/tracking/BloodPressureService';

export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    weight: number;
    bloodSugar: number;
    bloodPressure: number;
  };
  errors: string[];
}

class DataMigration {
  private readonly STORAGE_KEYS = {
    weight: 'weight_readings',
    bloodSugar: 'blood_sugar_readings',
    bloodPressure: 'blood_pressure_readings',
  };

  async migrateAllData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCounts: {
        weight: 0,
        bloodSugar: 0,
        bloodPressure: 0,
      },
      errors: [],
    };

    try {
      // Migrate weight data
      const weightCount = await this.migrateWeightData();
      result.migratedCounts.weight = weightCount;
    } catch (error) {
      result.success = false;
      result.errors.push(`Weight migration failed: ${error}`);
    }

    try {
      // Migrate blood sugar data
      const bloodSugarCount = await this.migrateBloodSugarData();
      result.migratedCounts.bloodSugar = bloodSugarCount;
    } catch (error) {
      result.success = false;
      result.errors.push(`Blood sugar migration failed: ${error}`);
    }

    try {
      // Migrate blood pressure data
      const bloodPressureCount = await this.migrateBloodPressureData();
      result.migratedCounts.bloodPressure = bloodPressureCount;
    } catch (error) {
      result.success = false;
      result.errors.push(`Blood pressure migration failed: ${error}`);
    }

    return result;
  }

  private async migrateWeightData(): Promise<number> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEYS.weight);
    if (!data) return 0;

    const readings: any[] = JSON.parse(data);
    let migratedCount = 0;

    for (const reading of readings) {
      try {
        const weightReading: Omit<WeightReading, 'id'> = {
          weight: reading.weight,
          unit: reading.unit || 'kg',
          bodyFat: reading.bodyFat,
          muscleMass: reading.muscleMass,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        };

        await WeightRepository.create(weightReading);
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate weight reading ${reading.id}:`, error);
      }
    }

    return migratedCount;
  }

  private async migrateBloodSugarData(): Promise<number> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodSugar);
    if (!data) return 0;

    const readings: any[] = JSON.parse(data);
    let migratedCount = 0;

    for (const reading of readings) {
      try {
        const bloodSugarReading: Omit<BloodSugarReading, 'id'> = {
          value: reading.value,
          mealContext: reading.mealContext,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        };

        await BloodSugarRepository.create(bloodSugarReading);
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate blood sugar reading ${reading.id}:`, error);
      }
    }

    return migratedCount;
  }

  private async migrateBloodPressureData(): Promise<number> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodPressure);
    if (!data) return 0;

    const readings: any[] = JSON.parse(data);
    let migratedCount = 0;

    for (const reading of readings) {
      try {
        const bloodPressureReading: Omit<BloodPressureReading, 'id'> = {
          systolic: reading.systolic,
          diastolic: reading.diastolic,
          heartRate: reading.heartRate,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        };

        await BloodPressureRepository.create(bloodPressureReading);
        migratedCount++;
      } catch (error) {
        console.warn(`Failed to migrate blood pressure reading ${reading.id}:`, error);
      }
    }

    return migratedCount;
  }

  async hasAsyncStorageData(): Promise<{
    hasWeight: boolean;
    hasBloodSugar: boolean;
    hasBloodPressure: boolean;
    totalRecords: number;
  }> {
    const weightData = await AsyncStorage.getItem(this.STORAGE_KEYS.weight);
    const bloodSugarData = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodSugar);
    const bloodPressureData = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodPressure);

    const weightCount = weightData ? JSON.parse(weightData).length : 0;
    const bloodSugarCount = bloodSugarData ? JSON.parse(bloodSugarData).length : 0;
    const bloodPressureCount = bloodPressureData ? JSON.parse(bloodPressureData).length : 0;

    return {
      hasWeight: weightCount > 0,
      hasBloodSugar: bloodSugarCount > 0,
      hasBloodPressure: bloodPressureCount > 0,
      totalRecords: weightCount + bloodSugarCount + bloodPressureCount,
    };
  }

  async clearAsyncStorageData(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(this.STORAGE_KEYS.weight),
      AsyncStorage.removeItem(this.STORAGE_KEYS.bloodSugar),
      AsyncStorage.removeItem(this.STORAGE_KEYS.bloodPressure),
    ]);
  }

  async createBackup(): Promise<{
    weight: WeightReading[];
    bloodSugar: BloodSugarReading[];
    bloodPressure: BloodPressureReading[];
  }> {
    const backup = {
      weight: [] as WeightReading[],
      bloodSugar: [] as BloodSugarReading[],
      bloodPressure: [] as BloodPressureReading[],
    };

    // Get data from AsyncStorage
    const weightData = await AsyncStorage.getItem(this.STORAGE_KEYS.weight);
    if (weightData) {
      const readings = JSON.parse(weightData);
      backup.weight = readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    }

    const bloodSugarData = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodSugar);
    if (bloodSugarData) {
      const readings = JSON.parse(bloodSugarData);
      backup.bloodSugar = readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    }

    const bloodPressureData = await AsyncStorage.getItem(this.STORAGE_KEYS.bloodPressure);
    if (bloodPressureData) {
      const readings = JSON.parse(bloodPressureData);
      backup.bloodPressure = readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    }

    return backup;
  }
}

export default new DataMigration();
