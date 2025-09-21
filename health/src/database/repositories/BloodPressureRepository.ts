import DatabaseService from '../DatabaseService';
import { BloodPressureReading } from '../../services/tracking/BloodPressureService';

export interface BloodPressureReadingDB {
  id: string;
  systolic: number;
  diastolic: number;
  heart_rate?: number;
  timestamp: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

class BloodPressureRepository {
  private tableName = 'blood_pressure_readings';

  async create(reading: Omit<BloodPressureReading, 'id'>): Promise<BloodPressureReading> {
    const id = Date.now().toString();
    const timestamp = reading.timestamp.toISOString();
    const now = new Date().toISOString();

    await DatabaseService.executeUpdate(
      `INSERT INTO ${this.tableName} 
       (id, systolic, diastolic, heart_rate, timestamp, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reading.systolic,
        reading.diastolic,
        reading.heartRate || null,
        timestamp,
        reading.notes || null,
        now,
        now,
      ]
    );

    return {
      id,
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      heartRate: reading.heartRate,
      timestamp: reading.timestamp,
      notes: reading.notes,
    };
  }

  async findAll(): Promise<BloodPressureReading[]> {
    const results = await DatabaseService.executeQuery<BloodPressureReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC`
    );

    return results.map(this.mapToBloodPressureReading);
  }

  async findById(id: string): Promise<BloodPressureReading | null> {
    const result = await DatabaseService.executeQueryFirst<BloodPressureReadingDB>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result ? this.mapToBloodPressureReading(result) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<BloodPressureReading[]> {
    const results = await DatabaseService.executeQuery<BloodPressureReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return results.map(this.mapToBloodPressureReading);
  }

  async findLatest(): Promise<BloodPressureReading | null> {
    const result = await DatabaseService.executeQueryFirst<BloodPressureReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC LIMIT 1`
    );

    return result ? this.mapToBloodPressureReading(result) : null;
  }

  async update(id: string, updates: Partial<Omit<BloodPressureReading, 'id'>>): Promise<BloodPressureReading | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.systolic !== undefined) {
      updateFields.push('systolic = ?');
      updateValues.push(updates.systolic);
    }
    if (updates.diastolic !== undefined) {
      updateFields.push('diastolic = ?');
      updateValues.push(updates.diastolic);
    }
    if (updates.heartRate !== undefined) {
      updateFields.push('heart_rate = ?');
      updateValues.push(updates.heartRate);
    }
    if (updates.timestamp !== undefined) {
      updateFields.push('timestamp = ?');
      updateValues.push(updates.timestamp.toISOString());
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(updates.notes);
    }

    if (updateFields.length === 0) return existing;

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(id);

    await DatabaseService.executeUpdate(
      `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await DatabaseService.executeUpdate(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.changes > 0;
  }

  async getAverageForPeriod(days: number): Promise<{ systolic: number; diastolic: number } | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await DatabaseService.executeQueryFirst<{
      avg_systolic: number;
      avg_diastolic: number;
      count: number;
    }>(
      `SELECT 
         AVG(systolic) as avg_systolic, 
         AVG(diastolic) as avg_diastolic,
         COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return result && result.count > 0 
      ? { systolic: result.avg_systolic, diastolic: result.avg_diastolic }
      : null;
  }

  async getReadingsByCategory(days: number = 30): Promise<{
    normal: BloodPressureReading[];
    elevated: BloodPressureReading[];
    stage1: BloodPressureReading[];
    stage2: BloodPressureReading[];
    crisis: BloodPressureReading[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const allReadings = await this.findByDateRange(startDate, endDate);

    const categories = {
      normal: [] as BloodPressureReading[],
      elevated: [] as BloodPressureReading[],
      stage1: [] as BloodPressureReading[],
      stage2: [] as BloodPressureReading[],
      crisis: [] as BloodPressureReading[],
    };

    allReadings.forEach(reading => {
      const { systolic, diastolic } = reading;
      
      if (systolic >= 180 || diastolic >= 120) {
        categories.crisis.push(reading);
      } else if (systolic >= 140 || diastolic >= 90) {
        categories.stage2.push(reading);
      } else if (systolic >= 130 || diastolic >= 80) {
        categories.stage1.push(reading);
      } else if (systolic >= 120 && diastolic < 80) {
        categories.elevated.push(reading);
      } else {
        categories.normal.push(reading);
      }
    });

    return categories;
  }

  async getHighReadings(days: number = 30): Promise<BloodPressureReading[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await DatabaseService.executeQuery<BloodPressureReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       AND (systolic >= 130 OR diastolic >= 80)
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return results.map(this.mapToBloodPressureReading);
  }

  async getTrend(days: number = 30): Promise<{
    systolicTrend: 'increasing' | 'decreasing' | 'stable';
    diastolicTrend: 'increasing' | 'decreasing' | 'stable';
    systolicChange: number;
    diastolicChange: number;
  } | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.findByDateRange(startDate, endDate);
    if (readings.length < 2) return null;

    // Sort by timestamp (oldest first for trend calculation)
    readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const firstReading = readings[0];
    const lastReading = readings[readings.length - 1];

    const systolicChange = lastReading.systolic - firstReading.systolic;
    const diastolicChange = lastReading.diastolic - firstReading.diastolic;

    const getSystolicTrend = (change: number): 'increasing' | 'decreasing' | 'stable' => {
      if (Math.abs(change) < 3) return 'stable';
      return change > 0 ? 'increasing' : 'decreasing';
    };

    const getDiastolicTrend = (change: number): 'increasing' | 'decreasing' | 'stable' => {
      if (Math.abs(change) < 2) return 'stable';
      return change > 0 ? 'increasing' : 'decreasing';
    };

    return {
      systolicTrend: getSystolicTrend(systolicChange),
      diastolicTrend: getDiastolicTrend(diastolicChange),
      systolicChange,
      diastolicChange,
    };
  }

  async getStatistics(days: number = 30): Promise<{
    count: number;
    averageSystolic: number | null;
    averageDiastolic: number | null;
    minSystolic: number | null;
    maxSystolic: number | null;
    minDiastolic: number | null;
    maxDiastolic: number | null;
    latest: BloodPressureReading | null;
    inTargetCount: number;
    inTargetPercentage: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await DatabaseService.executeQueryFirst<{
      count: number;
      avg_systolic: number;
      avg_diastolic: number;
      min_systolic: number;
      max_systolic: number;
      min_diastolic: number;
      max_diastolic: number;
    }>(
      `SELECT 
         COUNT(*) as count,
         AVG(systolic) as avg_systolic,
         AVG(diastolic) as avg_diastolic,
         MIN(systolic) as min_systolic,
         MAX(systolic) as max_systolic,
         MIN(diastolic) as min_diastolic,
         MAX(diastolic) as max_diastolic
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    // Count readings in target range (< 130/80)
    const inTargetStats = await DatabaseService.executeQueryFirst<{ in_target_count: number }>(
      `SELECT COUNT(*) as in_target_count
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?
       AND systolic < 130 AND diastolic < 80`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const latest = await this.findLatest();
    const totalCount = stats?.count || 0;
    const inTargetCount = inTargetStats?.in_target_count || 0;

    return {
      count: totalCount,
      averageSystolic: totalCount > 0 ? stats!.avg_systolic : null,
      averageDiastolic: totalCount > 0 ? stats!.avg_diastolic : null,
      minSystolic: totalCount > 0 ? stats!.min_systolic : null,
      maxSystolic: totalCount > 0 ? stats!.max_systolic : null,
      minDiastolic: totalCount > 0 ? stats!.min_diastolic : null,
      maxDiastolic: totalCount > 0 ? stats!.max_diastolic : null,
      latest,
      inTargetCount,
      inTargetPercentage: totalCount > 0 ? (inTargetCount / totalCount) * 100 : 0,
    };
  }

  private mapToBloodPressureReading(dbReading: BloodPressureReadingDB): BloodPressureReading {
    return {
      id: dbReading.id,
      systolic: dbReading.systolic,
      diastolic: dbReading.diastolic,
      heartRate: dbReading.heart_rate || undefined,
      timestamp: new Date(dbReading.timestamp),
      notes: dbReading.notes || undefined,
    };
  }
}

export default new BloodPressureRepository();
