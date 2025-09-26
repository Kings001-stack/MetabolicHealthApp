import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthenticationService from "../services/auth/AuthenticationService";

// Testing mode - set to true to force onboarding flow for testing
const TESTING_ONBOARDING = false;
// Reset mode - set to true to clear AsyncStorage and start fresh (for testing)
const RESET_APP_DATA = false;

// Authentication Screens
import AuthScreen from "@/screens/auth/AuthScreen";

// Onboarding Screens
import SplashScreen from "@/screens/onboarding/SplashScreen";
import OnboardingSlides from "@/screens/onboarding/OnboardingSlides";
import ConsentScreen from "@/screens/onboarding/ConsentScreen";
import ProfileSetupScreen from "@/screens/onboarding/ProfileSetupScreen";
import GoalsSetupScreen from "@/screens/onboarding/GoalsSetupScreen";

// Main App Navigation
import TabNavigator from "./TabNavigator";
import MedicationScreen from "@/screens/medication/MedicationScreen";
import BloodSugarScreen from "@/screens/blood-sugar/BloodSugarScreen";
import WeeklyPlanScreen from "@/screens/weekly-plan/WeeklyPlanScreen";
import MealRecipesScreen from "@/screens/meal-recipes/MealRecipesScreen";
import BloodPressureScreen from "@/screens/blood-pressure/BloodPressureScreen";
import WeightScreen from "@/screens/weight/WeightScreen";
import EducationTopicScreen from "@/screens/education-topic/EducationTopicScreen";

// Types
import { RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      if (RESET_APP_DATA) {
        // Clear all AsyncStorage for fresh start
        console.log('Reset mode: Clearing all app data');
        await AsyncStorage.multiRemove([
          'hasLaunched',
          'onboardingComplete',
          'userProfile',
          'userGoals'
        ]);
        await AuthenticationService.logout();
      }

      if (TESTING_ONBOARDING) {
        // Force onboarding flow for testing
        console.log('Testing mode: Forcing onboarding flow');
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setIsFirstLaunch(true);
        setIsLoading(false);
        return;
      }

      // Check if user has completed onboarding (this determines if they see onboarding screens)
      const onboardingComplete = await AsyncStorage.getItem("onboardingComplete");
      const hasCompletedOnboarding = onboardingComplete === "true";
      
      // Check if user is authenticated
      const authenticated = await AuthenticationService.isAuthenticated();
      
      // Check if this is first launch for UI purposes
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      const isFirstLaunch = hasLaunched === null;
      
      if (isFirstLaunch) {
        await AsyncStorage.setItem("hasLaunched", "true");
      }

      // Set states based on checks
      setIsFirstLaunch(isFirstLaunch);
      setIsAuthenticated(authenticated);
      setHasCompletedOnboarding(hasCompletedOnboarding);

    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    // For new signups, they need to complete onboarding
    // For existing logins, check if they completed onboarding
    const onboardingComplete = await AsyncStorage.getItem("onboardingComplete");
    setHasCompletedOnboarding(onboardingComplete === "true");
  };

  const handleSignupSuccess = () => {
    // New user just signed up - they need to complete profile setup
    setIsAuthenticated(true);
    // Don't set onboarding as complete yet - they still need ProfileSetup and GoalsSetup
  };

  const handleLogout = async () => {
    try {
      await AuthenticationService.logout();
      // Reset authentication but keep onboarding status
      // User has already seen onboarding, so they can go directly to login
      setIsAuthenticated(false);
      // Keep hasCompletedOnboarding as true so they go to login screen
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAccountDeleted = async () => {
    try {
      // Clear all local storage
      await AsyncStorage.multiRemove([
        'onboardingComplete',
        'userProfile', 
        'userGoals',
        'hasLaunched'
      ]);
      // Reset all states to initial state
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
      setIsFirstLaunch(true);
    } catch (error) {
      console.error('Failed to clear app data after account deletion:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingComplete", "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  const handleConsentDecline = () => {
    // Handle consent decline - could exit app or show alternative flow
    console.log("User declined consent");
  };

  const handleProfileComplete = (profileData: any) => {
    // Save profile data
    AsyncStorage.setItem("userProfile", JSON.stringify(profileData));
  };

  const handleGoalsComplete = async (goalsData: any) => {
    // Save goals data and complete onboarding
    await AsyncStorage.setItem("userGoals", JSON.stringify(goalsData));
    handleOnboardingComplete();
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasCompletedOnboarding ? (
        // Onboarding Flow - Show to ALL users who haven't completed onboarding
        <>
          <Stack.Screen name="OnboardingSlides">
            {(props) => (
              <OnboardingSlides
                {...props}
                onComplete={() => props.navigation.navigate("Consent")}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Consent">
            {(props) => (
              <ConsentScreen
                {...props}
                onAccept={() => props.navigation.navigate("Auth")}
                onDecline={handleConsentDecline}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen 
                {...props} 
                onAuthSuccess={() => {
                  handleSignupSuccess();
                  props.navigation.navigate("ProfileSetup");
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ProfileSetup">
            {(props) => (
              <ProfileSetupScreen
                {...props}
                onComplete={(data) => {
                  handleProfileComplete(data);
                  props.navigation.navigate("GoalsSetup");
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="GoalsSetup">
            {(props) => (
              <GoalsSetupScreen {...props} onComplete={handleGoalsComplete} />
            )}
          </Stack.Screen>
        </>
      ) : !isAuthenticated ? (
        // User completed onboarding but not authenticated - Direct to Login
        <Stack.Screen name="Auth">
          {(props) => (
            <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />
          )}
        </Stack.Screen>
      ) : (
        // Main App Flow (for authenticated users who completed onboarding)
        <>
        <Stack.Screen name="Main">
          {(props) => (
            <TabNavigator 
              {...props} 
              onLogout={handleLogout}
              onAccountDeleted={handleAccountDeleted}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Medication" component={MedicationScreen} />
        <Stack.Screen name="BloodSugar" component={BloodSugarScreen} />
        <Stack.Screen name="WeeklyPlan" component={WeeklyPlanScreen} />
        <Stack.Screen name="MealRecipes" component={MealRecipesScreen} />
        <Stack.Screen name="BloodPressure" component={BloodPressureScreen} />
        <Stack.Screen name="Weight" component={WeightScreen} />
        <Stack.Screen name="EducationTopic" component={EducationTopicScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
