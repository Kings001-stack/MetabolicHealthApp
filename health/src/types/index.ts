// TypeScript types for the health app


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
    Auth: undefined;
    OnboardingSlides: undefined;
    Consent: undefined;
    ProfileSetup: undefined;
    GoalsSetup: undefined;
    Main: undefined;
    Medication: undefined;
    BloodSugar: undefined;
    WeeklyPlan: undefined;
    MealRecipes: undefined;
    BloodPressure: undefined;
    Weight: undefined;
    EducationTopic: { topic: any };
  };
  
  export type MainTabParamList = {
    Home: undefined;
    Log: undefined;
    Meal: undefined;
    Learn: undefined;
    More: undefined;
  };