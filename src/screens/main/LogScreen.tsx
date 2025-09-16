import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const { width } = Dimensions.get('window');

interface LogEntry {
  id: string;
  type: 'bloodSugar' | 'bloodPressure' | 'weight' | 'medication';
  value: string;
  timestamp: Date;
  notes?: string;
}

const LogScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [recentLogs] = useState<LogEntry[]>([
    {
      id: '1',
      type: 'bloodSugar',
      value: '120 mg/dL',
      timestamp: new Date(),
      notes: 'Before breakfast',
    },
    {
      id: '2',
      type: 'weight',
      value: '70.5 kg',
      timestamp: new Date(Date.now() - 86400000), // Yesterday
    },
    {
      id: '3',
      type: 'bloodPressure',
      value: '118/78 mmHg',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
    },
  ]);

  const trackingOptions = [
    {
      id: 'bloodSugar',
      title: 'Blood Sugar',
      icon: '🩸',
      color: '#FF5722',
      lastValue: '120 mg/dL',
      trend: 'stable',
    },
    {
      id: 'bloodPressure',
      title: 'Blood Pressure',
      icon: '❤️',
      color: '#E91E63',
      lastValue: '118/78',
      trend: 'good',
    },
    {
      id: 'weight',
      title: 'Weight',
      icon: '⚖️',
      color: '#2196F3',
      lastValue: '70.5 kg',
      trend: 'down',
    },
    {
      id: 'medication',
      title: 'Medications',
      icon: '💊',
      color: '#9C27B0',
      lastValue: '2/3 taken',
      trend: 'reminder',
    },
  ];

  const handleQuickLog = (type: string) => {
    console.log(`Navigate to ${type} logging`);
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Tracking</Text>
        <Text style={styles.subtitle}>Monitor your daily health metrics</Text>
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

      {/* Quick Log Actions */}
      <Card style={styles.quickLogCard}>
        <Text style={styles.sectionTitle}>Quick Log</Text>
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
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
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
