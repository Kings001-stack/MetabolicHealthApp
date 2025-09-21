import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

const MoreScreen: React.FC = () => {
  const [notifications, setNotifications] = useState({
    bloodSugar: true,
    medication: true,
    exercise: false,
    meals: true,
  });

  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your health data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Settings and additional features</Text>
      </View>

      {/* Profile Section */}
      <Card style={styles.profileCard}>
        <TouchableOpacity style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>JD</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@email.com</Text>
            <Text style={styles.profileStatus}>Premium Member</Text>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Premium Section */}
      <Card style={styles.premiumCard}>
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumIcon}>⭐</Text>
          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSubtitle}>Unlock advanced features and remove ads</Text>
          </View>
        </View>
        <View style={styles.premiumFeatures}>
          <Text style={styles.premiumFeature}>✓ Ad-free experience</Text>
          <Text style={styles.premiumFeature}>✓ Advanced health reports</Text>
          <Text style={styles.premiumFeature}>✓ Priority support</Text>
          <Text style={styles.premiumFeature}>✓ AI-powered insights</Text>
        </View>
        <Button
          title="Upgrade Now - $4.99/month"
          onPress={() => console.log('Navigate to premium')}
          variant="primary"
          size="medium"
          style={styles.premiumButton}
        />
      </Card>

      {/* Health Management */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Health Management</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Health Reports</Text>
            <Text style={styles.menuSubtitle}>Export your health data</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🎯</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Goals & Targets</Text>
            <Text style={styles.menuSubtitle}>Set your health objectives</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💊</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Medications</Text>
            <Text style={styles.menuSubtitle}>Manage your medications</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>👨‍⚕️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Healthcare Providers</Text>
            <Text style={styles.menuSubtitle}>Manage your medical team</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Reminders & Notifications */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Reminders & Notifications</Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Blood Sugar Reminders</Text>
            <Text style={styles.notificationSubtitle}>Daily logging reminders</Text>
          </View>
          <Switch
            value={notifications.bloodSugar}
            onValueChange={() => handleNotificationToggle('bloodSugar')}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Medication Reminders</Text>
            <Text style={styles.notificationSubtitle}>Never miss your medications</Text>
          </View>
          <Switch
            value={notifications.medication}
            onValueChange={() => handleNotificationToggle('medication')}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Exercise Reminders</Text>
            <Text style={styles.notificationSubtitle}>Stay active daily</Text>
          </View>
          <Switch
            value={notifications.exercise}
            onValueChange={() => handleNotificationToggle('exercise')}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Meal Reminders</Text>
            <Text style={styles.notificationSubtitle}>Track your nutrition</Text>
          </View>
          <Switch
            value={notifications.meals}
            onValueChange={() => handleNotificationToggle('meals')}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⏰</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Reminder Schedule</Text>
            <Text style={styles.menuSubtitle}>Customize reminder times</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* App Settings */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🌙</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Dark Mode</Text>
            <Text style={styles.menuSubtitle}>Coming soon</Text>
          </View>
          <Switch
            value={false}
            disabled={true}
            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
            thumbColor="#CCCCCC"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔒</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Text style={styles.menuSubtitle}>Manage your data privacy</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📱</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Data Sync</Text>
            <Text style={styles.menuSubtitle}>Google Fit, Apple Health</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📏</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Units</Text>
            <Text style={styles.menuSubtitle}>mg/dL, kg, cm</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* Support & Feedback */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support & Feedback</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Help Center</Text>
            <Text style={styles.menuSubtitle}>FAQs and guides</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>💬</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Contact Support</Text>
            <Text style={styles.menuSubtitle}>Get help from our team</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>⭐</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Rate the App</Text>
            <Text style={styles.menuSubtitle}>Share your experience</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🐛</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Report a Bug</Text>
            <Text style={styles.menuSubtitle}>Help us improve</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </Card>

      {/* About */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📄</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Terms of Service</Text>
            <Text style={styles.menuSubtitle}>Legal terms and conditions</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔐</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Privacy Policy</Text>
            <Text style={styles.menuSubtitle}>How we protect your data</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>App Version</Text>
            <Text style={styles.menuSubtitle}>1.0.0 (Build 1)</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Account Actions */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
            <Text style={styles.menuSubtitle}>Sign out of your account</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
          <Text style={styles.menuIcon}>🗑️</Text>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, styles.deleteText]}>Delete Account</Text>
            <Text style={styles.menuSubtitle}>Permanently delete your data</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
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
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 2,
  },
  profileArrow: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  premiumCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#F57C00',
    marginTop: 2,
  },
  premiumFeatures: {
    marginBottom: 16,
  },
  premiumFeature: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
  },
  premiumButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  logoutText: {
    color: '#FF9800',
  },
  deleteText: {
    color: '#F44336',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default MoreScreen;
