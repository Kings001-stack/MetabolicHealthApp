import DatabaseService from '../DatabaseService';
import { BloodSugarReading } from '../../services/tracking/BloodSugarService';

export interface BloodSugarReadingDB {
  id: string;
  value: number;
  meal_context?: 'fasting' | 'before-meal' | 'after-meal' | 'bedtime';
  timestamp: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

class BloodSugarRepository {
  private tableName = 'blood_sugar_readings';

  async create(reading: Omit<BloodSugarReading, 'id'>): Promise<BloodSugarReading> {
    const id = Date.now().toString();
    const timestamp = reading.timestamp.toISOString();
    const now = new Date().toISOString();

    await DatabaseService.executeUpdate(
      `INSERT INTO ${this.tableName} 
       (id, value, meal_context, timestamp, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        reading.value,
        reading.mealContext || null,
        timestamp,
        reading.notes || null,
        now,
        now,
      ]
    );

    return {
      id,
      value: reading.value,
      mealContext: reading.mealContext,
      timestamp: reading.timestamp,
      notes: reading.notes,
    };
  }

  async findAll(): Promise<BloodSugarReading[]> {
    const results = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC`
    );

    return results.map(this.mapToBloodSugarReading);
  }

  async findById(id: string): Promise<BloodSugarReading | null> {
    const result = await DatabaseService.executeQueryFirst<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result ? this.mapToBloodSugarReading(result) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<BloodSugarReading[]> {
    const results = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return results.map(this.mapToBloodSugarReading);
  }

  async findByMealContext(mealContext: 'fasting' | 'before-meal' | 'after-meal' | 'bedtime'): Promise<BloodSugarReading[]> {
    const results = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE meal_context = ? 
       ORDER BY timestamp DESC`,
      [mealContext]
    );

    return results.map(this.mapToBloodSugarReading);
  }

  async findLatest(): Promise<BloodSugarReading | null> {
    const result = await DatabaseService.executeQueryFirst<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC LIMIT 1`
    );

    return result ? this.mapToBloodSugarReading(result) : null;
  }

  async update(id: string, updates: Partial<Omit<BloodSugarReading, 'id'>>): Promise<BloodSugarReading | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(updates.value);
    }
    if (updates.mealContext !== undefined) {
      updateFields.push('meal_context = ?');
      updateValues.push(updates.mealContext);
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

  async getAverageForPeriod(days: number): Promise<number | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await DatabaseService.executeQueryFirst<{ avg_value: number; count: number }>(
      `SELECT AVG(value) as avg_value, COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return result && result.count > 0 ? result.avg_value : null;
  }

  async getAverageByMealContext(days: number = 30): Promise<{
    fasting?: number;
    'before-meal'?: number;
    'after-meal'?: number;
    bedtime?: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await DatabaseService.executeQuery<{
      meal_context: string;
      avg_value: number;
      count: number;
    }>(
      `SELECT meal_context, AVG(value) as avg_value, COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? AND meal_context IS NOT NULL
       GROUP BY meal_context`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const averages: any = {};
    results.forEach(result => {
      if (result.count > 0) {
        averages[result.meal_context] = result.avg_value;
      }
    });

    return averages;
  }

  async getReadingsInRange(
    minValue: number, 
    maxValue: number, 
    days: number = 30
  ): Promise<BloodSugarReading[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const results = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       AND value BETWEEN ? AND ?
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString(), minValue, maxValue]
    );

    return results.map(this.mapToBloodSugarReading);
  }

  async getOutOfRangeReadings(days: number = 30): Promise<{
    low: BloodSugarReading[];
    high: BloodSugarReading[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const lowResults = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       AND value < 70
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const highResults = await DatabaseService.executeQuery<BloodSugarReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       AND ((meal_context = 'fasting' AND value > 130) OR 
            (meal_context = 'after-meal' AND value > 180) OR 
            (meal_context IS NULL AND value > 180))
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return {
      low: lowResults.map(this.mapToBloodSugarReading),
      high: highResults.map(this.mapToBloodSugarReading),
    };
  }

  async getStatistics(days: number = 30): Promise<{
    count: number;
    average: number | null;
    min: number | null;
    max: number | null;
    latest: BloodSugarReading | null;
    inTargetCount: number;
    inTargetPercentage: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await DatabaseService.executeQueryFirst<{
      count: number;
      avg_value: number;
      min_value: number;
      max_value: number;
    }>(
      `SELECT 
         COUNT(*) as count,
         AVG(value) as avg_value,
         MIN(value) as min_value,
         MAX(value) as max_value
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    // Count readings in target range
    const inTargetStats = await DatabaseService.executeQueryFirst<{ in_target_count: number }>(
      `SELECT COUNT(*) as in_target_count
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?
       AND ((meal_context = 'fasting' AND value BETWEEN 80 AND 130) OR
            (meal_context = 'after-meal' AND value < 180) OR
            (meal_context IS NULL AND value BETWEEN 80 AND 180))`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const latest = await this.findLatest();
    const totalCount = stats?.count || 0;
    const inTargetCount = inTargetStats?.in_target_count || 0;

    return {
      count: totalCount,
      average: totalCount > 0 ? stats!.avg_value : null,
      min: totalCount > 0 ? stats!.min_value : null,
      max: totalCount > 0 ? stats!.max_value : null,
      latest,
      inTargetCount,
      inTargetPercentage: totalCount > 0 ? (inTargetCount / totalCount) * 100 : 0,
    };
  }

  private mapToBloodSugarReading(dbReading: BloodSugarReadingDB): BloodSugarReading {
    return {
      id: dbReading.id,
      value: dbReading.value,
      mealContext: dbReading.meal_context,
      timestamp: new Date(dbReading.timestamp),
      notes: dbReading.notes,
    };
  }
}

export default new BloodSugarRepository();
