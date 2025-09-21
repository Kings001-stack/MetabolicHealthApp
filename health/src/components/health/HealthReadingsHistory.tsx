import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthenticationService from '../../services/auth/AuthenticationService';
import DatabaseService from '../../database/DatabaseService';

interface HealthReading {
  id: string;
  type: 'weight' | 'blood_sugar' | 'blood_pressure';
  value: string;
  timestamp: string;
  notes?: string;
}

interface HealthReadingsHistoryProps {
  readingType?: 'all' | 'weight' | 'blood_sugar' | 'blood_pressure';
}

export const HealthReadingsHistory: React.FC<HealthReadingsHistoryProps> = ({
  readingType = 'all',
}) => {
  const [readings, setReadings] = useState<HealthReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReadings();
    }
  }, [currentUser, readingType]);

  const loadCurrentUser = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
      Alert.alert('Error', 'Please log in to view your health data');
    }
  };

  const loadReadings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const allReadings: HealthReading[] = [];

      // Load weight readings
      if (readingType === 'all' || readingType === 'weight') {
        const weightReadings = await DatabaseService.executeQuery<any>(
          'SELECT * FROM weight_readings WHERE user_id = ? ORDER BY timestamp DESC',
          [currentUser.id]
        );

        weightReadings.forEach(reading => {
          allReadings.push({
            id: reading.id,
            type: 'weight',
            value: `${reading.weight} ${reading.unit}${reading.body_fat ? ` (${reading.body_fat}% fat)` : ''}`,
            timestamp: reading.timestamp,
            notes: reading.notes,
          });
        });
      }

      // Load blood sugar readings
      if (readingType === 'all' || readingType === 'blood_sugar') {
        const bloodSugarReadings = await DatabaseService.executeQuery<any>(
          'SELECT * FROM blood_sugar_readings WHERE user_id = ? ORDER BY timestamp DESC',
          [currentUser.id]
        );

        bloodSugarReadings.forEach(reading => {
          allReadings.push({
            id: reading.id,
            type: 'blood_sugar',
            value: `${reading.value} mg/dL${reading.meal_context ? ` (${reading.meal_context})` : ''}`,
            timestamp: reading.timestamp,
            notes: reading.notes,
          });
        });
      }

      // Load blood pressure readings
      if (readingType === 'all' || readingType === 'blood_pressure') {
        const bloodPressureReadings = await DatabaseService.executeQuery<any>(
          'SELECT * FROM blood_pressure_readings WHERE user_id = ? ORDER BY timestamp DESC',
          [currentUser.id]
        );

        bloodPressureReadings.forEach(reading => {
          allReadings.push({
            id: reading.id,
            type: 'blood_pressure',
            value: `${reading.systolic}/${reading.diastolic} mmHg${reading.heart_rate ? ` (HR: ${reading.heart_rate})` : ''}`,
            timestamp: reading.timestamp,
            notes: reading.notes,
          });
        });
      }

      // Sort all readings by timestamp
      allReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setReadings(allReadings);
    } catch (error) {
      console.error('Failed to load readings:', error);
      Alert.alert('Error', 'Failed to load your health readings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReadings();
    setRefreshing(false);
  };

  const getReadingIcon = (type: string) => {
    switch (type) {
      case 'weight':
        return 'scale-outline';
      case 'blood_sugar':
        return 'water-outline';
      case 'blood_pressure':
        return 'heart-outline';
      default:
        return 'medical-outline';
    }
  };

  const getReadingColor = (type: string) => {
    switch (type) {
      case 'weight':
        return '#4CAF50';
      case 'blood_sugar':
        return '#2196F3';
      case 'blood_pressure':
        return '#FF5722';
      default:
        return '#666';
    }
  };

  const getReadingTypeLabel = (type: string) => {
    switch (type) {
      case 'weight':
        return 'Weight';
      case 'blood_sugar':
        return 'Blood Sugar';
      case 'blood_pressure':
        return 'Blood Pressure';
      default:
        return 'Health Reading';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderReadingItem = ({ item }: { item: HealthReading }) => (
    <View style={styles.readingItem}>
      <View style={styles.readingHeader}>
        <View style={styles.readingIconContainer}>
          <Ionicons
            name={getReadingIcon(item.type) as any}
            size={24}
            color={getReadingColor(item.type)}
          />
        </View>
        <View style={styles.readingInfo}>
          <Text style={styles.readingType}>{getReadingTypeLabel(item.type)}</Text>
          <Text style={styles.readingValue}>{item.value}</Text>
          {item.notes && <Text style={styles.readingNotes}>{item.notes}</Text>}
        </View>
        <Text style={styles.readingTime}>{formatDate(item.timestamp)}</Text>
      </View>
    </View>
  );

  if (!currentUser) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="person-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Please log in to view your health readings</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your health readings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Readings History</Text>
        <Text style={styles.subtitle}>
          {readings.length} reading{readings.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      {readings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No health readings recorded yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking your health by adding weight, blood sugar, or blood pressure readings
          </Text>
        </View>
      ) : (
        <FlatList
          data={readings}
          renderItem={renderReadingItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  readingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  readingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  readingInfo: {
    flex: 1,
  },
  readingType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  readingNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  readingTime: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HealthReadingsHistory;
