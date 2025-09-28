import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import HealthDataService from '@/services/HealthDataService';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Initializing database...');
      
      // Initialize the database service
      await HealthDataService.initializeDatabase();
      
      // Check database health
      const health = await HealthDataService.checkDatabaseHealth();
      setDbHealth(health);
      
      console.log('📊 Database Health Check:', health);
      
      if (!health.tablesExist) {
        console.warn('⚠️ Missing tables detected:', health.missingTables);
        
        // Try to recreate database if tables are missing
        if (health.missingTables.length > 0) {
          console.log('🔧 Recreating database...');
          await HealthDataService.recreateDatabase();
          
          // Check health again
          const newHealth = await HealthDataService.checkDatabaseHealth();
          setDbHealth(newHealth);
          
          if (!newHealth.tablesExist) {
            throw new Error(`Failed to create tables: ${newHealth.missingTables.join(', ')}`);
          }
        }
      }
      
      console.log('✅ Database initialized successfully');
      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown database error');
    } finally {
      setIsLoading(false);
    }
  };

  const retryInitialization = () => {
    initializeDatabase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🔄</Text>
          <Text style={styles.title}>Setting up your health data...</Text>
          <Text style={styles.subtitle}>This will only take a moment</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Database Setup Issue</Text>
          <Text style={styles.subtitle}>
            There was a problem setting up your health data storage.
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          
          {dbHealth && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>Version: {dbHealth.version}</Text>
              <Text style={styles.debugText}>Tables: {dbHealth.tableCount}</Text>
              <Text style={styles.debugText}>Missing: {dbHealth.missingTables.join(', ')}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.retryButton} onPress={retryInitialization}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>❌</Text>
          <Text style={styles.title}>Setup Failed</Text>
          <Text style={styles.subtitle}>Unable to initialize health data storage</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryInitialization}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Database is ready, render the app
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  debugInfo: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatabaseInitializer;
