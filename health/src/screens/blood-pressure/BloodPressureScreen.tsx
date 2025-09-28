
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BloodPressureLogger from '@/components/tracking/BloodPressureLogger';
import BloodPressureChart from '@/components/charts/BloodPressureChart';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import SuccessOverlay from '@/components/common/SuccessOverlay';

interface BloodPressureReading {
  id: string;
  user_id: string;
  systolic: number;
  diastolic: number;
  heart_rate?: number;
  notes?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

const BloodPressureScreen = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentReadings, setRecentReadings] = useState<BloodPressureReading[]>([]);
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
    heart_rate?: number;
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
        heart_rate: data.heart_rate,
        notes: data.notes,
        timestamp: new Date().toISOString(),
      };

      await DatabaseService.executeUpdate(
        `INSERT INTO blood_pressure_readings 
         (id, user_id, systolic, diastolic, heart_rate, notes, timestamp, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          reading.user_id,
          reading.systolic,
          reading.diastolic,
          reading.heart_rate,
          reading.notes,
          reading.timestamp,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      setSuccessMessage(`Blood pressure logged: ${data.systolic}/${data.diastolic} mmHg`);
      setShowSuccess(true);

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

  const getBPTrend = () => {
    if (recentReadings.length < 2) return null;
    const recent = recentReadings.slice(0, 2);
    const currentSystolic = recent[0].systolic;
    const previousSystolic = recent[1].systolic;
    const diff = currentSystolic - previousSystolic;
    if (Math.abs(diff) < 5) return { trend: 'stable', icon: '➡️', color: '#666666' };
    if (diff > 0) return { trend: 'increasing', icon: '📈', color: '#FF5722' };
    return { trend: 'decreasing', icon: '📉', color: '#4CAF50' };
  };

  // Transform data for chart component
  const chartData = recentReadings.map(reading => ({
    id: reading.id,
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    heart_rate: reading.heart_rate,
    timestamp: new Date(reading.timestamp)
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Blood Pressure</Text>
        <Text style={styles.headerSubtitle}>
          {currentUser ? `Welcome, ${currentUser.name}` : 'Please log in'}
        </Text>
      </View>

      <BloodPressureLogger onLog={handleLogBloodPressure} />

      {recentReadings.length > 0 && (
        <>
          <BloodPressureChart 
            data={chartData} 
            period="7d" 
          />
          
          <View style={styles.trendSection}>
            <Text style={styles.trendTitle}>Recent Trend</Text>
            {(() => {
              const trend = getBPTrend();
              return trend ? (
                <View style={styles.trendContainer}>
                  <Text style={[styles.trendIcon, { color: trend.color }]}>{trend.icon}</Text>
                  <Text style={[styles.trendText, { color: trend.color }]}>Blood pressure is {trend.trend}</Text>
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

  const renderReading = ({ item }: { item: BloodPressureReading }) => {
    const category = getBloodPressureCategory(item.systolic, item.diastolic);
    return (
      <View style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <Text style={styles.readingValue}>
            {item.systolic}/{item.diastolic} mmHg
          </Text>
          <View style={[styles.readingCategory, { backgroundColor: category.color }]}>
            <Text style={styles.readingCategoryText}>{category.category}</Text>
          </View>
        </View>
        <Text style={styles.readingDate}>
          {formatDate(item.timestamp)}
        </Text>
        {item.heart_rate && (
          <Text style={styles.readingPulse}>
            Heart Rate: {item.heart_rate} bpm
          </Text>
        )}
        {item.notes && (
          <Text style={styles.readingNotes}>
            Notes: {item.notes}
          </Text>
        )}
      </View>
    );
  };

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
  readingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
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
  readingCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readingCategoryText: {
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
});

export default BloodPressureScreen;
