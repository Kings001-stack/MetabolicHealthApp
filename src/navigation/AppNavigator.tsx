import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Onboarding Screens
import SplashScreen from "@/screens/onboarding/SplashScreen";
import OnboardingSlides from "@/screens/onboarding/OnboardingSlides";
import ConsentScreen from "@/screens/onboarding/ConsentScreen";
import ProfileSetupScreen from "@/screens/onboarding/ProfileSetupScreen";
import GoalsSetupScreen from "@/screens/onboarding/GoalsSetupScreen";

// Main App Navigation
import TabNavigator from "./TabNavigator";

// Types
import { RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      const onboardingComplete =
        await AsyncStorage.getItem("onboardingComplete");

      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem("hasLaunched", "true");
      }

      if (onboardingComplete === "true") {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSplashFinish = () => {
    setIsLoading(false);
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
        // Onboarding Flow
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
                onAccept={() => props.navigation.navigate("ProfileSetup")}
                onDecline={handleConsentDecline}
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
      ) : (
        // Main App Flow
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
