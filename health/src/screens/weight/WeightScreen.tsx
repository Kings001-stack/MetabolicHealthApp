
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeightLogger from '@/components/tracking/WeightLogger';
import WeightChart from '@/components/charts/WeightChart';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import SuccessOverlay from '@/components/common/SuccessOverlay';

interface WeightReading {
  id: string;
  user_id: string;
  weight: number;
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
        weight: data.weight,
        unit: data.unit,
        bodyFat: data.bodyFat,
        muscleMass: data.muscleMass,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO weight_readings 
         (id, user_id, weight, unit, body_fat, muscle_mass, notes, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.weight,
          reading.unit,
          reading.bodyFat,
          reading.muscleMass,
          reading.notes,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      setSuccessMessage(`Weight logged: ${data.weight} ${data.unit}`);
      setShowSuccess(true);

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

  const getWeightTrend = () => {
    if (recentReadings.length < 2) return null;
    const recent = recentReadings.slice(0, 2);
    const current = recent[0].weight;
    const previous = recent[1].weight;
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return { trend: 'stable', icon: '➡️', color: '#666666' };
    if (diff > 0) return { trend: 'increasing', icon: '📈', color: '#FF5722' };
    return { trend: 'decreasing', icon: '📉', color: '#4CAF50' };
  };

  const getWeightStatus = (weight: number) => {
    // Simple BMI-based status (assuming average height of 170cm)
    const heightInM = 1.7;
    const bmi = weight / (heightInM * heightInM);
    if (bmi < 18.5) return { status: 'Underweight', color: '#2196F3' };
    if (bmi < 25) return { status: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { status: 'Overweight', color: '#FF9800' };
    return { status: 'Obese', color: '#F44336' };
  };

  // Transform data for chart component
  const chartData = recentReadings.map(reading => ({
    id: reading.id,
    weight: reading.weight,
    unit: reading.unit as 'kg' | 'lbs',
    bodyFat: reading.bodyFat,
    muscleMass: reading.muscleMass,
    timestamp: new Date(reading.timestamp)
  }));

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Weight</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
        </Text>
      </View>

      <WeightLogger onLog={handleLogWeight} />

      {recentReadings.length > 0 && (
        <>
          <WeightChart 
            data={chartData} 
            period="7d" 
            targetWeight={undefined} // Could be set from user profile
          />
          
          <View style={styles.trendSection}>
            <Text style={styles.trendTitle}>Recent Trend</Text>
            {(() => {
              const trend = getWeightTrend();
              return trend ? (
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendIcon, { color: trend.color }]}>{trend.icon}</Text>
                  <Text style={[styles.trendText, { color: trend.color }]}>Weight is {trend.trend}</Text>
                </View>
              ) : (
                <Text style={styles.trendText}>Not enough data for trend analysis</Text>
              );
            })()} 
          </View>

          <View style={styles.recentSectionHeader}>
            <Text style={styles.recentTitle}>Recent Readings</Text>
          </View>
        </>
      )}
    </>
  );

  const renderReading = ({ item }: { item: WeightReading }) => (
    <View style={styles.readingCard}>
      <View style={styles.readingHeader}>
        <Text style={styles.readingValue}>
          {item.weight} {item.unit}
        </Text>
        <View style={[styles.readingStatus, { backgroundColor: getWeightStatus(item.weight).color }]}>
          <Text style={styles.readingStatusText}>{getWeightStatus(item.weight).status}</Text>
        </View>
      </View>
      <Text style={styles.readingDate}>
        {formatDate(item.timestamp)}
      </Text>
      {item.bodyFat && (
        <Text style={styles.readingDetail}>
          Body Fat: {item.bodyFat}%
        </Text>
      )}
      {item.muscleMass && (
        <Text style={styles.readingDetail}>
          Muscle Mass: {item.muscleMass} {item.unit}
        </Text>
      )}
      {item.notes && (
        <Text style={styles.readingNotes}>
          Notes: {item.notes}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentReadings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    paddingBottom: 20,
  },
  recentSectionHeader: {
    padding: 20,
    paddingBottom: 0,
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
  readingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readingStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trendSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
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
