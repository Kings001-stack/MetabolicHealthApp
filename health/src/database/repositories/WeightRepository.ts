import DatabaseService from '../DatabaseService';
import { WeightReading } from '../../services/tracking/WeightService';

export interface WeightReadingDB {
  id: string;
  user_id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  body_fat?: number;
  muscle_mass?: number;
  timestamp: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

class WeightRepository {
  private tableName = 'weight_readings';

  async create(reading: Omit<WeightReading, 'id'>, userId: string): Promise<WeightReading> {
    const id = Date.now().toString();
    const timestamp = reading.timestamp.toISOString();
    const now = new Date().toISOString();

    await DatabaseService.executeUpdate(
      `INSERT INTO ${this.tableName} 
       (id, user_id, weight, unit, body_fat, muscle_mass, timestamp, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        reading.weight,
        reading.unit,
        reading.bodyFat || null,
        reading.muscleMass || null,
        timestamp,
        reading.notes || null,
        now,
        now,
      ]
    );

    return {
      id,
      weight: reading.weight,
      unit: reading.unit,
      bodyFat: reading.bodyFat,
      muscleMass: reading.muscleMass,
      timestamp: reading.timestamp,
      notes: reading.notes,
    };
  }

  async findAll(): Promise<WeightReading[]> {
    const results = await DatabaseService.executeQuery<WeightReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC`
    );

    return results.map(this.mapToWeightReading);
  }

  async findById(id: string): Promise<WeightReading | null> {
    const result = await DatabaseService.executeQueryFirst<WeightReadingDB>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result ? this.mapToWeightReading(result) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WeightReading[]> {
    const results = await DatabaseService.executeQuery<WeightReadingDB>(
      `SELECT * FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ? 
       ORDER BY timestamp DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return results.map(this.mapToWeightReading);
  }

  async findLatest(): Promise<WeightReading | null> {
    const result = await DatabaseService.executeQueryFirst<WeightReadingDB>(
      `SELECT * FROM ${this.tableName} ORDER BY timestamp DESC LIMIT 1`
    );

    return result ? this.mapToWeightReading(result) : null;
  }

  async update(id: string, updates: Partial<Omit<WeightReading, 'id'>>): Promise<WeightReading | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.weight !== undefined) {
      updateFields.push('weight = ?');
      updateValues.push(updates.weight);
    }
    if (updates.unit !== undefined) {
      updateFields.push('unit = ?');
      updateValues.push(updates.unit);
    }
    if (updates.bodyFat !== undefined) {
      updateFields.push('body_fat = ?');
      updateValues.push(updates.bodyFat);
    }
    if (updates.muscleMass !== undefined) {
      updateFields.push('muscle_mass = ?');
      updateValues.push(updates.muscleMass);
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

    const result = await DatabaseService.executeQueryFirst<{ avg_weight: number; count: number }>(
      `SELECT AVG(weight) as avg_weight, COUNT(*) as count 
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    return result && result.count > 0 ? result.avg_weight : null;
  }

  async getWeightTrend(days: number = 30): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    changePercentage: number;
  } | null> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.findByDateRange(startDate, endDate);
    if (readings.length < 2) return null;

    // Sort by timestamp (oldest first for trend calculation)
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
  }

  async getStatistics(days: number = 30): Promise<{
    count: number;
    average: number | null;
    min: number | null;
    max: number | null;
    latest: WeightReading | null;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await DatabaseService.executeQueryFirst<{
      count: number;
      avg_weight: number;
      min_weight: number;
      max_weight: number;
    }>(
      `SELECT 
         COUNT(*) as count,
         AVG(weight) as avg_weight,
         MIN(weight) as min_weight,
         MAX(weight) as max_weight
       FROM ${this.tableName} 
       WHERE timestamp BETWEEN ? AND ?`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const latest = await this.findLatest();

    const count = stats?.count ?? 0;
    const average = stats && count > 0 ? stats.avg_weight : null;
    const min = stats && count > 0 ? stats.min_weight : null;
    const max = stats && count > 0 ? stats.max_weight : null;

    return {
      count,
      average,
      min,
      max,
      latest,
    };
  }

  private mapToWeightReading(dbReading: WeightReadingDB): WeightReading {
    return {
      id: dbReading.id,
      weight: dbReading.weight,
      unit: dbReading.unit,
      bodyFat: dbReading.body_fat || undefined,
      muscleMass: dbReading.muscle_mass || undefined,
      timestamp: new Date(dbReading.timestamp),
      notes: dbReading.notes || undefined,
    };
  }
}

export default new WeightRepository();
