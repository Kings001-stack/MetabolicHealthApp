import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightRepository } from '../../database';

export interface WeightReading {
  id: string;
  weight: number; // kg
  unit: 'kg' | 'lbs';
  bodyFat?: number; // percentage
  muscleMass?: number; // kg or lbs
  timestamp: Date;
  notes?: string;
}

class WeightService {
  private static readonly STORAGE_KEY = 'weight_readings';
  private useDatabase = true; // Set to false to use AsyncStorage fallback

  async saveReading(reading: Omit<WeightReading, 'id'>): Promise<WeightReading> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.create(reading);
      }

      // Fallback to AsyncStorage
      const newReading: WeightReading = {
        ...reading,
        id: Date.now().toString(),
        timestamp: new Date(reading.timestamp),
      };

      const existingReadings = await this.getAllReadings();
      const updatedReadings = [...existingReadings, newReading];
      
      await AsyncStorage.setItem(
        WeightService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );

      return newReading;
    } catch (error) {
      console.error('Error saving weight reading:', error);
      throw error;
    }
  }

  async getAllReadings(): Promise<WeightReading[]> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.findAll();
      }

      // Fallback to AsyncStorage
      const data = await AsyncStorage.getItem(WeightService.STORAGE_KEY);
      if (!data) return [];

      const readings = JSON.parse(data);
      return readings.map((reading: any) => ({
        ...reading,
        timestamp: new Date(reading.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching weight readings:', error);
      return [];
    }
  }

  async getReadingsByDateRange(startDate: Date, endDate: Date): Promise<WeightReading[]> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.findByDateRange(startDate, endDate);
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
        await WeightRepository.delete(id);
        return;
      }

      // Fallback to AsyncStorage
      const existingReadings = await this.getAllReadings();
      const updatedReadings = existingReadings.filter(reading => reading.id !== id);
      
      await AsyncStorage.setItem(
        WeightService.STORAGE_KEY,
        JSON.stringify(updatedReadings)
      );
    } catch (error) {
      console.error('Error deleting weight reading:', error);
      throw error;
    }
  }

  async getLatestReading(): Promise<WeightReading | null> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.findLatest();
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

  async getAverageForPeriod(days: number): Promise<number | null> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.getAverageForPeriod(days);
      }

      // Fallback to AsyncStorage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const readings = await this.getReadingsByDateRange(startDate, endDate);
      if (readings.length === 0) return null;

      const sum = readings.reduce((total, reading) => total + reading.weight, 0);
      return sum / readings.length;
    } catch (error) {
      console.error('Error calculating average weight:', error);
      return null;
    }
  }

  convertWeight(weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
    if (fromUnit === toUnit) return weight;
    
    if (fromUnit === 'kg' && toUnit === 'lbs') {
      return weight * 2.20462;
    }
    
    if (fromUnit === 'lbs' && toUnit === 'kg') {
      return weight / 2.20462;
    }
    
    return weight;
  }

  calculateBMI(weightKg: number, heightM: number): number {
    return weightKg / (heightM * heightM);
  }

  getBMICategory(bmi: number): {
    category: 'underweight' | 'normal' | 'overweight' | 'obese';
    description: string;
    color: string;
  } {
    if (bmi < 18.5) {
      return {
        category: 'underweight',
        description: 'Underweight',
        color: '#2196F3',
      };
    }

    if (bmi < 25) {
      return {
        category: 'normal',
        description: 'Normal Weight',
        color: '#4CAF50',
      };
    }

    if (bmi < 30) {
      return {
        category: 'overweight',
        description: 'Overweight',
        color: '#FF9800',
      };
    }

    return {
      category: 'obese',
      description: 'Obese',
      color: '#F44336',
    };
  }

  async getWeightTrend(days: number = 30): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    changePercentage: number;
  } | null> {
    try {
      if (this.useDatabase) {
        return await WeightRepository.getWeightTrend(days);
      }

      // Fallback to AsyncStorage
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const readings = await this.getReadingsByDateRange(startDate, endDate);
      if (readings.length < 2) return null;

      // Sort by timestamp
      readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const firstWeight = readings[0].weight;
      const lastWeight = readings[readings.length - 1].weight;
      const change = lastWeight - firstWeight;
      const changePercentage = (change / firstWeight) * 100;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (Math.abs(changePercentage) < 1) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'increasing';
      } else {
        trend = 'decreasing';
      }

      return {
        trend,
        change,
        changePercentage,
      };
    } catch (error) {
      console.error('Error calculating weight trend:', error);
      return null;
    }
  }

  validateWeight(weight: number, unit: 'kg' | 'lbs'): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (unit === 'kg') {
      if (weight < 20 || weight > 300) {
        errors.push('Weight should be between 20-300 kg');
      }
    } else {
      if (weight < 44 || weight > 660) {
        errors.push('Weight should be between 44-660 lbs');
      }
    }

    if (weight <= 0) {
      errors.push('Weight must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new WeightService();
