
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MedicationLogger from '@/components/tracking/MedicationLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import SuccessOverlay from '@/components/common/SuccessOverlay';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Surface success overlay for adding a medication from the logger
  const handleAddMedication = () => {
    setSuccessMessage('Medication added successfully!');
    setShowSuccess(true);
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

  // Handle logs coming from MedicationLogger (MedicationLog shape)
  const handleLogMedication = async (data: { medicationId: string; taken: boolean; timestamp: string; notes?: string }) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to save medication readings');
      return;
    }
    // For now, show only success overlay; MedicationLogger manages its own logs.
    const action = data.taken ? 'intake logged' : 'skip logged';
    setSuccessMessage(`Medication ${action} successfully!`);
    setShowSuccess(true);
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

        <MedicationLogger onLog={handleLogMedication} onAddMedication={handleAddMedication} />

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
      <SuccessOverlay
        visible={showSuccess}
        message={successMessage}
        onHide={() => setShowSuccess(false)}
      />
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
