import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthenticationService from '@/services/auth/AuthenticationService';
import { User } from '@/database/repositories/UserRepository';
import NutritionService from '@/services/nutrition/NutritionService';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

interface SettingsData {
  notifications: {
    bloodSugar: boolean;
    medication: boolean;
    exercise: boolean;
    meals: boolean;
    bloodPressure: boolean;
    weight: boolean;
  };
  units: {
    bloodSugar: 'mg/dL' | 'mmol/L';
    weight: 'kg' | 'lbs';
    height: 'cm' | 'ft';
    temperature: 'C' | 'F';
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
    crashReports: boolean;
  };
  reminders: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'custom';
    time: string;
  };
}

const SettingsScreen: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      bloodSugar: true,
      medication: true,
      exercise: false,
      meals: true,
      bloodPressure: true,
      weight: false,
    },
    units: {
      bloodSugar: 'mg/dL',
      weight: 'kg',
      height: 'cm',
      temperature: 'C',
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      crashReports: true,
    },
    reminders: {
      enabled: true,
      frequency: 'daily',
      time: '09:00',
    },
  });

  // API key modal state
  const [apiModalVisible, setApiModalVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);

      // Load user-specific settings
      if (user) {
        const savedSettings = await AsyncStorage.getItem(`settings_${user.id}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsData) => {
    try {
      if (currentUser) {
        await AsyncStorage.setItem(`settings_${currentUser.id}`, JSON.stringify(newSettings));
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleNotification = (type: keyof typeof settings.notifications) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [type]: !settings.notifications[type],
      },
    };
    saveSettings(newSettings);
  };

  const togglePrivacy = (type: keyof typeof settings.privacy) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [type]: !settings.privacy[type],
      },
    };
    saveSettings(newSettings);
  };

  const changeUnit = (category: keyof typeof settings.units, value: any) => {
    const newSettings = {
      ...settings,
      units: {
        ...settings.units,
        [category]: value,
      },
    };
    saveSettings(newSettings);
  };

  const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }> = ({ title, subtitle, value, onToggle, onPress, rightElement }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress && !onToggle}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (
        onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        )
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            {currentUser ? `Logged in as ${currentUser.name}` : 'Loading...'}
          </Text>
        </View>

        <SettingSection title="Notifications">
          <SettingRow
            title="Blood Sugar Reminders"
            subtitle="Daily logging reminders"
            value={settings.notifications.bloodSugar}
            onToggle={() => toggleNotification('bloodSugar')}
          />
          <SettingRow
            title="Medication Reminders"
            subtitle="Never miss your medications"
            value={settings.notifications.medication}
            onToggle={() => toggleNotification('medication')}
          />
          <SettingRow
            title="Blood Pressure Reminders"
            subtitle="Regular monitoring alerts"
            value={settings.notifications.bloodPressure}
            onToggle={() => toggleNotification('bloodPressure')}
          />
          <SettingRow
            title="Weight Tracking"
            subtitle="Weekly weight check reminders"
            value={settings.notifications.weight}
            onToggle={() => toggleNotification('weight')}
          />
          <SettingRow
            title="Exercise Reminders"
            subtitle="Stay active daily"
            value={settings.notifications.exercise}
            onToggle={() => toggleNotification('exercise')}
          />
          <SettingRow
            title="Meal Reminders"
            subtitle="Track your nutrition"
            value={settings.notifications.meals}
            onToggle={() => toggleNotification('meals')}
          />
        </SettingSection>

        <SettingSection title="Units">
          <SettingRow
            title="Blood Sugar"
            subtitle={`Currently: ${settings.units.bloodSugar}`}
            onPress={() => {
              Alert.alert(
                'Blood Sugar Units',
                'Choose your preferred unit',
                [
                  { text: 'mg/dL', onPress: () => changeUnit('bloodSugar', 'mg/dL') },
                  { text: 'mmol/L', onPress: () => changeUnit('bloodSugar', 'mmol/L') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            rightElement={<Text style={styles.unitValue}>{settings.units.bloodSugar}</Text>}
          />
          <SettingRow
            title="Weight"
            subtitle={`Currently: ${settings.units.weight}`}
            onPress={() => {
              Alert.alert(
                'Weight Units',
                'Choose your preferred unit',
                [
                  { text: 'kg', onPress: () => changeUnit('weight', 'kg') },
                  { text: 'lbs', onPress: () => changeUnit('weight', 'lbs') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            rightElement={<Text style={styles.unitValue}>{settings.units.weight}</Text>}
          />
          <SettingRow
            title="Height"
            subtitle={`Currently: ${settings.units.height}`}
            onPress={() => {
              Alert.alert(
                'Height Units',
                'Choose your preferred unit',
                [
                  { text: 'cm', onPress: () => changeUnit('height', 'cm') },
                  { text: 'ft', onPress: () => changeUnit('height', 'ft') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            rightElement={<Text style={styles.unitValue}>{settings.units.height}</Text>}
          />
        </SettingSection>

        <SettingSection title="Privacy & Data">
          <SettingRow
            title="Data Sharing"
            subtitle="Share anonymized data for research"
            value={settings.privacy.dataSharing}
            onToggle={() => togglePrivacy('dataSharing')}
          />
          <SettingRow
            title="Analytics"
            subtitle="Help improve the app"
            value={settings.privacy.analytics}
            onToggle={() => togglePrivacy('analytics')}
          />
          <SettingRow
            title="Crash Reports"
            subtitle="Automatically send crash reports"
            value={settings.privacy.crashReports}
            onToggle={() => togglePrivacy('crashReports')}
          />
        </SettingSection>

        <SettingSection title="Integrations">
          <SettingRow
            title="USDA FoodData Central API Key"
            subtitle="Used for food search and nutrition details"
            onPress={() => setApiModalVisible(true)}
            rightElement={<Text style={styles.unitValue}>Set</Text>}
          />
          <Text style={{ paddingHorizontal: 20, paddingBottom: 12, color: '#777' }}>
            Your key is stored securely in the local database and not shared.
          </Text>
        </SettingSection>

        <Modal
          visible={apiModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setApiModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Set USDA FDC API Key</Text>
              <Text style={styles.modalSubtitle}>Paste your API key below</Text>
              {/* Using a simple TextInput via our Input component for consistency */}
              <View style={{ width: '100%', marginTop: 12, marginBottom: 12 }}>
                <Input
                  placeholder="Enter API key"
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry
                  style={{ marginVertical: 0 }}
                />
              </View>
              <View style={styles.modalActions}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => {
                      setApiKeyInput('');
                      setApiModalVisible(false);
                    }}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Button
                    title="Save"
                    variant="primary"
                    onPress={async () => {
                      if (!apiKeyInput.trim()) {
                        Alert.alert('Missing Key', 'Please paste a valid API key.');
                        return;
                      }
                      try {
                        await NutritionService.setApiKey(apiKeyInput.trim());
                        setApiKeyInput('');
                        setApiModalVisible(false);
                        Alert.alert('Success', 'API key saved. You can now search foods.');
                      } catch (e) {
                        Alert.alert('Error', 'Failed to save API key.');
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

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
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  unitValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 30,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
});

export default SettingsScreen;
