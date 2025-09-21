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
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';

interface ProfileSetupScreenProps {
  onComplete: (profileData: any) => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
  });

  const [errors, setErrors] = useState<any>({});

  const genderOptions = ['Male', 'Female', 'Other'];
  const activityLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    else if (parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }
    if (!formData.gender) newErrors.gender = 'Please select your gender';
    if (!formData.height) newErrors.height = 'Height is required';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    if (!formData.activityLevel) newErrors.activityLevel = 'Please select activity level';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            This helps us provide personalized health insights
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Enter your full name"
            error={errors.name}
          />

          <Input
            label="Age"
            value={formData.age}
            onChangeText={(value) => updateField('age', value)}
            placeholder="Enter your age"
            keyboardType="numeric"
            error={errors.age}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.optionsRow}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    formData.gender === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => updateField('gender', option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.gender === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
          </View>

          <View style={styles.measurementRow}>
            <Input
              label="Height (cm)"
              value={formData.height}
              onChangeText={(value) => updateField('height', value)}
              placeholder="170"
              keyboardType="numeric"
              error={errors.height}
              containerStyle={styles.halfWidth}
            />
            <Input
              label="Weight (kg)"
              value={formData.weight}
              onChangeText={(value) => updateField('weight', value)}
              placeholder="70"
              keyboardType="numeric"
              error={errors.weight}
              containerStyle={styles.halfWidth}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Activity Level</Text>
            {activityLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.activityOption,
                  formData.activityLevel === level && styles.activityOptionSelected,
                ]}
                onPress={() => updateField('activityLevel', level)}
              >
                <View style={styles.activityOptionContent}>
                  <View
                    style={[
                      styles.radioButton,
                      formData.activityLevel === level && styles.radioButtonSelected,
                    ]}
                  >
                    {formData.activityLevel === level && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.activityText,
                      formData.activityLevel === level && styles.activityTextSelected,
                    ]}
                  >
                    {level}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {errors.activityLevel && <Text style={styles.errorText}>{errors.activityLevel}</Text>}
          </View>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          style={styles.continueButton}
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
    lineHeight: 22,
  },
  formCard: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  activityOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  activityOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  activityOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4CAF50',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  activityText: {
    fontSize: 16,
    color: '#666666',
  },
  activityTextSelected: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  continueButton: {
    borderRadius: 12,
  },
});

export default ProfileSetupScreen;
