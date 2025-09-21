import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BloodSugarReading {
  id: string;
  value: number; // mg/dL
  timestamp: Date;
  mealContext?: 'fasting' | 'before-meal' | 'after-meal' | 'bedtime';
  notes?: string;
}

class BloodSugarService {
  private static readonly STORAGE_KEY = 'blood_sugar_readings';

  async saveReading(reading: Omit<BloodSugarReading, 'id'>): Promise<BloodSugarReading> {
    try {
      const newReading: BloodSugarReading = {
        ...reading,
        id: Date.now().toString(),
        timestamp: new Date(reading.timestamp),
      };

      const existingReadings = await this.getAllReadings();
      const updatedReadings = [...existingReadings, newReading];
      
      await AsyncStorage.setItem(
        BloodSugarService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );

      return newReading;
    } catch (error) {
      console.error('Error saving blood sugar reading:', error);
      throw error;
    }
  }

  async getAllReadings(): Promise<BloodSugarReading[]> {
    try {
      const data = await AsyncStorage.getItem(BloodSugarService.STORAGE_KEY);
      if (!data) return [];

      const readings = JSON.parse(data);
      return readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching blood sugar readings:', error);
      return [];
    }
  }

  async getReadingsByDateRange(startDate: Date, endDate: Date): Promise<BloodSugarReading[]> {
    try {
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
      const existingReadings = await this.getAllReadings();
      const updatedReadings = existingReadings.filter(reading => reading.id !== id);
      
      await AsyncStorage.setItem(
        BloodSugarService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );
    } catch (error) {
      console.error('Error deleting blood sugar reading:', error);
      throw error;
    }
  }

  async getLatestReading(): Promise<BloodSugarReading | null> {
    try {
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

  async getAverageForPeriod(days: number): Promise<number | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const readings = await this.getReadingsByDateRange(startDate, endDate);
      if (readings.length === 0) return null;

      const sum = readings.reduce((total, reading) => total + reading.value, 0);
      return sum / readings.length;
    } catch (error) {
      console.error('Error calculating average:', error);
      return null;
    }
  }

  isInTargetRange(value: number, mealContext?: string): boolean {
    // Standard target ranges (mg/dL)
    switch (mealContext) {
      case 'fasting':
        return value >= 80 && value <= 130;
      case 'after-meal':
        return value < 180;
      default:
        return value >= 80 && value <= 180;
    }
  }

  getReadingCategory(value: number, mealContext?: string): 'low' | 'normal' | 'high' {
    if (mealContext === 'fasting') {
      if (value < 70) return 'low';
      if (value <= 130) return 'normal';
      return 'high';
    }

    if (value < 70) return 'low';
    if (value <= 180) return 'normal';
    return 'high';
  }
}

export default new BloodSugarService();
