// Export all TypeScript types
export * from './navigation';
export * from './health';
export * from './user';
export * from './nutrition';
export * from './ads';
export * from './api';


// types/health.ts
export interface BloodSugarReading {
    id: string;
    value: number;
    type: 'fasting' | 'pre-meal' | 'post-meal';
    timestamp: Date;
    notes?: string;
  }
  
  // types/navigation.ts
  export type RootStackParamList = {
    Splash: undefined;
    OnboardingSlides: undefined;
    Consent: undefined;
    ProfileSetup: undefined;
    GoalsSetup: undefined;
    Main: undefined;
  };
  
  export type MainTabParamList = {
    Home: undefined;
    Log: undefined;
    Meal: undefined;
    Learn: undefined;
    More: undefined;
  };