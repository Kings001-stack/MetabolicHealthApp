import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActivityEntry {
  id: string;
  type: 'exercise' | 'meal' | 'medication' | 'sleep' | 'other';
  name: string;
  duration?: number; // minutes
  calories?: number;
  timestamp: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ExerciseActivity extends ActivityEntry {
  type: 'exercise';
  exerciseType: 'cardio' | 'strength' | 'flexibility' | 'sports';
  intensity: 'low' | 'moderate' | 'high';
  heartRate?: number;
}

export interface MealActivity extends ActivityEntry {
  type: 'meal';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface MedicationActivity extends ActivityEntry {
  type: 'medication';
  medicationName: string;
  dosage: string;
  taken: boolean;
}

export interface SleepActivity extends ActivityEntry {
  type: 'sleep';
  bedtime: Date;
  wakeTime: Date;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

class ActivityService {
  private static readonly STORAGE_KEY = 'activity_entries';

  async saveActivity(activity: Omit<ActivityEntry, 'id'>): Promise<ActivityEntry> {
    try {
      const newActivity: ActivityEntry = {
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date(activity.timestamp),
      };

      const existingActivities = await this.getAllActivities();
      const updatedActivities = [...existingActivities, newActivity];
      
      await AsyncStorage.setItem(
        ActivityService.STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );

      return newActivity;
    } catch (error) {
      console.error('Error saving activity:', error);
      throw error;
    }
  }

  async getAllActivities(): Promise<ActivityEntry[]> {
    try {
      const data = await AsyncStorage.getItem(ActivityService.STORAGE_KEY);
      if (!data) return [];

      const activities = JSON.parse(data);
      return activities.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getActivitiesByType(type: ActivityEntry['type']): Promise<ActivityEntry[]> {
    try {
      const allActivities = await this.getAllActivities();
      return allActivities.filter(activity => activity.type === type);
    } catch (error) {
      console.error('Error fetching activities by type:', error);
      return [];
    }
  }

  async getActivitiesByDateRange(startDate: Date, endDate: Date): Promise<ActivityEntry[]> {
    try {
      const allActivities = await this.getAllActivities();
      return allActivities.filter(
        activity => activity.timestamp >= startDate && activity.timestamp <= endDate
      );
    } catch (error) {
      console.error('Error fetching activities by date range:', error);
      return [];
    }
  }

  async getTodaysActivities(): Promise<ActivityEntry[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      return await this.getActivitiesByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error('Error fetching today\'s activities:', error);
      return [];
    }
  }

  async deleteActivity(id: string): Promise<void> {
    try {
      const existingActivities = await this.getAllActivities();
      const updatedActivities = existingActivities.filter(activity => activity.id !== id);
      
      await AsyncStorage.setItem(
        ActivityService.STORAGE_KEY,
        JSON.stringify(updatedActivities)
      );
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  async updateActivity(id: string, updates: Partial<ActivityEntry>): Promise<ActivityEntry | null> {
    try {
      const existingActivities = await this.getAllActivities();
      const activityIndex = existingActivities.findIndex(activity => activity.id === id);
      
      if (activityIndex === -1) return null;

      const updatedActivity = {
        ...existingActivities[activityIndex],
        ...updates,
        id, // Ensure ID doesn't change
      };

      existingActivities[activityIndex] = updatedActivity;
      
      await AsyncStorage.setItem(
        ActivityService.STORAGE_KEY,
        JSON.stringify(existingActivities)
      );

      return updatedActivity;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  async getActivityStats(days: number = 7): Promise<{
    totalActivities: number;
    exerciseMinutes: number;
    caloriesBurned: number;
    mealsLogged: number;
    medicationsTaken: number;
    averageSleepHours: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activities = await this.getActivitiesByDateRange(startDate, endDate);

      const stats = {
        totalActivities: activities.length,
        exerciseMinutes: 0,
        caloriesBurned: 0,
        mealsLogged: 0,
        medicationsTaken: 0,
        averageSleepHours: 0,
      };

      let totalSleepHours = 0;
      let sleepEntries = 0;

      activities.forEach(activity => {
        if (activity.type === 'exercise') {
          stats.exerciseMinutes += activity.duration || 0;
          stats.caloriesBurned += activity.calories || 0;
        } else if (activity.type === 'meal') {
          stats.mealsLogged++;
        } else if (activity.type === 'medication') {
          const medActivity = activity as MedicationActivity;
          if (medActivity.taken) {
            stats.medicationsTaken++;
          }
        } else if (activity.type === 'sleep') {
          const sleepActivity = activity as SleepActivity;
          const sleepDuration = (sleepActivity.wakeTime.getTime() - sleepActivity.bedtime.getTime()) / (1000 * 60 * 60);
          totalSleepHours += sleepDuration;
          sleepEntries++;
        }
      });

      if (sleepEntries > 0) {
        stats.averageSleepHours = totalSleepHours / sleepEntries;
      }

      return stats;
    } catch (error) {
      console.error('Error calculating activity stats:', error);
      return {
        totalActivities: 0,
        exerciseMinutes: 0,
        caloriesBurned: 0,
        mealsLogged: 0,
        medicationsTaken: 0,
        averageSleepHours: 0,
      };
    }
  }

  async getStreakCount(activityType: ActivityEntry['type']): Promise<number> {
    try {
      const activities = await this.getActivitiesByType(activityType);
      if (activities.length === 0) return 0;

      // Sort by date (most recent first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      let streak = 0;
      const today = new Date();
      let currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      for (let i = 0; i < activities.length; i++) {
        const activityDate = new Date(
          activities[i].timestamp.getFullYear(),
          activities[i].timestamp.getMonth(),
          activities[i].timestamp.getDate()
        );

        if (activityDate.getTime() === currentDate.getTime()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (activityDate.getTime() < currentDate.getTime()) {
          // Gap in streak
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  async searchActivities(query: string): Promise<ActivityEntry[]> {
    try {
      const allActivities = await this.getAllActivities();
      const lowercaseQuery = query.toLowerCase();

      return allActivities.filter(activity =>
        activity.name.toLowerCase().includes(lowercaseQuery) ||
        (activity.notes && activity.notes.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('Error searching activities:', error);
      return [];
    }
  }
}

export default new ActivityService();
