
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeightLogger from '@/components/tracking/WeightLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';

interface WeightReading {
  id: string;
  user_id: string;
  value: number;
  unit: string;
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

const WeightScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentReadings, setRecentReadings] = useState<WeightReading[]>([]);
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
      const readings = await DatabaseService.executeQuery<WeightReading>(
        `SELECT * FROM weight_readings 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 5`,
        [userId]
      );
      setRecentReadings(readings);
    } catch (error) {
      console.error('Failed to load weight readings:', error);
    }
  };

  const handleLogWeight = async (data: {
    weight: number;
    unit: string;
    bodyFat?: number;
    muscleMass?: number;
    notes?: string;
  }) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to save weight readings');
      return;
    }

    try {
      const reading: Omit<WeightReading, 'created_at' | 'updated_at'> = {
        id: `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        value: data.weight,
        unit: data.unit,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO weight_readings 
         (id, user_id, value, unit, bodyFat, muscleMass, notes, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.value,
          reading.unit,
          reading.bodyFat,
          reading.muscleMass,
          reading.notes,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      Alert.alert(
        'Success',
        `Weight logged: ${data.weight} ${data.unit}`,
        [{ text: 'OK' }]
      );

      // Reload recent readings
      await loadRecentReadings(currentUser.id);
    } catch (error) {
      console.error('Failed to save weight reading:', error);
      Alert.alert('Error', 'Failed to save weight reading');
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Weight</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
          </Text>
        </View>

        <WeightLogger onLog={handleLogWeight} />

        {recentReadings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Readings</Text>
            {recentReadings.map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingValue}>
                    {reading.value} {reading.unit}
                  </Text>
                  <Text style={styles.readingDate}>
                    {formatDate(reading.timestamp)}
                  </Text>
                </View>
                {reading.bodyFat && (
                  <Text style={styles.readingDetail}>
                    Body Fat: {reading.bodyFat}%
                  </Text>
                )}
                {reading.muscleMass && (
                  <Text style={styles.readingDetail}>
                    Muscle Mass: {reading.muscleMass} {reading.unit}
                  </Text>
                )}
                {reading.notes && (
                  <Text style={styles.readingNotes}>
                    Notes: {reading.notes}
                  </Text>
                )}
              </View>
            ))}
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
  readingDate: {
    fontSize: 14,
    color: '#666666',
  },
  readingDetail: {
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

export default WeightScreen;
