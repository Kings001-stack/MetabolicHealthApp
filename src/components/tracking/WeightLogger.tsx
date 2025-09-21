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

interface WeightLoggerProps {
  onLog?: (reading: WeightReading) => void;
}

interface WeightReading {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  bodyFat?: number;
  muscleMass?: number;
  timestamp: Date;
  notes?: string;
}

const WeightLogger: React.FC<WeightLoggerProps> = ({ onLog }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else {
      const weightValue = parseFloat(weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        newErrors.weight = 'Please enter a valid weight';
      } else {
        const minWeight = unit === 'kg' ? 20 : 44;
        const maxWeight = unit === 'kg' ? 300 : 660;
        if (weightValue < minWeight || weightValue > maxWeight) {
          newErrors.weight = `Weight should be between ${minWeight}-${maxWeight} ${unit}`;
        }
      }
    }

    if (bodyFat.trim()) {
      const bfValue = parseFloat(bodyFat);
      if (isNaN(bfValue) || bfValue < 3 || bfValue > 50) {
        newErrors.bodyFat = 'Body fat should be between 3-50%';
      }
    }

    if (muscleMass.trim()) {
      const mmValue = parseFloat(muscleMass);
      if (isNaN(mmValue) || mmValue <= 0) {
        newErrors.muscleMass = 'Please enter a valid muscle mass';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    const reading: WeightReading = {
      id: Date.now().toString(),
      weight: parseFloat(weight),
      unit,
      bodyFat: bodyFat.trim() ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass.trim() ? parseFloat(muscleMass) : undefined,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    };

    onLog?.(reading);
    
    // Reset form
    setWeight('');
    setBodyFat('');
    setMuscleMass('');
    setNotes('');
    setErrors({});
    setIsVisible(false);

    Alert.alert('Success', 'Weight reading logged successfully!');
  };

  const getBMICategory = (weight: number, height: number = 170) => {
    // Using average height for estimation if not provided
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    
    if (bmi < 18.5) return { category: 'Underweight', color: '#2196F3' };
    if (bmi < 25) return { category: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { category: 'Overweight', color: '#FF9800' };
    return { category: 'Obese', color: '#F44336' };
  };

  const convertWeight = (value: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs') => {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'kg' && toUnit === 'lbs') return value * 2.20462;
    if (fromUnit === 'lbs' && toUnit === 'kg') return value / 2.20462;
    return value;
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚖️ Weight</Text>
          <Text style={styles.subtitle}>Track your weight and body composition</Text>
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setIsVisible(true)}
        >
          <Text style={styles.logButtonText}>+ Log Weight</Text>
        </TouchableOpacity>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>BMI Categories:</Text>
          <Text style={styles.quickInfoItem}>• Underweight: &lt;18.5</Text>
          <Text style={styles.quickInfoItem}>• Normal: 18.5-24.9</Text>
          <Text style={styles.quickInfoItem}>• Overweight: 25-29.9</Text>
          <Text style={styles.quickInfoItem}>• Obese: ≥30</Text>
        </View>
      </Card>

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title="Log Weight"
      >
        <View style={styles.modalContent}>
          <View style={styles.weightInputContainer}>
            <View style={styles.weightInputRow}>
              <View style={styles.weightInput}>
                <Input
                  label="Weight"
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={unit === 'kg' ? '70.5' : '155.3'}
                  keyboardType="numeric"
                  error={errors.weight}
                />
              </View>
              <View style={styles.unitSelector}>
                <Text style={styles.unitLabel}>Unit</Text>
                <View style={styles.unitButtons}>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      unit === 'kg' && styles.unitButtonSelected,
                    ]}
                    onPress={() => setUnit('kg')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        unit === 'kg' && styles.unitButtonTextSelected,
                      ]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.unitButton,
                      unit === 'lbs' && styles.unitButtonSelected,
                    ]}
                    onPress={() => setUnit('lbs')}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        unit === 'lbs' && styles.unitButtonTextSelected,
                      ]}
                    >
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <Input
            label="Body Fat % (Optional)"
            value={bodyFat}
            onChangeText={setBodyFat}
            placeholder="Enter body fat percentage"
            keyboardType="numeric"
            error={errors.bodyFat}
          />

          <Input
            label={`Muscle Mass (${unit}) (Optional)`}
            value={muscleMass}
            onChangeText={setMuscleMass}
            placeholder="Enter muscle mass"
            keyboardType="numeric"
            error={errors.muscleMass}
          />

          {weight && !errors.weight && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Reading Preview:</Text>
              <View style={styles.previewReading}>
                <Text style={styles.previewValue}>
                  {weight} {unit}
                </Text>
                <Text style={styles.previewConversion}>
                  ({unit === 'kg' 
                    ? `${convertWeight(parseFloat(weight), 'kg', 'lbs').toFixed(1)} lbs`
                    : `${convertWeight(parseFloat(weight), 'lbs', 'kg').toFixed(1)} kg`
                  })
                </Text>
              </View>
              {bodyFat && (
                <Text style={styles.previewDetail}>Body Fat: {bodyFat}%</Text>
              )}
              {muscleMass && (
                <Text style={styles.previewDetail}>Muscle Mass: {muscleMass} {unit}</Text>
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
              title="Save Weight"
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
    backgroundColor: '#9C27B0',
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
  weightInputContainer: {
    marginBottom: 16,
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  weightInput: {
    flex: 1,
    marginRight: 12,
  },
  unitSelector: {
    width: 80,
  },
  unitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  unitButtons: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  unitButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  unitButtonTextSelected: {
    color: '#FFFFFF',
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
  previewConversion: {
    fontSize: 14,
    color: '#666666',
  },
  previewDetail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
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

export default WeightLogger;
