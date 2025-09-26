
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MedicationLogger from '@/components/tracking/MedicationLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';

interface MedicationReading {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  timeTaken: string;
  notes?: string;
  skipped: boolean;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

const MedicationScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentReadings, setRecentReadings] = useState<MedicationReading[]>([]);
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
      const readings = await DatabaseService.executeQuery<MedicationReading>(
        `SELECT * FROM medication_readings 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 5`,
        [userId]
      );
      setRecentReadings(readings);
    } catch (error) {
      console.error('Failed to load medication readings:', error);
    }
  };

  const handleLogMedication = async (data: {
    name: string;
    dosage: string;
    unit: string;
    frequency: string;
    notes?: string;
    skipped: boolean;
  }) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to save medication readings');
      return;
    }

    try {
      const reading: Omit<MedicationReading, 'created_at' | 'updated_at'> = {
        id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: currentUser.id,
        name: data.name,
        dosage: data.dosage,
        unit: data.unit,
        frequency: data.frequency,
        timeTaken: new Date().toISOString(),
        notes: data.notes,
        skipped: data.skipped,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO medication_readings 
         (id, user_id, name, dosage, unit, frequency, timeTaken, notes, skipped, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.name,
          reading.dosage,
          reading.unit,
          reading.frequency,
          reading.timeTaken,
          reading.notes,
          reading.skipped ? 1 : 0,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const action = data.skipped ? 'skip logged' : 'intake logged';
      Alert.alert(
        'Success',
        `${data.name} ${action} successfully!`,
        [{ text: 'OK' }]
      );

      // Reload recent readings
      await loadRecentReadings(currentUser.id);
    } catch (error) {
      console.error('Failed to save medication reading:', error);
      Alert.alert('Error', 'Failed to save medication reading');
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
          <Text style={styles.headerTitle}>Log Medication</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
          </Text>
        </View>

        <MedicationLogger onLog={handleLogMedication} />

        {recentReadings.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Activity</Text>
            {recentReadings.map((reading) => (
              <View key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingValue}>
                    {reading.name}
                  </Text>
                  <Text style={[styles.readingStatus, { color: reading.skipped ? '#FF9800' : '#4CAF50' }]}>
                    {reading.skipped ? 'Skipped' : 'Taken'}
                  </Text>
                </View>
                <Text style={styles.readingDosage}>
                  {reading.dosage} {reading.unit} - {reading.frequency}
                </Text>
                <Text style={styles.readingDate}>
                  {formatDate(reading.timestamp)}
                </Text>
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
  readingStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  readingDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  readingDate: {
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

export default MedicationScreen;
