
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BloodSugarLogger from '@/components/tracking/BloodSugarLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';

interface BloodSugarReading {
  id: string;
  user_id: string;
  value: number;
  type?: string;
  notes?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

const BloodSugarScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentReadings, setRecentReadings] = useState<BloodSugarReading[]>([]);
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
      const readings = await DatabaseService.executeQuery<BloodSugarReading>(
        `SELECT * FROM blood_sugar_readings 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 5`,
        [userId]
      );
      setRecentReadings(readings);
    } catch (error) {
      console.error('Failed to load blood sugar readings:', error);
    }
  };

  const handleLogBloodSugar = async (data: {
    value: number;
    type?: string;
    notes?: string;
  }) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to save blood sugar readings');
      return;
    }

    try {
      const reading: Omit<BloodSugarReading, 'created_at' | 'updated_at'> = {
        id: `bs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        value: data.value,
        type: data.type,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO blood_sugar_readings 
         (id, user_id, value, type, notes, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.value,
          reading.type,
          reading.notes,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      Alert.alert(
        'Success',
        `Blood sugar logged: ${data.value} mg/dL`,
        [{ text: 'OK' }]
      );

      // Reload recent readings
      await loadRecentReadings(currentUser.id);
    } catch (error) {
      console.error('Failed to save blood sugar reading:', error);
      Alert.alert('Error', 'Failed to save blood sugar reading');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBloodSugarCategory = (value: number) => {
    if (value < 70) return { category: 'Low', color: '#FF5722' };
    if (value <= 140) return { category: 'Normal', color: '#4CAF50' };
    if (value <= 180) return { category: 'Elevated', color: '#FF9800' };
    return { category: 'High', color: '#F44336' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Blood Sugar</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
          </Text>
        </View>

        <BloodSugarLogger onLog={handleLogBloodSugar} />

        {recentReadings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Readings</Text>
            {recentReadings.map((reading) => {
              const category = getBloodSugarCategory(reading.value);
              return (
                <View key={reading.id} style={styles.readingCard}>
                  <View style={styles.readingHeader}>
                    <Text style={styles.readingValue}>
                      {reading.value} mg/dL
                    </Text>
                    <Text style={[styles.readingCategory, { color: category.color }]}>
                      {category.category}
                    </Text>
                  </View>
                  <Text style={styles.readingDate}>
                    {formatDate(reading.timestamp)}
                  </Text>
                  {reading.type && (
                    <Text style={styles.readingType}>
                      Type: {reading.type}
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
  readingType: {
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

export default BloodSugarScreen;
