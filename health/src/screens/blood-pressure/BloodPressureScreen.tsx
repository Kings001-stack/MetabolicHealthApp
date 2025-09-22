
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BloodPressureLogger from '@/components/tracking/BloodPressureLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';

interface BloodPressureReading {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

const BloodPressureScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentReadings, setRecentReadings] = useState<BloodPressureReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserAndReadings();
  }, []);

  const loadUserAndReadings = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        await loadRecentReadings(user.id);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentReadings = async (userId: string) => {
    try {
      const readings = await DatabaseService.executeQuery<BloodPressureReading>(
        `SELECT * FROM blood_pressure_readings 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 5`,
        [userId]
      );
      setRecentReadings(readings);
    } catch (error) {
      console.error('Failed to load blood pressure readings:', error);
    }
  };

  const handleLogBloodPressure = async (data: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    notes?: string;
  }) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to save blood pressure readings');
      return;
    }

    try {
      const reading: Omit<BloodPressureReading, 'created_at' | 'updated_at'> = {
        id: `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        systolic: data.systolic,
        diastolic: data.diastolic,
        pulse: data.pulse,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO blood_pressure_readings 
         (id, user_id, systolic, diastolic, pulse, notes, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.systolic,
          reading.diastolic,
          reading.pulse,
          reading.notes,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      Alert.alert(
        'Success',
        `Blood pressure logged: ${data.systolic}/${data.diastolic} mmHg`,
        [{ text: 'OK' }]
      );

      // Reload recent readings
      await loadRecentReadings(currentUser.id);
    } catch (error) {
      console.error('Failed to save blood pressure reading:', error);
      Alert.alert('Error', 'Failed to save blood pressure reading');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: 'Normal', color: '#4CAF50' };
    if (systolic < 130 && diastolic < 80) return { category: 'Elevated', color: '#FF9800' };
    if (systolic < 140 || diastolic < 90) return { category: 'Stage 1 High', color: '#FF5722' };
    if (systolic < 180 || diastolic < 120) return { category: 'Stage 2 High', color: '#F44336' };
    return { category: 'Crisis', color: '#9C27B0' };
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Blood Pressure</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
          </Text>
        </View>

        <BloodPressureLogger onLog={handleLogBloodPressure} />

        {recentReadings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Readings</Text>
            {recentReadings.map((reading) => {
              const category = getBloodPressureCategory(reading.systolic, reading.diastolic);
              return (
                <View key={reading.id} style={styles.readingCard}>
                  <View style={styles.readingHeader}>
                    <Text style={styles.readingValue}>
                      {reading.systolic}/{reading.diastolic} mmHg
                    </Text>
                    <Text style={[styles.readingCategory, { color: category.color }]}>
                      {category.category}
                    </Text>
                  </View>
                  <Text style={styles.readingDate}>
                    {formatDate(reading.timestamp)}
                  </Text>
                  {reading.pulse && (
                    <Text style={styles.readingPulse}>
                      Pulse: {reading.pulse} bpm
                    </Text>
                  )}
                  {reading.notes && (
                    <Text style={styles.readingNotes}>
                      Notes: {reading.notes}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  recentSection: {
    padding: 20,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  readingCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  readingDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  readingPulse: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  readingNotes: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default BloodPressureScreen;
