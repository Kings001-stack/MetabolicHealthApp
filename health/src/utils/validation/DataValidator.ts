import { z } from 'zod';

// Health data validation schemas
export const BloodSugarSchema = z.object({
  value: z.number()
    .min(20, 'Blood sugar value too low')
    .max(600, 'Blood sugar value too high')
    .refine(val => !isNaN(val), 'Invalid blood sugar value'),
  mealContext: z.enum(['fasting', 'before-meal', 'after-meal', 'bedtime']).optional(),
  timestamp: z.date(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const BloodPressureSchema = z.object({
  systolic: z.number()
    .min(70, 'Systolic pressure too low')
    .max(250, 'Systolic pressure too high'),
  diastolic: z.number()
    .min(40, 'Diastolic pressure too low')
    .max(150, 'Diastolic pressure too high'),
  heartRate: z.number()
    .min(30, 'Heart rate too low')
    .max(220, 'Heart rate too high')
    .optional(),
  timestamp: z.date(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const WeightSchema = z.object({
  weight: z.number()
    .min(20, 'Weight too low')
    .max(500, 'Weight too high'),
  unit: z.enum(['kg', 'lbs']),
  bodyFat: z.number().min(0).max(100).optional(),
  muscleMass: z.number().min(0).max(200).optional(),
  timestamp: z.date(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const UserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name contains invalid characters'),
  email: z.string().email('Invalid email format').optional(),
  dateOfBirth: z.date().refine(
    date => date <= new Date() && date >= new Date('1900-01-01'),
    'Invalid date of birth'
  ).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  height: z.number().min(50).max(300).optional(),
  heightUnit: z.enum(['cm', 'ft']).optional(),
});

// Input sanitization functions
export class DataSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  static sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeNotes(notes: string): string {
    return this.sanitizeString(notes).substring(0, 500);
  }
}

// Validation helper functions
export class HealthDataValidator {
  static validateBloodSugar(data: any) {
    try {
      const sanitized = {
        ...data,
        value: DataSanitizer.sanitizeNumber(data.value),
        notes: data.notes ? DataSanitizer.sanitizeNotes(data.notes) : undefined,
        timestamp: new Date(data.timestamp),
      };
      
      return BloodSugarSchema.parse(sanitized);
    } catch (error) {
      throw new Error(`Blood sugar validation failed: ${error.message}`);
    }
  }

  static validateBloodPressure(data: any) {
    try {
      const sanitized = {
        ...data,
        systolic: DataSanitizer.sanitizeNumber(data.systolic),
        diastolic: DataSanitizer.sanitizeNumber(data.diastolic),
        heartRate: data.heartRate ? DataSanitizer.sanitizeNumber(data.heartRate) : undefined,
        notes: data.notes ? DataSanitizer.sanitizeNotes(data.notes) : undefined,
        timestamp: new Date(data.timestamp),
      };
      
      return BloodPressureSchema.parse(sanitized);
    } catch (error) {
      throw new Error(`Blood pressure validation failed: ${error.message}`);
    }
  }

  static validateWeight(data: any) {
    try {
      const sanitized = {
        ...data,
        weight: DataSanitizer.sanitizeNumber(data.weight),
        bodyFat: data.bodyFat ? DataSanitizer.sanitizeNumber(data.bodyFat) : undefined,
        muscleMass: data.muscleMass ? DataSanitizer.sanitizeNumber(data.muscleMass) : undefined,
        notes: data.notes ? DataSanitizer.sanitizeNotes(data.notes) : undefined,
        timestamp: new Date(data.timestamp),
      };
      
      return WeightSchema.parse(sanitized);
    } catch (error) {
      throw new Error(`Weight validation failed: ${error.message}`);
    }
  }

  static validateUserProfile(data: any) {
    try {
      const sanitized = {
        ...data,
        name: DataSanitizer.sanitizeString(data.name),
        email: data.email ? DataSanitizer.sanitizeEmail(data.email) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      };
      
      return UserProfileSchema.parse(sanitized);
    } catch (error) {
      throw new Error(`User profile validation failed: ${error.message}`);
    }
  }

  // Rate limiting for data entry
  static checkRateLimit(userId: string, action: string): boolean {
    const key = `${userId}_${action}`;
    const now = Date.now();
    const limit = 60000; // 1 minute
    const maxAttempts = 10;

    const attempts = this.getAttempts(key);
    const recentAttempts = attempts.filter(time => now - time < limit);

    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    this.recordAttempt(key, now);
    return true;
  }

  private static attempts: Map<string, number[]> = new Map();

  private static getAttempts(key: string): number[] {
    return this.attempts.get(key) || [];
  }

  private static recordAttempt(key: string, timestamp: number): void {
    const attempts = this.getAttempts(key);
    attempts.push(timestamp);
    
    // Keep only recent attempts
    const recent = attempts.filter(time => Date.now() - time < 60000);
    this.attempts.set(key, recent);
  }
}

export default HealthDataValidator;
