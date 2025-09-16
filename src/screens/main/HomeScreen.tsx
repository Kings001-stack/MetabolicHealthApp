import React, { useState, useEffect } from 'react';
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
import Alert from '@/components/common/Alert';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [todaysTip, setTodaysTip] = useState('');
  const [quickStats, setQuickStats] = useState({
    lastBloodSugar: null,
    lastWeight: null,
    todaySteps: 0,
    currentStreak: 7,
  });

  const dailyTips = [
    "A 30-minute walk after meals can lower blood sugar by up to 20%",
    "Drinking water before meals helps with portion control and digestion",
    "Getting 7-8 hours of sleep helps regulate blood sugar levels",
    "Eating fiber-rich foods helps slow sugar absorption",
    "Regular meal timing helps maintain stable blood sugar",
  ];


  useEffect(() => {
    // Set random daily tip
    const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
    setTodaysTip(randomTip);
  }, []);

  const handleQuickLog = (type: string) => {
    // Navigate to specific logging screen
    console.log(`Quick log: ${type}`);
  };


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning! 👋</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Tip */}
      <Card style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipTitle}>Today's Health Tip</Text>
        </View>
        <Text style={styles.tipText}>{todaysTip}</Text>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickLog('bloodSugar')}
          >
            <Text style={styles.quickActionIcon}>🩸</Text>
            <Text style={styles.quickActionText}>Blood Sugar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickLog('bloodPressure')}
          >
            <Text style={styles.quickActionIcon}>❤️</Text>
            <Text style={styles.quickActionText}>Blood Pressure</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickLog('weight')}
          >
            <Text style={styles.quickActionIcon}>⚖️</Text>
            <Text style={styles.quickActionText}>Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickLog('medication')}
          >
            <Text style={styles.quickActionIcon}>💊</Text>
            <Text style={styles.quickActionText}>Medication</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Today's Summary */}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>7</Text>
            <Text style={styles.summaryLabel}>Days Tracked</Text>
            <Text style={styles.summaryIcon}>📊</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>3</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryIcon}>📅</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>85%</Text>
            <Text style={styles.summaryLabel}>In Range</Text>
            <Text style={styles.summaryIcon}>🎯</Text>
          </View>
        </View>
      </Card>

      {/* Health Reminders */}
      <Card style={styles.remindersCard}>
        <View style={styles.remindersHeader}>
          <Text style={styles.sectionTitle}>Today's Reminders</Text>
          <Text style={styles.remindersIcon}>⏰</Text>
        </View>
        
        <View style={styles.reminderItem}>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>Morning Blood Sugar Check</Text>
            <Text style={styles.reminderTime}>Due in 2 hours</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Log Now</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.reminderItem}>
          <View style={styles.reminderContent}>
            <Text style={styles.reminderTitle}>Evening Medication</Text>
            <Text style={styles.reminderTime}>Today at 8:00 PM</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Text style={styles.reminderButtonText}>Set Alert</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Recent Activity Alert */}
      {quickStats.lastBloodSugar === null && (
        <Alert
          type="warning"
          title="No recent readings"
          message="Consider logging your blood sugar to track your progress."
          style={styles.alertStyle}
        />
      )}

      {/* Quick Access to Education */}
      <Card style={styles.educationCard}>
        <View style={styles.educationHeader}>
          <Text style={styles.sectionTitle}>Learn Something New</Text>
          <Text style={styles.educationIcon}>📚</Text>
        </View>
        <Text style={styles.educationText}>
          Understanding diabetes management can help you make better health decisions.
        </Text>
        <Button
          title="Explore Health Topics"
          onPress={() => console.log('Navigate to Learn')}
          variant="outline"
          size="medium"
          style={styles.educationButton}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  tipCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  tipText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  summaryIcon: {
    fontSize: 16,
    marginTop: 4,
  },
  remindersCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  remindersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  remindersIcon: {
    fontSize: 20,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  alertStyle: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  educationCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  educationIcon: {
    fontSize: 20,
  },
  educationText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  educationButton: {
    borderRadius: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
