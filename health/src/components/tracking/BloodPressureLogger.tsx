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

interface BloodPressureLoggerProps {
  onLog?: (reading: BloodPressureReading) => void;
}

interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: Date;
  notes?: string;
}

const BloodPressureLogger: React.FC<BloodPressureLoggerProps> = ({ onLog }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!systolic.trim()) {
      newErrors.systolic = 'Systolic pressure is required';
    } else {
      const sysValue = parseInt(systolic);
      if (isNaN(sysValue) || sysValue < 50 || sysValue > 250) {
        newErrors.systolic = 'Systolic should be between 50-250 mmHg';
      }
    }

    if (!diastolic.trim()) {
      newErrors.diastolic = 'Diastolic pressure is required';
    } else {
      const diaValue = parseInt(diastolic);
      if (isNaN(diaValue) || diaValue < 30 || diaValue > 150) {
        newErrors.diastolic = 'Diastolic should be between 30-150 mmHg';
      }
    }

    if (pulse.trim()) {
      const pulseValue = parseInt(pulse);
      if (isNaN(pulseValue) || pulseValue < 40 || pulseValue > 200) {
        newErrors.pulse = 'Pulse should be between 40-200 bpm';
      }
    }

    // Check if systolic is higher than diastolic
    if (!newErrors.systolic && !newErrors.diastolic) {
      const sysValue = parseInt(systolic);
      const diaValue = parseInt(diastolic);
      if (sysValue <= diaValue) {
        newErrors.systolic = 'Systolic must be higher than diastolic';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    const reading: BloodPressureReading = {
      id: Date.now().toString(),
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      pulse: pulse.trim() ? parseInt(pulse) : undefined,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    };

    onLog?.(reading);
    
    // Reset form
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    setErrors({});
    setIsVisible(false);

    Alert.alert('Success', 'Blood pressure reading logged successfully!');
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { category: 'Normal', color: '#4CAF50' };
    } else if (systolic < 130 && diastolic < 80) {
      return { category: 'Elevated', color: '#FF9800' };
    } else if (systolic < 140 || diastolic < 90) {
      return { category: 'Stage 1 High', color: '#FF5722' };
    } else if (systolic < 180 || diastolic < 120) {
      return { category: 'Stage 2 High', color: '#F44336' };
    } else {
      return { category: 'Crisis', color: '#9C27B0' };
    }
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>❤️ Blood Pressure</Text>
          <Text style={styles.subtitle}>Track your cardiovascular health</Text>
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setIsVisible(true)}
        >
          <Text style={styles.logButtonText}>+ Log Reading</Text>
        </TouchableOpacity>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>BP Categories (mmHg):</Text>
          <Text style={styles.quickInfoItem}>• Normal: &lt;120/80</Text>
          <Text style={styles.quickInfoItem}>• Elevated: 120-129/&lt;80</Text>
          <Text style={styles.quickInfoItem}>• Stage 1: 130-139/80-89</Text>
          <Text style={styles.quickInfoItem}>• Stage 2: ≥140/≥90</Text>
        </View>
      </Card>

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title="Log Blood Pressure"
      >
        <View style={styles.modalContent}>
          <View style={styles.bpInputContainer}>
            <View style={styles.bpInputRow}>
              <View style={styles.bpInputHalf}>
                <Input
                  label="Systolic (mmHg)"
                  value={systolic}
                  onChangeText={setSystolic}
                  placeholder="120"
                  keyboardType="numeric"
                  error={errors.systolic}
                />
              </View>
              <Text style={styles.bpSeparator}>/</Text>
              <View style={styles.bpInputHalf}>
                <Input
                  label="Diastolic (mmHg)"
                  value={diastolic}
                  onChangeText={setDiastolic}
                  placeholder="80"
                  keyboardType="numeric"
                  error={errors.diastolic}
                />
              </View>
            </View>
          </View>

          <Input
            label="Pulse (Optional)"
            value={pulse}
            onChangeText={setPulse}
            placeholder="Enter pulse rate (bpm)"
            keyboardType="numeric"
            error={errors.pulse}
          />

          {systolic && diastolic && !errors.systolic && !errors.diastolic && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Reading Preview:</Text>
              <View style={styles.previewReading}>
                <Text style={styles.previewValue}>
                  {systolic}/{diastolic} mmHg
                </Text>
                <View
                  style={[
                    styles.previewCategory,
                    { backgroundColor: getBPCategory(parseInt(systolic), parseInt(diastolic)).color },
                  ]}
                >
                  <Text style={styles.previewCategoryText}>
                    {getBPCategory(parseInt(systolic), parseInt(diastolic)).category}
                  </Text>
                </View>
              </View>
              {pulse && (
                <Text style={styles.previewPulse}>Pulse: {pulse} bpm</Text>
              )}
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
    backgroundColor: '#F44336',
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
  bpInputContainer: {
    marginBottom: 16,
  },
  bpInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bpInputHalf: {
    flex: 1,
  },
  bpSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 8,
    marginBottom: 8,
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
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  previewCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  previewCategoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  previewPulse: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
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

export default BloodPressureLogger;
