import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import AuthScreen from '../screens/auth/AuthScreen';
import AppNavigator from '../navigation/AppNavigator';
import AuthenticationService from '../services/auth/AuthenticationService';
import DatabaseService from '../database/DatabaseService';

// Testing mode - set to true to force onboarding flow for testing
const TESTING_ONBOARDING = false;

export const MainApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');
      
      // Initialize database
      await DatabaseService.initialize();
      console.log('Database initialized');
      
      if (TESTING_ONBOARDING) {
        // Force onboarding flow for testing
        console.log('Testing mode: Forcing onboarding flow');
        setIsAuthenticated(false);
      } else {
        // Check authentication status
        const authenticated = await AuthenticationService.isAuthenticated();
        console.log('Authentication status:', authenticated);
        setIsAuthenticated(authenticated);
      }
    } catch (error: any) {
      console.error('App initialization failed:', error);
      setError(error.message || 'Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await AuthenticationService.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Initializing Health App...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>⚠️ Initialization Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    if (TESTING_ONBOARDING) {
      // Skip auth screen and go directly to onboarding
      return <AppNavigator />;
    }
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MainApp;
