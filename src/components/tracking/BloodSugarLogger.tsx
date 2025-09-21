import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

interface BloodSugarLoggerProps {
  onLog?: (reading: BloodSugarReading) => void;
}

interface BloodSugarReading {
  id: string;
  value: number;
  type: 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime';
  timestamp: Date;
  notes?: string;
}

const BloodSugarLogger: React.FC<BloodSugarLoggerProps> = ({ onLog }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [value, setValue] = useState('');
  const [selectedType, setSelectedType] = useState<BloodSugarReading['type']>('fasting');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const readingTypes = [
    { key: 'fasting', label: 'Fasting', description: 'Before eating (8+ hours)' },
    { key: 'pre-meal', label: 'Pre-meal', description: 'Before eating' },
    { key: 'post-meal', label: 'Post-meal', description: '2 hours after eating' },
    { key: 'bedtime', label: 'Bedtime', description: 'Before sleeping' },
  ] as const;

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!value.trim()) {
      newErrors.value = 'Blood sugar value is required';
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = 'Please enter a valid blood sugar value';
      } else if (numValue < 20 || numValue > 600) {
        newErrors.value = 'Value should be between 20-600 mg/dL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    const reading: BloodSugarReading = {
      id: Date.now().toString(),
      value: parseFloat(value),
      type: selectedType,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    };

    onLog?.(reading);
    
    // Reset form
    setValue('');
    setNotes('');
    setSelectedType('fasting');
    setErrors({});
    setIsVisible(false);

    Alert.alert('Success', 'Blood sugar reading logged successfully!');
  };

  const getReadingStatus = (value: number, type: BloodSugarReading['type']) => {
    let normal: [number, number];
    
    switch (type) {
      case 'fasting':
        normal = [70, 100];
        break;
      case 'pre-meal':
        normal = [70, 130];
        break;
      case 'post-meal':
        normal = [70, 180];
        break;
      case 'bedtime':
        normal = [100, 140];
        break;
      default:
        normal = [70, 140];
    }

    if (value < normal[0]) return { status: 'low', color: '#2196F3' };
    if (value > normal[1]) return { status: 'high', color: '#F44336' };
    return { status: 'normal', color: '#4CAF50' };
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🩸 Blood Sugar</Text>
          <Text style={styles.subtitle}>Log your glucose readings</Text>
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setIsVisible(true)}
        >
          <Text style={styles.logButtonText}>+ Log Reading</Text>
        </TouchableOpacity>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>Target Ranges (mg/dL):</Text>
          <Text style={styles.quickInfoItem}>• Fasting: 70-100</Text>
          <Text style={styles.quickInfoItem}>• Pre-meal: 70-130</Text>
          <Text style={styles.quickInfoItem}>• Post-meal: 70-180</Text>
        </View>
      </Card>

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title="Log Blood Sugar"
      >
        <View style={styles.modalContent}>
          <Input
            label="Blood Sugar (mg/dL)"
            value={value}
            onChangeText={setValue}
            placeholder="Enter value (e.g., 120)"
            keyboardType="numeric"
            error={errors.value}
          />

          <Text style={styles.typeLabel}>Reading Type</Text>
          <View style={styles.typeContainer}>
            {readingTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  selectedType === type.key && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedType(type.key)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === type.key && styles.typeButtonTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
                <Text
                  style={[
                    styles.typeDescription,
                    selectedType === type.key && styles.typeDescriptionSelected,
                  ]}
                >
                  {type.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {value && !errors.value && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Reading Preview:</Text>
              <View style={styles.previewReading}>
                <Text style={styles.previewValue}>{value} mg/dL</Text>
                <View
                  style={[
                    styles.previewStatus,
                    { backgroundColor: getReadingStatus(parseFloat(value), selectedType).color },
                  ]}
                >
                  <Text style={styles.previewStatusText}>
                    {getReadingStatus(parseFloat(value), selectedType).status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Input
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any relevant notes..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              onPress={() => setIsVisible(false)}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Save Reading"
              onPress={handleSave}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  logButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  quickInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  quickInfoItem: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  modalContent: {
    padding: 20,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 12,
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  typeButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  typeButtonTextSelected: {
    color: '#4CAF50',
  },
  typeDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  typeDescriptionSelected: {
    color: '#4CAF50',
  },
  previewContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  previewReading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  previewStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  previewStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default BloodSugarLogger;
