import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BloodSugarLogger from '@/components/tracking/BloodSugarLogger';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import SuccessOverlay from '@/components/common/SuccessOverlay';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

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
        `SELECT id, user_id, value, meal_context as type, notes, timestamp, created_at, updated_at
         FROM blood_sugar_readings 
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
         (id, user_id, value, meal_context, notes, timestamp, created_at, updated_at) 
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

      setSuccessMessage(`Blood sugar logged: ${data.value} mg/dL`);
      setShowSuccess(true);

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

  const renderReading = ({ item }: { item: BloodSugarReading }) => {
    const category = getBloodSugarCategory(item.value);
    return (
      <View style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <Text style={styles.readingValue}>{item.value} mg/dL</Text>
          <Text style={[styles.readingCategory, { color: category.color }]}>
            {category.category}
          </Text>
        </View>
        <Text style={styles.readingDate}>{formatDate(item.timestamp)}</Text>
        {item.type && <Text style={styles.readingType}>Type: {item.type}</Text>}
        {item.notes && <Text style={styles.readingNotes}>Notes: {item.notes}</Text>}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await DatabaseService.executeUpdate(
        'DELETE FROM blood_sugar_readings WHERE id = ?',
        [id]
      );
      setSuccessMessage('Reading deleted');
      setShowSuccess(true);
      await loadRecentReadings(currentUser!.id);
    } catch (error) {
      console.error('Failed to delete blood sugar reading:', error);
      Alert.alert('Error', 'Failed to delete blood sugar reading');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentReadings}
        keyExtractor={(item) => item.id}
        renderItem={renderReading}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Log Blood Sugar</Text>
              <Text style={styles.headerSubtitle}>
                {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
              </Text>
            </View>
            <BloodSugarLogger onLog={handleLogBloodSugar} showHistory={false} />
            {recentReadings.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Recent Readings</Text>
              </View>
            )}
          </>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#C62828',
    fontWeight: '600'
  } // Removed trailing comma
});

export default BloodSugarScreen;