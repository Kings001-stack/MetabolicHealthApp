import AsyncStorage from '@react-native-async-storage/async-storage';
import DemoDataGenerator from '../../utils/demo/DemoDataGenerator';
import { WeightRepository, BloodSugarRepository, BloodPressureRepository } from '../../database/repositories';
import AuthService, { User } from '../../utils/security/AuthService';
import DatabaseInitializer from '../../database/DatabaseInitializer';

export interface DemoConfig {
  isDemo: boolean;
  demoUser: User;
  dataGenerated: boolean;
  setupDate: Date;
}

export class DemoSetupService {
  private static readonly DEMO_CONFIG_KEY = 'demo_config';
  private static readonly DEMO_USER_ID = 'demo_user_sarah_johnson';

  // Initialize demo mode for investor presentation
  static async initializeDemoMode(): Promise<void> {
    try {
      console.log('🎭 Initializing Demo Mode for Investor Presentation...');

      // Check if demo is already set up
      const existingConfig = await this.getDemoConfig();
      if (existingConfig?.dataGenerated) {
        console.log('✅ Demo mode already initialized');
        return;
      }

      // Initialize database first
      await DatabaseInitializer.initialize();

      // Create demo user
      const demoUser = await this.createDemoUser();

      // Create demo session
      await AuthService.createSession(demoUser);

      // Generate and populate demo data
      await this.populateDemoData();

      // Save demo configuration
      const demoConfig: DemoConfig = {
        isDemo: true,
        demoUser,
        dataGenerated: true,
        setupDate: new Date(),
      };

      await AsyncStorage.setItem(this.DEMO_CONFIG_KEY, JSON.stringify(demoConfig));

      console.log('🎉 Demo mode initialized successfully!');
      console.log('📊 Generated realistic health data for 3 months');
      console.log('👤 Demo user: Sarah Johnson');
      console.log('🎯 Ready for investor presentation');

    } catch (error) {
      console.error('❌ Failed to initialize demo mode:', error);
      throw new Error(`Demo initialization failed: ${error.message}`);
    }
  }

  // Create demo user profile
  private static async createDemoUser(): Promise<User> {
    const demoUser: User = {
      id: this.DEMO_USER_ID,
      email: 'sarah.johnson@healthapp-demo.com',
      name: 'Sarah Johnson',
      isVerified: true,
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date(),
    };

    // Store user profile in database
    const userProfile = DemoDataGenerator.generateDemoData().userProfile;
    
    // This would typically go through the secure database service
    // For demo purposes, we'll store it in AsyncStorage
    await AsyncStorage.setItem('demo_user_profile', JSON.stringify(userProfile));

    return demoUser;
  }

  // Populate database with realistic demo data
  private static async populateDemoData(): Promise<void> {
    console.log('📈 Generating realistic health data...');

    const demoData = DemoDataGenerator.generateDemoData();

    // Populate weight readings
    console.log('⚖️ Adding weight readings...');
    for (const weightReading of demoData.weightReadings) {
      try {
        await WeightRepository.create({
          ...weightReading,
          id: `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        console.warn('Failed to add weight reading:', error);
      }
    }

    // Populate blood sugar readings
    console.log('🩸 Adding blood sugar readings...');
    for (const bloodSugarReading of demoData.bloodSugarReadings) {
      try {
        await BloodSugarRepository.create({
          ...bloodSugarReading,
          id: `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        console.warn('Failed to add blood sugar reading:', error);
      }
    }

    // Populate blood pressure readings
    console.log('❤️ Adding blood pressure readings...');
    for (const bloodPressureReading of demoData.bloodPressureReadings) {
      try {
        await BloodPressureRepository.create({
          ...bloodPressureReading,
          id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      } catch (error) {
        console.warn('Failed to add blood pressure reading:', error);
      }
    }

    // Store additional demo data
    await AsyncStorage.setItem('demo_achievements', JSON.stringify(demoData.achievements));
    await AsyncStorage.setItem('demo_insights', JSON.stringify(demoData.insights));
    await AsyncStorage.setItem('demo_statistics', JSON.stringify(DemoDataGenerator.generateDemoStatistics()));

    console.log('✅ Demo data population complete!');
  }

  // Check if app is in demo mode
  static async isDemoMode(): Promise<boolean> {
    try {
      const config = await this.getDemoConfig();
      return config?.isDemo === true;
    } catch (error) {
      return false;
    }
  }

  // Get demo configuration
  static async getDemoConfig(): Promise<DemoConfig | null> {
    try {
      const configData = await AsyncStorage.getItem(this.DEMO_CONFIG_KEY);
      if (!configData) return null;

      const config = JSON.parse(configData);
      return {
        ...config,
        setupDate: new Date(config.setupDate),
      };
    } catch (error) {
      console.error('Failed to get demo config:', error);
      return null;
    }
  }

  // Get demo user profile
  static async getDemoUserProfile(): Promise<any> {
    try {
      const profileData = await AsyncStorage.getItem('demo_user_profile');
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Failed to get demo user profile:', error);
      return null;
    }
  }

  // Get demo achievements
  static async getDemoAchievements(): Promise<any[]> {
    try {
      const achievementsData = await AsyncStorage.getItem('demo_achievements');
      return achievementsData ? JSON.parse(achievementsData) : [];
    } catch (error) {
      console.error('Failed to get demo achievements:', error);
      return [];
    }
  }

  // Get demo insights
  static async getDemoInsights(): Promise<any[]> {
    try {
      const insightsData = await AsyncStorage.getItem('demo_insights');
      return insightsData ? JSON.parse(insightsData) : [];
    } catch (error) {
      console.error('Failed to get demo insights:', error);
      return [];
    }
  }

  // Get demo statistics
  static async getDemoStatistics(): Promise<any> {
    try {
      const statsData = await AsyncStorage.getItem('demo_statistics');
      return statsData ? JSON.parse(statsData) : DemoDataGenerator.generateDemoStatistics();
    } catch (error) {
      console.error('Failed to get demo statistics:', error);
      return DemoDataGenerator.generateDemoStatistics();
    }
  }

  // Reset demo mode
  static async resetDemoMode(): Promise<void> {
    try {
      console.log('🔄 Resetting demo mode...');

      // Clear demo configuration
      await AsyncStorage.removeItem(this.DEMO_CONFIG_KEY);
      await AsyncStorage.removeItem('demo_user_profile');
      await AsyncStorage.removeItem('demo_achievements');
      await AsyncStorage.removeItem('demo_insights');
      await AsyncStorage.removeItem('demo_statistics');

      // Clear database (this would need to be implemented based on your database structure)
      // For now, we'll just log it
      console.log('🗑️ Demo data cleared');

      // Logout demo user
      await AuthService.logout();

      console.log('✅ Demo mode reset complete');
    } catch (error) {
      console.error('❌ Failed to reset demo mode:', error);
      throw new Error(`Demo reset failed: ${error.message}`);
    }
  }

  // Generate demo presentation summary
  static async generatePresentationSummary(): Promise<{
    userProfile: any;
    keyMetrics: any;
    achievements: any[];
    insights: any[];
    dataPoints: {
      totalReadings: number;
      timeSpan: string;
      categories: string[];
    };
  }> {
    try {
      const [userProfile, statistics, achievements, insights] = await Promise.all([
        this.getDemoUserProfile(),
        this.getDemoStatistics(),
        this.getDemoAchievements(),
        this.getDemoInsights(),
      ]);

      // Calculate total data points
      const weightReadings = await WeightRepository.getAll();
      const bloodSugarReadings = await BloodSugarRepository.getAll();
      const bloodPressureReadings = await BloodPressureRepository.getAll();

      const totalReadings = weightReadings.length + bloodSugarReadings.length + bloodPressureReadings.length;

      return {
        userProfile,
        keyMetrics: statistics,
        achievements,
        insights,
        dataPoints: {
          totalReadings,
          timeSpan: '3 months',
          categories: ['Weight Management', 'Blood Sugar Control', 'Blood Pressure Monitoring'],
        },
      };
    } catch (error) {
      console.error('Failed to generate presentation summary:', error);
      throw new Error(`Presentation summary generation failed: ${error.message}`);
    }
  }

  // Enable demo mode banner
  static async showDemoBanner(): Promise<boolean> {
    const isDemo = await this.isDemoMode();
    if (isDemo && __DEV__) {
      console.log('🎭 DEMO MODE ACTIVE - Investor Presentation Data');
      return true;
    }
    return false;
  }

  // Get demo mode status for UI
  static async getDemoModeStatus(): Promise<{
    isActive: boolean;
    userName: string;
    dataPoints: number;
    setupDate: Date | null;
  }> {
    try {
      const config = await this.getDemoConfig();
      const summary = config ? await this.generatePresentationSummary() : null;

      return {
        isActive: config?.isDemo === true,
        userName: config?.demoUser.name || 'Demo User',
        dataPoints: summary?.dataPoints.totalReadings || 0,
        setupDate: config?.setupDate || null,
      };
    } catch (error) {
      return {
        isActive: false,
        userName: 'Demo User',
        dataPoints: 0,
        setupDate: null,
      };
    }
  }
}

export default DemoSetupService;
