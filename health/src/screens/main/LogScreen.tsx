import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import BloodPressureChart from '@/components/charts/BloodPressureChart';
import BloodSugarChart from '@/components/charts/BloodSugarChart';
import WeightChart from '@/components/charts/WeightChart';

const { width } = Dimensions.get('window');

interface LogEntry {
  id: string;
  type: 'bloodSugar' | 'bloodPressure' | 'weight' | 'medication';
  value: string;
  timestamp: Date;
  notes?: string;
}

interface HealthReading {
  id: string;
  user_id: string;
  value: number;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  notes?: string;
  timestamp: string;
  created_at: string;
}

interface UserStats {
  totalReadings: number;
  weeklyReadings: number;
  averageBloodSugar?: number;
  averageBloodPressure?: { systolic: number; diastolic: number };
  currentWeight?: number;
  weightChange?: number;
}

const LogScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [bloodSugarData, setBloodSugarData] = useState<HealthReading[]>([]);
  const [bloodPressureData, setBloodPressureData] = useState<HealthReading[]>([]);
  const [weightData, setWeightData] = useState<HealthReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserDataAndLogs();
  }, [selectedPeriod]);

  const loadUserDataAndLogs = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        await Promise.all([
          loadRecentLogs(user.id),
          loadUserStats(user.id),
          loadChartData(user.id),
        ]);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentLogs = async (userId: string) => {
    try {
      const periodDays = selectedPeriod === 'today' ? 1 : selectedPeriod === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      // Load blood sugar readings
      const bloodSugarReadings = await DatabaseService.executeQuery<HealthReading>(
        `SELECT id, user_id, value, notes, timestamp, created_at, 'bloodSugar' as type 
         FROM blood_sugar_readings 
         WHERE user_id = ? AND timestamp >= ? 
         ORDER BY timestamp DESC LIMIT 10`,
        [userId, cutoffDate.toISOString()]
      );

      // Load blood pressure readings
      const bloodPressureReadings = await DatabaseService.executeQuery<HealthReading>(
        `SELECT id, user_id, systolic, diastolic, pulse, notes, timestamp, created_at, 'bloodPressure' as type 
         FROM blood_pressure_readings 
         WHERE user_id = ? AND timestamp >= ? 
         ORDER BY timestamp DESC LIMIT 10`,
        [userId, cutoffDate.toISOString()]
      );

      // Load weight readings
      const weightReadings = await DatabaseService.executeQuery<HealthReading>(
        `SELECT id, user_id, value, notes, timestamp, created_at, 'weight' as type 
         FROM weight_readings 
         WHERE user_id = ? AND timestamp >= ? 
         ORDER BY timestamp DESC LIMIT 10`,
        [userId, cutoffDate.toISOString()]
      );

      // Combine and format all readings
      const allLogs: LogEntry[] = [
        ...bloodSugarReadings.map(reading => ({
          id: reading.id,
          type: 'bloodSugar' as const,
          value: `${reading.value} mg/dL`,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        })),
        ...bloodPressureReadings.map(reading => ({
          id: reading.id,
          type: 'bloodPressure' as const,
          value: `${reading.systolic}/${reading.diastolic} mmHg`,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        })),
        ...weightReadings.map(reading => ({
          id: reading.id,
          type: 'weight' as const,
          value: `${reading.value} kg`,
          timestamp: new Date(reading.timestamp),
          notes: reading.notes,
        })),
      ];

      // Sort by timestamp (most recent first)
      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentLogs(allLogs.slice(0, 10));
    } catch (error) {
      console.error('Failed to load recent logs:', error);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      const periodDays = selectedPeriod === 'today' ? 1 : selectedPeriod === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      // Get total readings count
      const totalReadingsResult = await DatabaseService.executeQueryFirst<{count: number}>(
        `SELECT 
          (SELECT COUNT(*) FROM blood_sugar_readings WHERE user_id = ?) +
          (SELECT COUNT(*) FROM blood_pressure_readings WHERE user_id = ?) +
          (SELECT COUNT(*) FROM weight_readings WHERE user_id = ?) as count`,
        [userId, userId, userId]
      );

      // Get weekly readings count
      const weeklyReadingsResult = await DatabaseService.executeQueryFirst<{count: number}>(
        `SELECT 
          (SELECT COUNT(*) FROM blood_sugar_readings WHERE user_id = ? AND timestamp >= ?) +
          (SELECT COUNT(*) FROM blood_pressure_readings WHERE user_id = ? AND timestamp >= ?) +
          (SELECT COUNT(*) FROM weight_readings WHERE user_id = ? AND timestamp >= ?) as count`,
        [userId, cutoffDate.toISOString(), userId, cutoffDate.toISOString(), userId, cutoffDate.toISOString()]
      );

      // Get average blood sugar
      const avgBloodSugar = await DatabaseService.executeQueryFirst<{avg: number}>(
        `SELECT AVG(value) as avg FROM blood_sugar_readings 
         WHERE user_id = ? AND timestamp >= ?`,
        [userId, cutoffDate.toISOString()]
      );

      // Get average blood pressure
      const avgBloodPressure = await DatabaseService.executeQueryFirst<{avg_systolic: number, avg_diastolic: number}>(
        `SELECT AVG(systolic) as avg_systolic, AVG(diastolic) as avg_diastolic 
         FROM blood_pressure_readings 
         WHERE user_id = ? AND timestamp >= ?`,
        [userId, cutoffDate.toISOString()]
      );

      // Get current weight and weight change
      const currentWeight = await DatabaseService.executeQueryFirst<{value: number}>(
        `SELECT value FROM weight_readings 
         WHERE user_id = ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [userId]
      );

      const previousWeight = await DatabaseService.executeQueryFirst<{value: number}>(
        `SELECT value FROM weight_readings 
         WHERE user_id = ? AND timestamp < ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [userId, cutoffDate.toISOString()]
      );

      setUserStats({
        totalReadings: totalReadingsResult?.count || 0,
        weeklyReadings: weeklyReadingsResult?.count || 0,
        averageBloodSugar: avgBloodSugar?.avg || undefined,
        averageBloodPressure: avgBloodPressure?.avg_systolic ? {
          systolic: Math.round(avgBloodPressure.avg_systolic),
          diastolic: Math.round(avgBloodPressure.avg_diastolic)
        } : undefined,
        currentWeight: currentWeight?.value || undefined,
        weightChange: (currentWeight?.value && previousWeight?.value) ? 
          currentWeight.value - previousWeight.value : undefined,
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadChartData = async (userId: string) => {
    try {
      const periodDays = selectedPeriod === 'today' ? 1 : selectedPeriod === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);

      // Load chart data for the selected period
      const [bloodSugar, bloodPressure, weight] = await Promise.all([
        DatabaseService.executeQuery<HealthReading>(
          `SELECT * FROM blood_sugar_readings 
           WHERE user_id = ? AND timestamp >= ? 
           ORDER BY timestamp ASC`,
          [userId, cutoffDate.toISOString()]
        ),
        DatabaseService.executeQuery<HealthReading>(
          `SELECT * FROM blood_pressure_readings 
           WHERE user_id = ? AND timestamp >= ? 
           ORDER BY timestamp ASC`,
          [userId, cutoffDate.toISOString()]
        ),
        DatabaseService.executeQuery<HealthReading>(
          `SELECT * FROM weight_readings 
           WHERE user_id = ? AND timestamp >= ? 
           ORDER BY timestamp ASC`,
          [userId, cutoffDate.toISOString()]
        ),
      ]);

      setBloodSugarData(bloodSugar);
      setBloodPressureData(bloodPressure);
      setWeightData(weight);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const getTrackingOptions = () => {
    const latestBloodSugar = bloodSugarData[bloodSugarData.length - 1];
    const latestBloodPressure = bloodPressureData[bloodPressureData.length - 1];
    const latestWeight = weightData[weightData.length - 1];

    return [
      {
        id: 'bloodSugar',
        title: 'Blood Sugar',
        icon: '🩸',
        color: '#FF5722',
        lastValue: latestBloodSugar ? `${latestBloodSugar.value} mg/dL` : 'No data',
        trend: userStats?.averageBloodSugar ? 
          (userStats.averageBloodSugar > 140 ? 'high' : userStats.averageBloodSugar < 70 ? 'low' : 'stable') : 'stable',
        count: bloodSugarData.length,
      },
      {
        id: 'bloodPressure',
        title: 'Blood Pressure',
        icon: '❤️',
        color: '#E91E63',
        lastValue: latestBloodPressure ? 
          `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}` : 'No data',
        trend: userStats?.averageBloodPressure ? 
          (userStats.averageBloodPressure.systolic > 140 ? 'high' : 'good') : 'good',
        count: bloodPressureData.length,
      },
      {
        id: 'weight',
        title: 'Weight',
        icon: '⚖️',
        color: '#2196F3',
        lastValue: latestWeight ? `${latestWeight.value} kg` : 'No data',
        trend: userStats?.weightChange ? 
          (userStats.weightChange > 0 ? 'up' : userStats.weightChange < 0 ? 'down' : 'stable') : 'stable',
        count: weightData.length,
      },
      {
        id: 'medication',
        title: 'Medications',
        icon: '💊',
        color: '#9C27B0',
        lastValue: 'Track meds',
        trend: 'reminder',
        count: 0,
      },
    ];
  };

  const handleQuickLog = (type: string) => {
    if (type === 'bloodSugar') {
      navigation.navigate('BloodSugar');
    } else if (type === 'medication') {
      navigation.navigate('Medication');
    } else if (type === 'bloodPressure') {
      navigation.navigate('BloodPressure');
    } else if (type === 'weight') {
      navigation.navigate('Weight');
    } else {
      console.log(`Navigate to ${type} logging`);
    }
  };

  const handleViewDetails = (type: string) => {
    console.log(`Navigate to ${type} details`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'bloodSugar': return '🩸';
      case 'bloodPressure': return '❤️';
      case 'weight': return '⚖️';
      case 'medication': return '💊';
      default: return '📊';
    }
  };

  const getLogTitle = (type: string) => {
    switch (type) {
      case 'bloodSugar': return 'Blood Sugar';
      case 'bloodPressure': return 'Blood Pressure';
      case 'weight': return 'Weight';
      case 'medication': return 'Medication';
      default: return 'Log Entry';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      case 'good': return '✅';
      case 'reminder': return '⏰';
      default: return '➡️';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your health data...</Text>
      </View>
    );
  }

  const trackingOptions = getTrackingOptions();

  // Map selected period to chart period tokens
  const chartPeriod: '7d' | '30d' | '90d' = selectedPeriod === 'month' ? '30d' : '7d';

  // Normalize data for chart components (convert timestamp to Date, map fields)
  const bloodSugarChartData = bloodSugarData.map((r) => ({
    id: r.id,
    value: Number(r.value),
    // Fallback type since DB may not store context; can be enhanced later
    type: 'pre-meal' as const,
    timestamp: new Date(r.timestamp),
  }));

  const bloodPressureChartData = bloodPressureData
    .filter((r) => r.systolic !== undefined && r.diastolic !== undefined)
    .map((r) => ({
      id: r.id,
      systolic: Number(r.systolic),
      diastolic: Number(r.diastolic),
      pulse: r.pulse !== undefined ? Number(r.pulse) : undefined,
      timestamp: new Date(r.timestamp),
    }));

  const weightChartData = weightData.map((r) => ({
    id: r.id,
    weight: Number(r.value),
    unit: 'kg' as const,
    timestamp: new Date(r.timestamp),
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <Text style={styles.subtitle}>
          {currentUser ? `Welcome back, ${currentUser.name}` : 'Monitor your daily health metrics'}
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Stats Overview */}
      {userStats && (
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalReadings}</Text>
              <Text style={styles.statLabel}>Total Readings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.weeklyReadings}</Text>
              <Text style={styles.statLabel}>This {selectedPeriod}</Text>
            </View>
            {userStats.averageBloodSugar && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(userStats.averageBloodSugar)}</Text>
                <Text style={styles.statLabel}>Avg Blood Sugar</Text>
              </View>
            )}
            {userStats.currentWeight && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userStats.currentWeight}</Text>
                <Text style={styles.statLabel}>Current Weight</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Charts Section */}
      <Card style={styles.chartsCard}>
        <Text style={styles.sectionTitle}>Health Trends</Text>
        
        {bloodSugarChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Blood Sugar Levels</Text>
            <BloodSugarChart data={bloodSugarChartData} period={chartPeriod} />
          </View>
        )}

        {bloodPressureChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Blood Pressure</Text>
            <BloodPressureChart data={bloodPressureChartData} period={chartPeriod} />
          </View>
        )}

        {weightChartData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Weight Tracking</Text>
            <WeightChart data={weightChartData} period={chartPeriod} />
          </View>
        )}

        {bloodSugarChartData.length === 0 && bloodPressureChartData.length === 0 && weightChartData.length === 0 && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>📊</Text>
            <Text style={styles.noDataTitle}>No Data Available</Text>
            <Text style={styles.noDataText}>
              Start logging your health metrics to see trends and insights
            </Text>
          </View>
        )}
      </Card>

      {/* Quick Log Actions */}
      <Card style={styles.quickLogCard}>
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <Text style={styles.sectionSubtitle}>Tap any health metric below to log your readings</Text>
        <View style={styles.trackingGrid}>
          {trackingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.trackingOption}
              onPress={() => handleQuickLog(option.id)}
            >
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingIcon}>{option.icon}</Text>
                <Text style={styles.trendIcon}>{getTrendIcon(option.trend)}</Text>
              </View>
              <Text style={styles.trackingTitle}>{option.title}</Text>
              <Text style={styles.trackingValue}>{option.lastValue}</Text>
              <Text style={styles.trackingCount}>{option.count} readings</Text>
              <Button
                title="Log Now"
                onPress={() => handleQuickLog(option.id)}
                variant="primary"
                size="small"
                style={[styles.logButton, { backgroundColor: option.color }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Recent Logs */}
      <Card style={styles.recentLogsCard}>
        <View style={styles.recentLogsHeader}>
          <Text style={styles.sectionTitle}>Recent Logs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HealthLogManager' as never)}>
            <Text style={styles.viewAllText}>Manage All</Text>
          </TouchableOpacity>
        </View>

        {recentLogs.length > 0 ? (
          recentLogs.map((log) => (
            <TouchableOpacity
              key={log.id}
              style={styles.logEntry}
              onPress={() => handleViewDetails(log.type)}
            >
              <View style={styles.logEntryContent}>
                <View style={styles.logEntryLeft}>
                  <Text style={styles.logEntryIcon}>{getLogIcon(log.type)}</Text>
                  <View style={styles.logEntryDetails}>
                    <Text style={styles.logEntryTitle}>{getLogTitle(log.type)}</Text>
                    <Text style={styles.logEntryTime}>
                      {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                    </Text>
                    {log.notes && (
                      <Text style={styles.logEntryNotes}>{log.notes}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.logEntryRight}>
                  <Text style={styles.logEntryValue}>{log.value}</Text>
                  <Text style={styles.logEntryArrow}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>No logs yet</Text>
            <Text style={styles.emptyStateText}>
              Start tracking your health metrics to see your progress
            </Text>
          </View>
        )}
      </Card>

      {/* Health Insights */}
      <Card style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>Health Insights</Text>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>💡</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Consistent Tracking</Text>
            <Text style={styles.insightText}>
              You've logged your blood sugar 5 times this week. Keep it up!
            </Text>
          </View>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightIcon}>📈</Text>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Trend Analysis</Text>
            <Text style={styles.insightText}>
              Your blood pressure readings are within healthy range this month.
            </Text>
          </View>
        </View>
      </Card>

      {/* Reminders */}
      <Card style={styles.remindersCard}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        <View style={styles.reminderItem}>
          <Text style={styles.reminderIcon}>💊</Text>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>Evening Medication</Text>
            <Text style={styles.reminderTime}>Today at 8:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Mark Taken</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reminderItem}>
          <Text style={styles.reminderIcon}>🩸</Text>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>Blood Sugar Check</Text>
            <Text style={styles.reminderTime}>Tomorrow at 7:00 AM</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Set Alert</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  chartsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  trackingCount: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickLogCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  trackingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackingOption: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  trackingIcon: {
    fontSize: 24,
  },
  trendIcon: {
    fontSize: 16,
  },
  trackingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  trackingValue: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
  },
  logButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  recentLogsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  recentLogsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  logEntry: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logEntryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logEntryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  logEntryDetails: {
    flex: 1,
  },
  logEntryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  logEntryTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  logEntryNotes: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  logEntryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logEntryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 8,
  },
  logEntryArrow: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  remindersCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reminderIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  reminderTime: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  reminderButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
  },
  reminderButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default LogScreen;
