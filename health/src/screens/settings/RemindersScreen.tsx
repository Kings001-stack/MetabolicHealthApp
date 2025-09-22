import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthenticationService from '@/services/auth/AuthenticationService';
import { User } from '@/database/repositories/UserRepository';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ReminderSettings {
  bloodSugar: {
    enabled: boolean;
    times: string[];
    frequency: 'daily' | 'custom';
  };
  medication: {
    enabled: boolean;
    times: string[];
    medications: Array<{
      name: string;
      dosage: string;
      times: string[];
    }>;
  };
  bloodPressure: {
    enabled: boolean;
    times: string[];
    frequency: 'daily' | 'weekly';
  };
  weight: {
    enabled: boolean;
    time: string;
    frequency: 'daily' | 'weekly';
  };
  exercise: {
    enabled: boolean;
    time: string;
    frequency: 'daily';
  };
  meals: {
    enabled: boolean;
    times: string[];
  };
}

const RemindersScreen: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{
    visible: boolean;
    type: string;
    index?: number;
  }>({ visible: false, type: '' });
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [reminders, setReminders] = useState<ReminderSettings>({
    bloodSugar: {
      enabled: true,
      times: ['09:00', '13:00', '18:00'],
      frequency: 'daily',
    },
    medication: {
      enabled: true,
      times: ['08:00', '20:00'],
      medications: [],
    },
    bloodPressure: {
      enabled: false,
      times: ['09:00', '21:00'],
      frequency: 'daily',
    },
    weight: {
      enabled: false,
      time: '08:00',
      frequency: 'weekly',
    },
    exercise: {
      enabled: true,
      time: '17:00',
      frequency: 'daily',
    },
    meals: {
      enabled: true,
      times: ['08:00', '12:30', '18:30'],
    },
  });

  useEffect(() => {
    loadUserAndReminders();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadUserAndReminders = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const savedReminders = await AsyncStorage.getItem(`reminders_${user.id}`);
        if (savedReminders) {
          setReminders(JSON.parse(savedReminders));
        }
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const saveReminders = async (newReminders: ReminderSettings) => {
    try {
      if (currentUser) {
        await AsyncStorage.setItem(`reminders_${currentUser.id}`, JSON.stringify(newReminders));
        setReminders(newReminders);
        await scheduleNotifications(newReminders);
      }
    } catch (error) {
      console.error('Failed to save reminders:', error);
      Alert.alert('Error', 'Failed to save reminders');
    }
  };

  const scheduleNotifications = async (reminderSettings: ReminderSettings) => {
    try {
      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule blood sugar reminders
      if (reminderSettings.bloodSugar.enabled) {
        for (const time of reminderSettings.bloodSugar.times) {
          await scheduleRepeatingNotification(
            'Blood Sugar Reminder',
            'Time to check your blood sugar level',
            time,
            'bloodSugar'
          );
        }
      }

      // Schedule medication reminders
      if (reminderSettings.medication.enabled) {
        for (const time of reminderSettings.medication.times) {
          await scheduleRepeatingNotification(
            'Medication Reminder',
            'Time to take your medication',
            time,
            'medication'
          );
        }
      }

      // Schedule blood pressure reminders
      if (reminderSettings.bloodPressure.enabled) {
        for (const time of reminderSettings.bloodPressure.times) {
          await scheduleRepeatingNotification(
            'Blood Pressure Reminder',
            'Time to check your blood pressure',
            time,
            'bloodPressure'
          );
        }
      }

      // Schedule weight reminders
      if (reminderSettings.weight.enabled) {
        const frequency = reminderSettings.weight.frequency === 'weekly' ? 7 : 1;
        await scheduleRepeatingNotification(
          'Weight Reminder',
          'Time to weigh yourself',
          reminderSettings.weight.time,
          'weight',
          frequency
        );
      }

      // Schedule exercise reminders
      if (reminderSettings.exercise.enabled) {
        await scheduleRepeatingNotification(
          'Exercise Reminder',
          'Time for your daily exercise',
          reminderSettings.exercise.time,
          'exercise'
        );
      }

      // Schedule meal reminders
      if (reminderSettings.meals.enabled) {
        const mealNames = ['Breakfast', 'Lunch', 'Dinner'];
        for (let i = 0; i < reminderSettings.meals.times.length; i++) {
          const mealName = mealNames[i] || 'Meal';
          await scheduleRepeatingNotification(
            `${mealName} Reminder`,
            `Time for ${mealName.toLowerCase()}`,
            reminderSettings.meals.times[i],
            'meal'
          );
        }
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  };

  const scheduleRepeatingNotification = async (
    title: string,
    body: string,
    time: string,
    category: string,
    dayInterval: number = 1
  ) => {
    const [hours, minutes] = time.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        categoryIdentifier: category,
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  };

  const toggleReminder = (type: keyof ReminderSettings) => {
    const newReminders = {
      ...reminders,
      [type]: {
        ...reminders[type],
        enabled: !reminders[type].enabled,
      },
    };
    saveReminders(newReminders);
  };

  const updateTime = (type: keyof ReminderSettings, timeIndex: number, newTime: string) => {
    const newReminders = { ...reminders };
    
    if (type === 'weight' || type === 'exercise') {
      (newReminders[type] as any).time = newTime;
    } else {
      (newReminders[type] as any).times[timeIndex] = newTime;
    }
    
    saveReminders(newReminders);
  };

  const addTime = (type: keyof ReminderSettings) => {
    const newReminders = { ...reminders };
    (newReminders[type] as any).times.push('12:00');
    saveReminders(newReminders);
  };

  const removeTime = (type: keyof ReminderSettings, timeIndex: number) => {
    const newReminders = { ...reminders };
    (newReminders[type] as any).times.splice(timeIndex, 1);
    saveReminders(newReminders);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker({ visible: false, type: '' });
    }

    if (selectedDate) {
      const timeString = selectedDate.toTimeString().slice(0, 5);
      const { type, index } = showTimePicker;
      
      if (index !== undefined) {
        updateTime(type as keyof ReminderSettings, index, timeString);
      } else if (type === 'weight' || type === 'exercise') {
        updateTime(type as keyof ReminderSettings, 0, timeString);
      }
    }

    if (Platform.OS === 'ios') {
      setShowTimePicker({ visible: false, type: '' });
    }
  };

  const ReminderSection: React.FC<{
    title: string;
    enabled: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }> = ({ title, enabled, onToggle, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
          thumbColor="#FFFFFF"
        />
      </View>
      {enabled && children}
    </View>
  );

  const TimeRow: React.FC<{
    label: string;
    time: string;
    onPress: () => void;
    onRemove?: () => void;
  }> = ({ label, time, onPress, onRemove }) => (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeActions}>
        <TouchableOpacity style={styles.timeButton} onPress={onPress}>
          <Text style={styles.timeText}>{time}</Text>
        </TouchableOpacity>
        {onRemove && (
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>
            Set up personalized health reminders
          </Text>
        </View>

        <ReminderSection
          title="Blood Sugar"
          enabled={reminders.bloodSugar.enabled}
          onToggle={() => toggleReminder('bloodSugar')}
        >
          {reminders.bloodSugar.times.map((time, index) => (
            <TimeRow
              key={index}
              label={`Check ${index + 1}`}
              time={time}
              onPress={() => {
                setSelectedTime(new Date(`2000-01-01T${time}:00`));
                setShowTimePicker({ visible: true, type: 'bloodSugar', index });
              }}
              onRemove={reminders.bloodSugar.times.length > 1 ? () => removeTime('bloodSugar', index) : undefined}
            />
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => addTime('bloodSugar')}>
            <Text style={styles.addButtonText}>+ Add Time</Text>
          </TouchableOpacity>
        </ReminderSection>

        <ReminderSection
          title="Medication"
          enabled={reminders.medication.enabled}
          onToggle={() => toggleReminder('medication')}
        >
          {reminders.medication.times.map((time, index) => (
            <TimeRow
              key={index}
              label={`Dose ${index + 1}`}
              time={time}
              onPress={() => {
                setSelectedTime(new Date(`2000-01-01T${time}:00`));
                setShowTimePicker({ visible: true, type: 'medication', index });
              }}
              onRemove={reminders.medication.times.length > 1 ? () => removeTime('medication', index) : undefined}
            />
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => addTime('medication')}>
            <Text style={styles.addButtonText}>+ Add Time</Text>
          </TouchableOpacity>
        </ReminderSection>

        <ReminderSection
          title="Blood Pressure"
          enabled={reminders.bloodPressure.enabled}
          onToggle={() => toggleReminder('bloodPressure')}
        >
          {reminders.bloodPressure.times.map((time, index) => (
            <TimeRow
              key={index}
              label={`Check ${index + 1}`}
              time={time}
              onPress={() => {
                setSelectedTime(new Date(`2000-01-01T${time}:00`));
                setShowTimePicker({ visible: true, type: 'bloodPressure', index });
              }}
              onRemove={reminders.bloodPressure.times.length > 1 ? () => removeTime('bloodPressure', index) : undefined}
            />
          ))}
          <TouchableOpacity style={styles.addButton} onPress={() => addTime('bloodPressure')}>
            <Text style={styles.addButtonText}>+ Add Time</Text>
          </TouchableOpacity>
        </ReminderSection>

        <ReminderSection
          title="Weight Tracking"
          enabled={reminders.weight.enabled}
          onToggle={() => toggleReminder('weight')}
        >
          <TimeRow
            label="Weigh-in Time"
            time={reminders.weight.time}
            onPress={() => {
              setSelectedTime(new Date(`2000-01-01T${reminders.weight.time}:00`));
              setShowTimePicker({ visible: true, type: 'weight' });
            }}
          />
          <Text style={styles.frequencyText}>Frequency: {reminders.weight.frequency}</Text>
        </ReminderSection>

        <ReminderSection
          title="Exercise"
          enabled={reminders.exercise.enabled}
          onToggle={() => toggleReminder('exercise')}
        >
          <TimeRow
            label="Exercise Time"
            time={reminders.exercise.time}
            onPress={() => {
              setSelectedTime(new Date(`2000-01-01T${reminders.exercise.time}:00`));
              setShowTimePicker({ visible: true, type: 'exercise' });
            }}
          />
        </ReminderSection>

        <ReminderSection
          title="Meals"
          enabled={reminders.meals.enabled}
          onToggle={() => toggleReminder('meals')}
        >
          {reminders.meals.times.map((time, index) => {
            const mealNames = ['Breakfast', 'Lunch', 'Dinner'];
            return (
              <TimeRow
                key={index}
                label={mealNames[index] || `Meal ${index + 1}`}
                time={time}
                onPress={() => {
                  setSelectedTime(new Date(`2000-01-01T${time}:00`));
                  setShowTimePicker({ visible: true, type: 'meals', index });
                }}
                onRemove={reminders.meals.times.length > 1 ? () => removeTime('meals', index) : undefined}
              />
            );
          })}
          <TouchableOpacity style={styles.addButton} onPress={() => addTime('meals')}>
            <Text style={styles.addButtonText}>+ Add Meal Time</Text>
          </TouchableOpacity>
        </ReminderSection>

        {showTimePicker.visible && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  timeLabel: {
    fontSize: 16,
    color: '#333333',
  },
  timeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 30,
  },
});

export default RemindersScreen;
