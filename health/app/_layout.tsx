import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import DatabaseInitializer from "@/database/DatabaseInitializer";
import AppNavigator from "@/navigation/AppNavigator";
import ErrorHandler, { ErrorType, ErrorSeverity } from "@/utils/error/ErrorHandler";
import DemoSetupService from "@/services/demo/DemoSetupService";

// Keep the splash screen visible while we initialize the database
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Setup global error handler
        ErrorHandler.setupGlobalErrorHandler();
        
        // Check if we should initialize demo mode
        const shouldInitDemo = __DEV__ && process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
        
        if (shouldInitDemo) {
          console.log('🎭 Initializing app in DEMO MODE for investor presentation');
          await DemoSetupService.initializeDemoMode();
          setIsDemoMode(true);
        } else {
          // Initialize the database normally
          const result = await DatabaseInitializer.initialize();
          console.log('Database initialization result:', result);
          
          if (!result.success) {
            setError(result.error || 'Failed to initialize database');
            console.error('Database initialization failed:', result.error);
          }
        }

        // Check if demo mode is active
        const demoActive = await DemoSetupService.isDemoMode();
        setIsDemoMode(demoActive);
        
        if (demoActive) {
          await DemoSetupService.showDemoBanner();
        }
        
      } catch (e) {
        console.warn('Error during app initialization:', e);
        setError('An unexpected error occurred during startup');
        
        // Log the error using our error handler
        ErrorHandler.createError(
          ErrorType.UNKNOWN,
          `App initialization failed: ${(e as Error).message}`,
          ErrorSeverity.CRITICAL,
          { error: e }
        );
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666666' }}>
          {isDemoMode ? 'Setting up demo data...' : 'Initializing HealthApp...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FAFAFA' }}>
        <Text style={{ fontSize: 24, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: '#F44336', textAlign: 'center', marginBottom: 10, fontSize: 18, fontWeight: 'bold' }}>
          Initialization Error
        </Text>
        <Text style={{ color: '#666666', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
          {error}
        </Text>
        <Text style={{ color: '#999999', textAlign: 'center', fontSize: 14, lineHeight: 18 }}>
          The app may not function correctly. Please restart the app or contact support if the problem persists.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Demo Mode Banner */}
      {isDemoMode && __DEV__ && (
        <View style={{
          backgroundColor: '#FF9800',
          paddingVertical: 8,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>
            🎭 DEMO MODE - Investor Presentation Data
          </Text>
        </View>
      )}
      <AppNavigator />
    </View>
  );
}
