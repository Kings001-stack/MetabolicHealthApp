import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

interface MedicationLoggerProps {
  onLog?: (medication: MedicationLog) => void;
}

interface MedicationLog {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  timeTaken: Date;
  notes?: string;
  skipped?: boolean;
}

const MedicationLogger: React.FC<MedicationLoggerProps> = ({ onLog }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const commonMedications = [
    'Metformin', 'Insulin', 'Lisinopril', 'Atorvastatin', 'Amlodipine',
    'Losartan', 'Simvastatin', 'Glipizide', 'Hydrochlorothiazide', 'Aspirin'
  ];

  const dosageUnits = ['mg', 'g', 'ml', 'units', 'tablets', 'capsules'];
  const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly'];

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Medication name is required';
    }

    if (!dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    } else {
      const dosageValue = parseFloat(dosage);
      if (isNaN(dosageValue) || dosageValue <= 0) {
        newErrors.dosage = 'Please enter a valid dosage';
      }
    }

    if (!frequency.trim()) {
      newErrors.frequency = 'Frequency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    const medication: MedicationLog = {
      id: Date.now().toString(),
      name: name.trim(),
      dosage: dosage.trim(),
      unit,
      frequency: frequency.trim(),
      timeTaken: new Date(),
      notes: notes.trim() || undefined,
      skipped,
    };

    onLog?.(medication);
    
    // Reset form
    setName('');
    setDosage('');
    setUnit('mg');
    setFrequency('');
    setNotes('');
    setSkipped(false);
    setErrors({});
    setIsVisible(false);

    Alert.alert('Success', `Medication ${skipped ? 'skip' : 'intake'} logged successfully!`);
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💊 Medications</Text>
          <Text style={styles.subtitle}>Track your medication intake</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.logButton, styles.takenButton]}
            onPress={() => {
              setSkipped(false);
              setIsVisible(true);
            }}
          >
            <Text style={styles.logButtonText}>✓ Taken</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.logButton, styles.skippedButton]}
            onPress={() => {
              setSkipped(true);
              setIsVisible(true);
            }}
          >
            <Text style={styles.logButtonText}>⏭ Skipped</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>Medication Reminders:</Text>
          <Text style={styles.quickInfoItem}>• Take medications at the same time daily</Text>
          <Text style={styles.quickInfoItem}>• Don't skip doses without consulting doctor</Text>
          <Text style={styles.quickInfoItem}>• Monitor for side effects</Text>
        </View>
      </Card>

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title={skipped ? "Log Skipped Medication" : "Log Medication Taken"}
      >
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Input
            label="Medication Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter medication name"
            error={errors.name}
          />

          <Text style={styles.sectionLabel}>Common Medications:</Text>
          <View style={styles.medicationGrid}>
            {commonMedications.map((med) => (
              <TouchableOpacity
                key={med}
                style={[
                  styles.medicationChip,
                  name === med && styles.medicationChipSelected,
                ]}
                onPress={() => setName(med)}
              >
                <Text
                  style={[
                    styles.medicationChipText,
                    name === med && styles.medicationChipTextSelected,
                  ]}
                >
                  {med}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.dosageContainer}>
            <View style={styles.dosageInput}>
              <Input
                label="Dosage"
                value={dosage}
                onChangeText={setDosage}
                placeholder="10"
                keyboardType="numeric"
                error={errors.dosage}
              />
            </View>
            <View style={styles.unitSelector}>
              <Text style={styles.unitLabel}>Unit</Text>
              <View style={styles.unitDropdown}>
                {dosageUnits.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.unitOption,
                      unit === u && styles.unitOptionSelected,
                    ]}
                    onPress={() => setUnit(u)}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unit === u && styles.unitOptionTextSelected,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Frequency:</Text>
          <View style={styles.frequencyContainer}>
            {frequencies.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyOption,
                  frequency === freq && styles.frequencyOptionSelected,
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    frequency === freq && styles.frequencyOptionTextSelected,
                  ]}
                >
                  {freq}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Custom Frequency"
            value={frequency}
            onChangeText={setFrequency}
            placeholder="e.g., Every 8 hours"
            error={errors.frequency}
          />

          {name && dosage && !errors.name && !errors.dosage && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>
                {skipped ? 'Skipped Medication:' : 'Medication Taken:'}
              </Text>
              <View style={styles.previewMedication}>
                <Text style={styles.previewName}>{name}</Text>
                <Text style={styles.previewDosage}>{dosage} {unit}</Text>
                <Text style={styles.previewFrequency}>{frequency}</Text>
              </View>
              <Text style={styles.previewTime}>
                Time: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          )}

          <Input
            label="Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder={skipped ? "Reason for skipping..." : "Any side effects or notes..."}
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
              title={skipped ? "Log Skip" : "Log Taken"}
              onPress={handleSave}
              variant="primary"
              style={skipped ? StyleSheet.flatten([styles.saveButton, styles.skipButton]) : styles.saveButton}
            />
          </View>
        </ScrollView>
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
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  logButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  skippedButton: {
    backgroundColor: '#FF9800',
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
    maxHeight: 600,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 12,
  },
  medicationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  medicationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    margin: 4,
  },
  medicationChipSelected: {
    backgroundColor: '#4CAF50',
  },
  medicationChipText: {
    fontSize: 12,
    color: '#333333',
  },
  medicationChipTextSelected: {
    color: '#FFFFFF',
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  dosageInput: {
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
  unitDropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    maxHeight: 120,
  },
  unitOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unitOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  unitOptionTextSelected: {
    color: '#FFFFFF',
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  frequencyOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  frequencyOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  frequencyOptionTextSelected: {
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
  previewMedication: {
    marginBottom: 4,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  previewDosage: {
    fontSize: 14,
    color: '#666666',
  },
  previewFrequency: {
    fontSize: 12,
    color: '#666666',
  },
  previewTime: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
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
  skipButton: {
    backgroundColor: '#FF9800',
  },
});

export default MedicationLogger;
