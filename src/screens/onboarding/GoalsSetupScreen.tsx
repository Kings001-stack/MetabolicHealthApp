import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

interface GoalsSetupScreenProps {
  onComplete: (goalsData: any) => void;
}

const GoalsSetupScreen: React.FC<GoalsSetupScreenProps> = ({ onComplete }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [reminderPreferences, setReminderPreferences] = useState({
    bloodSugar: false,
    medication: false,
    exercise: false,
    meals: false,
  });

  const healthGoals = [
    { id: 'prevent_diabetes', title: 'Prevent Diabetes', icon: '🛡️' },
    { id: 'manage_diabetes', title: 'Manage Diabetes', icon: '📊' },
    { id: 'lose_weight', title: 'Lose Weight', icon: '⚖️' },
    { id: 'lower_bp', title: 'Lower Blood Pressure', icon: '❤️' },
    { id: 'improve_cholesterol', title: 'Improve Cholesterol', icon: '🩸' },
    { id: 'general_wellness', title: 'General Wellness', icon: '✨' },
  ];

  const conditions = [
    'Type 1 Diabetes',
    'Type 2 Diabetes',
    'Prediabetes',
    'High Blood Pressure',
    'High Cholesterol',
    'Obesity',
    'None of the above',
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleCondition = (condition: string) => {
    setHealthConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleReminder = (type: keyof typeof reminderPreferences) => {
    setReminderPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleComplete = () => {
    const goalsData = {
      goals: selectedGoals,
      healthConditions,
      reminderPreferences,
    };
    onComplete(goalsData);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Health Goals</Text>
          <Text style={styles.subtitle}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Health Goals */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What are your health goals?</Text>
          <Text style={styles.sectionSubtitle}>Select all that apply</Text>
          
          <View style={styles.goalsGrid}>
            {healthGoals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  selectedGoals.includes(goal.id) && styles.goalCardSelected,
                ]}
                onPress={() => toggleGoal(goal.id)}
              >
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <Text
                  style={[
                    styles.goalText,
                    selectedGoals.includes(goal.id) && styles.goalTextSelected,
                  ]}
                >
                  {goal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Health Conditions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Current Health Conditions</Text>
          <Text style={styles.sectionSubtitle}>This helps us provide relevant content</Text>
          
          {conditions.map((condition) => (
            <TouchableOpacity
              key={condition}
              style={[
                styles.conditionOption,
                healthConditions.includes(condition) && styles.conditionOptionSelected,
              ]}
              onPress={() => toggleCondition(condition)}
            >
              <View style={styles.conditionContent}>
                <View
                  style={[
                    styles.checkbox,
                    healthConditions.includes(condition) && styles.checkboxSelected,
                  ]}
                >
                  {healthConditions.includes(condition) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.conditionText,
                    healthConditions.includes(condition) && styles.conditionTextSelected,
                  ]}
                >
                  {condition}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Reminder Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reminder Preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose what you'd like to be reminded about</Text>
          
          <TouchableOpacity
            style={styles.reminderOption}
            onPress={() => toggleReminder('bloodSugar')}
          >
            <View style={styles.reminderContent}>
              <View
                style={[
                  styles.toggle,
                  reminderPreferences.bloodSugar && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminderPreferences.bloodSugar && styles.toggleThumbActive,
                  ]}
                />
              </View>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle}>Blood Sugar Logging</Text>
                <Text style={styles.reminderSubtitle}>Daily reminders to log readings</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reminderOption}
            onPress={() => toggleReminder('medication')}
          >
            <View style={styles.reminderContent}>
              <View
                style={[
                  styles.toggle,
                  reminderPreferences.medication && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminderPreferences.medication && styles.toggleThumbActive,
                  ]}
                />
              </View>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle}>Medication Reminders</Text>
                <Text style={styles.reminderSubtitle}>Never miss your medications</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reminderOption}
            onPress={() => toggleReminder('exercise')}
          >
            <View style={styles.reminderContent}>
              <View
                style={[
                  styles.toggle,
                  reminderPreferences.exercise && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminderPreferences.exercise && styles.toggleThumbActive,
                  ]}
                />
              </View>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle}>Exercise Reminders</Text>
                <Text style={styles.reminderSubtitle}>Stay active with daily prompts</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reminderOption}
            onPress={() => toggleReminder('meals')}
          >
            <View style={styles.reminderContent}>
              <View
                style={[
                  styles.toggle,
                  reminderPreferences.meals && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    reminderPreferences.meals && styles.toggleThumbActive,
                  ]}
                />
              </View>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle}>Meal Logging</Text>
                <Text style={styles.reminderSubtitle}>Track your nutrition intake</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Complete Setup"
          onPress={handleComplete}
          variant="primary"
          size="large"
          style={styles.completeButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  sectionCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  goalIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#4CAF50',
  },
  conditionOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  conditionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  conditionText: {
    fontSize: 16,
    color: '#666666',
  },
  conditionTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  reminderOption: {
    marginBottom: 16,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    marginRight: 16,
  },
  toggleActive: {
    backgroundColor: '#4CAF50',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginLeft: 2,
  },
  toggleThumbActive: {
    marginLeft: 24,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  reminderSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  completeButton: {
    borderRadius: 12,
  },
});

export default GoalsSetupScreen;
