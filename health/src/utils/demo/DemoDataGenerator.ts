import { WeightReading } from '../../services/tracking/WeightService';
import { BloodSugarReading } from '../../services/tracking/BloodSugarService';
import { BloodPressureReading } from '../../services/tracking/BloodPressureService';

export class DemoDataGenerator {
  // Generate realistic demo data for investor presentation
  static generateDemoData() {
    return {
      weightReadings: this.generateWeightData(),
      bloodSugarReadings: this.generateBloodSugarData(),
      bloodPressureReadings: this.generateBloodPressureData(),
      userProfile: this.generateUserProfile(),
      achievements: this.generateAchievements(),
      insights: this.generateInsights(),
    };
  }

  // Generate weight data showing improvement trend
  private static generateWeightData(): Omit<WeightReading, 'id'>[] {
    const data: Omit<WeightReading, 'id'>[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 3 months ago
    
    let currentWeight = 85.5; // Starting weight in kg
    const targetWeight = 78.0; // Target weight
    const dailyVariation = 0.3; // Daily weight variation

    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Simulate gradual weight loss with realistic fluctuations
      const progress = i / 90;
      const trendWeight = currentWeight - (currentWeight - targetWeight) * progress * 0.7;
      const variation = (Math.random() - 0.5) * dailyVariation * 2;
      const weight = Math.round((trendWeight + variation) * 10) / 10;

      // Add some body composition data occasionally
      const bodyFat = i % 7 === 0 ? Math.round((25 - progress * 3) * 10) / 10 : undefined;
      const muscleMass = bodyFat ? Math.round((35 + progress * 2) * 10) / 10 : undefined;

      data.push({
        weight,
        unit: 'kg',
        bodyFat,
        muscleMass,
        timestamp: date,
        notes: i % 14 === 0 ? this.getWeightNote(progress) : undefined,
      });
    }

    return data;
  }

  // Generate blood sugar data showing good control
  private static generateBloodSugarData(): Omit<BloodSugarReading, 'id'>[] {
    const data: Omit<BloodSugarReading, 'id'>[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // 1 month ago

    const mealContexts: ('fasting' | 'before-meal' | 'after-meal' | 'bedtime')[] = [
      'fasting', 'before-meal', 'after-meal', 'bedtime'
    ];

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Generate 2-4 readings per day
      const readingsPerDay = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < readingsPerDay; j++) {
        const readingDate = new Date(date);
        readingDate.setHours(6 + j * 6, Math.floor(Math.random() * 60));

        const mealContext = mealContexts[j % mealContexts.length];
        const baseValue = this.getBaseBloodSugarValue(mealContext);
        const variation = (Math.random() - 0.5) * 20;
        const value = Math.round(baseValue + variation);

        data.push({
          value,
          mealContext,
          timestamp: readingDate,
          notes: Math.random() < 0.2 ? this.getBloodSugarNote(value, mealContext) : undefined,
        });
      }
    }

    return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Generate blood pressure data showing improvement
  private static generateBloodPressureData(): Omit<BloodPressureReading, 'id'>[] {
    const data: Omit<BloodPressureReading, 'id'>[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60); // 2 months ago

    let baseSystolic = 140; // Starting high
    let baseDiastolic = 90;

    for (let i = 0; i < 60; i += 2) { // Every other day
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

      // Show gradual improvement
      const progress = i / 60;
      const targetSystolic = 120;
      const targetDiastolic = 80;

      const systolic = Math.round(baseSystolic - (baseSystolic - targetSystolic) * progress * 0.8 + (Math.random() - 0.5) * 10);
      const diastolic = Math.round(baseDiastolic - (baseDiastolic - targetDiastolic) * progress * 0.8 + (Math.random() - 0.5) * 8);
      const heartRate = Math.round(65 + (Math.random() - 0.5) * 20);

      data.push({
        systolic: Math.max(systolic, 110),
        diastolic: Math.max(diastolic, 70),
        heartRate,
        timestamp: date,
        notes: Math.random() < 0.15 ? this.getBloodPressureNote(systolic, diastolic) : undefined,
      });
    }

    return data;
  }

  // Generate user profile
  private static generateUserProfile() {
    return {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@demo.com',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'female' as const,
      height: 165,
      heightUnit: 'cm' as const,
      targetWeight: 78,
      targetWeightUnit: 'kg' as const,
      activityLevel: 'moderately_active' as const,
      diabetesType: 'type2',
      diagnosisDate: new Date('2020-06-01'),
      medications: ['Metformin 500mg', 'Lisinopril 10mg'],
      allergies: ['Penicillin'],
      emergencyContact: {
        name: 'John Johnson',
        relationship: 'Spouse',
        phone: '+1-555-0123',
      },
    };
  }

  // Generate achievements for gamification
  private static generateAchievements() {
    return [
      {
        id: 'weight_loss_5kg',
        title: '5kg Weight Loss Champion',
        description: 'Lost 5kg towards your goal',
        icon: '🏆',
        unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: 'weight',
      },
      {
        id: 'consistent_logging',
        title: 'Consistency Master',
        description: 'Logged health data for 30 consecutive days',
        icon: '📊',
        unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        category: 'tracking',
      },
      {
        id: 'blood_sugar_control',
        title: 'Sugar Control Expert',
        description: '80% of readings in target range this month',
        icon: '🎯',
        unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        category: 'health',
      },
      {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Completed morning routine 20 times',
        icon: '🌅',
        unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        category: 'lifestyle',
      },
    ];
  }

  // Generate AI-powered insights
  private static generateInsights() {
    return [
      {
        id: 'weight_trend',
        type: 'positive',
        title: 'Excellent Weight Progress',
        message: 'You\'ve lost 7.5kg in 3 months! Your consistent approach is paying off.',
        confidence: 0.95,
        category: 'weight',
        actionable: true,
        recommendations: [
          'Continue your current exercise routine',
          'Maintain your balanced meal planning',
          'Consider strength training to preserve muscle mass',
        ],
      },
      {
        id: 'blood_sugar_pattern',
        type: 'informational',
        title: 'Post-Meal Pattern Detected',
        message: 'Your blood sugar tends to spike higher after lunch. Consider timing your walks after this meal.',
        confidence: 0.87,
        category: 'blood_sugar',
        actionable: true,
        recommendations: [
          'Take a 15-minute walk after lunch',
          'Consider smaller lunch portions',
          'Monitor carbohydrate intake at lunch',
        ],
      },
      {
        id: 'blood_pressure_improvement',
        type: 'positive',
        title: 'Blood Pressure Trending Down',
        message: 'Your systolic pressure has improved by 18mmHg over 2 months. Great work!',
        confidence: 0.92,
        category: 'blood_pressure',
        actionable: false,
        recommendations: [
          'Keep up your current medication routine',
          'Continue stress management practices',
          'Maintain low-sodium diet',
        ],
      },
      {
        id: 'sleep_correlation',
        type: 'warning',
        title: 'Sleep May Affect Morning Readings',
        message: 'Poor sleep nights correlate with higher morning blood sugar. Prioritize 7-8 hours of sleep.',
        confidence: 0.78,
        category: 'lifestyle',
        actionable: true,
        recommendations: [
          'Establish a consistent bedtime routine',
          'Avoid screens 1 hour before bed',
          'Consider meditation or relaxation techniques',
        ],
      },
    ];
  }

  // Helper methods for generating realistic notes
  private static getWeightNote(progress: number): string {
    const notes = [
      'Feeling more energetic today',
      'Clothes fitting better',
      'Had a cheat meal yesterday',
      'Increased water intake',
      'Started new exercise routine',
      'Feeling motivated',
      'Plateau this week, staying consistent',
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  private static getBloodSugarNote(value: number, context: string): string {
    if (value > 180) {
      return 'Had a larger meal than usual';
    } else if (value < 70) {
      return 'Feeling a bit shaky, had some juice';
    } else if (context === 'fasting') {
      return 'Good fasting reading';
    } else {
      return 'Feeling good';
    }
  }

  private static getBloodPressureNote(systolic: number, diastolic: number): string {
    if (systolic > 140 || diastolic > 90) {
      return 'Stressful day at work';
    } else if (systolic < 120 && diastolic < 80) {
      return 'Relaxed after morning walk';
    } else {
      return 'Normal reading';
    }
  }

  private static getBaseBloodSugarValue(context: string): number {
    switch (context) {
      case 'fasting':
        return 95; // Good fasting glucose
      case 'before-meal':
        return 105;
      case 'after-meal':
        return 140; // 2-hour post-meal
      case 'bedtime':
        return 110;
      default:
        return 100;
    }
  }

  // Generate demo statistics for dashboard
  static generateDemoStatistics() {
    return {
      weightLoss: {
        total: 7.5,
        thisMonth: 2.1,
        trend: 'improving',
        targetProgress: 68,
      },
      bloodSugar: {
        averageThisMonth: 125,
        inRangePercentage: 78,
        trend: 'stable',
        lastReading: 118,
      },
      bloodPressure: {
        averageSystolic: 128,
        averageDiastolic: 82,
        trend: 'improving',
        lastReading: '124/80',
      },
      streaks: {
        currentLoggingStreak: 23,
        longestLoggingStreak: 45,
        medicationCompliance: 96,
      },
      goals: {
        weightGoalProgress: 68,
        exerciseGoalProgress: 85,
        nutritionGoalProgress: 72,
      },
    };
  }
}

export default DemoDataGenerator;
