import AsyncStorage from '@react-native-async-storage/async-storage';
import { BloodPressureRepository } from '../../database';

export interface BloodPressureReading {
  id: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate?: number; // bpm
  timestamp: Date;
  notes?: string;
}

class BloodPressureService {
  private static readonly STORAGE_KEY = 'blood_pressure_readings';
  private useDatabase = true; // Set to false to use AsyncStorage fallback

  async saveReading(reading: Omit<BloodPressureReading, 'id'>): Promise<BloodPressureReading> {
    try {
      if (this.useDatabase) {
        return await BloodPressureRepository.create(reading);
      }

      // Fallback to AsyncStorage
      const newReading: BloodPressureReading = {
        ...reading,
        id: Date.now().toString(),
        timestamp: new Date(reading.timestamp),
      };

      const existingReadings = await this.getAllReadings();
      const updatedReadings = [...existingReadings, newReading];
      
      await AsyncStorage.setItem(
        BloodPressureService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );

      return newReading;
    } catch (error) {
      console.error('Error saving blood pressure reading:', error);
      throw error;
    }
  }

  async getAllReadings(): Promise<BloodPressureReading[]> {
    try {
      if (this.useDatabase) {
        return await BloodPressureRepository.findAll();
      }

      // Fallback to AsyncStorage
      const data = await AsyncStorage.getItem(BloodPressureService.STORAGE_KEY);
      if (!data) return [];

      const readings = JSON.parse(data);
      return readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching blood pressure readings:', error);
      return [];
    }
  }

  async getReadingsByDateRange(startDate: Date, endDate: Date): Promise<BloodPressureReading[]> {
    try {
      if (this.useDatabase) {
        return await BloodPressureRepository.findByDateRange(startDate, endDate);
      }

      // Fallback to AsyncStorage
      const allReadings = await this.getAllReadings();
      return allReadings.filter(
        reading => reading.timestamp >= startDate && reading.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error fetching readings by date range:', error);
      return [];
    }
  }

  async deleteReading(id: string): Promise<void> {
    try {
      if (this.useDatabase) {
        await BloodPressureRepository.delete(id);
        return;
      }

      // Fallback to AsyncStorage
      const existingReadings = await this.getAllReadings();
      const updatedReadings = existingReadings.filter(reading => reading.id !== id);
      
      await AsyncStorage.setItem(
        BloodPressureService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );
    } catch (error) {
      console.error('Error deleting blood pressure reading:', error);
      throw error;
    }
  }

  async getLatestReading(): Promise<BloodPressureReading | null> {
    try {
      if (this.useDatabase) {
        return await BloodPressureRepository.findLatest();
      }

      // Fallback to AsyncStorage
      const readings = await this.getAllReadings();
      if (readings.length === 0) return null;

      return readings.reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest
      );
    } catch (error) {
      console.error('Error fetching latest reading:', error);
      return null;
    }
  }

  async getAverageForPeriod(days: number): Promise<{ systolic: number; diastolic: number } | null> {
    try {
      if (this.useDatabase) {
        return await BloodPressureRepository.getAverageForPeriod(days);
      }

      // Fallback to AsyncStorage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const readings = await this.getReadingsByDateRange(startDate, endDate);
      if (readings.length === 0) return null;

      const systolicSum = readings.reduce((total, reading) => total + reading.systolic, 0);
      const diastolicSum = readings.reduce((total, reading) => total + reading.diastolic, 0);

      return {
        systolic: systolicSum / readings.length,
        diastolic: diastolicSum / readings.length,
      };
    } catch (error) {
      console.error('Error calculating average:', error);
      return null;
    }
  }

  getBloodPressureCategory(systolic: number, diastolic: number): {
    category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
    description: string;
    color: string;
  } {
    // Based on American Heart Association guidelines
    if (systolic >= 180 || diastolic >= 120) {
      return {
        category: 'crisis',
        description: 'Hypertensive Crisis',
        color: '#D32F2F',
      };
    }

    if (systolic >= 140 || diastolic >= 90) {
      return {
        category: 'stage2',
        description: 'Stage 2 Hypertension',
        color: '#F44336',
      };
    }

    if (systolic >= 130 || diastolic >= 80) {
      return {
        category: 'stage1',
        description: 'Stage 1 Hypertension',
        color: '#FF9800',
      };
    }

    if (systolic >= 120 && diastolic < 80) {
      return {
        category: 'elevated',
        description: 'Elevated',
        color: '#FFC107',
      };
    }

    return {
      category: 'normal',
      description: 'Normal',
      color: '#4CAF50',
    };
  }

  isInTargetRange(systolic: number, diastolic: number): boolean {
    return systolic < 130 && diastolic < 80;
  }

  validateReading(systolic: number, diastolic: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (systolic < 60 || systolic > 250) {
      errors.push('Systolic pressure should be between 60-250 mmHg');
    }

    if (diastolic < 40 || diastolic > 150) {
      errors.push('Diastolic pressure should be between 40-150 mmHg');
    }

    if (systolic <= diastolic) {
      errors.push('Systolic pressure should be higher than diastolic pressure');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new BloodPressureService();
