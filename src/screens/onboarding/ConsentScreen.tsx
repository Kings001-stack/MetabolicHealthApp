import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';

interface ConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAccept, onDecline }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleContinue = () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      Alert.alert(
        'Agreement Required',
        'Please agree to both Terms of Service and Privacy Policy to continue.'
      );
      return;
    }
    onAccept();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy & Terms</Text>
          <Text style={styles.subtitle}>
            Your health data is important to us. Please review and accept our terms.
          </Text>
        </View>

        <Card style={styles.consentCard}>
          <Text style={styles.sectionTitle}>Medical Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            This app is for general wellness and education purposes only. It does not provide 
            medical advice, diagnosis, or treatment recommendations. Always consult qualified 
            healthcare providers for medical concerns.
          </Text>
        </Card>

        <Card style={styles.consentCard}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          <Text style={styles.bodyText}>
            We collect health data you provide to:
          </Text>
          <Text style={styles.bulletText}>• Track your health metrics</Text>
          <Text style={styles.bulletText}>• Provide personalized insights</Text>
          <Text style={styles.bulletText}>• Improve our services</Text>
          <Text style={styles.bulletText}>• Send health reminders</Text>
        </Card>

        <Card style={styles.consentCard}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.bodyText}>
            Your data is encrypted and stored securely. We never sell your personal 
            health information to third parties.
          </Text>
        </Card>

        {/* Consent Checkboxes */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I agree to the Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
          >
            <View style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}>
              {agreedToPrivacy && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              I agree to the Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          style={styles.continueButton}
        />
        <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
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
    lineHeight: 22,
  },
  consentCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#FF5722',
    lineHeight: 20,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginLeft: 8,
  },
  checkboxContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: 12,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  declineText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});

export default ConsentScreen;
