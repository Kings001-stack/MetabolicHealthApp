import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import Card from '@/components/common/Card';

interface WeightReading {
  id: string;
  weight: number;
  unit: string;
  timestamp: string;
  notes?: string;
}

interface WeightLoggerProps {
  onLog: (reading: WeightReading) => void;
  onEdit?: (reading: WeightReading) => void;
  onDelete?: (id: string) => void;
}

const WeightLogger: React.FC<WeightLoggerProps> = ({ onLog, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReading, setEditingReading] = useState<WeightReading | null>(null);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [readings, setReadings] = useState<WeightReading[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const weightUnits = [
    { key: 'kg', label: 'kg', description: 'Kilograms' },
    { key: 'lbs', label: 'lbs', description: 'Pounds' },
  ];

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else {
      const weightValue = parseFloat(weight);
      if (isNaN(weightValue)) {
        newErrors.weight = 'Please enter a valid number';
      } else if (weightValue <= 0) {
        newErrors.weight = 'Weight must be greater than zero';
      } else if (unit === 'kg' && weightValue > 300) {
        newErrors.weight = 'Warning: Weight above 300kg may not be realistic';
      } else if (unit === 'lbs' && weightValue > 660) {
        newErrors.weight = 'Warning: Weight above 660lbs may not be realistic';
      }
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
    } else {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        newErrors.date = 'Please enter a valid date (YYYY-MM-DD)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    if (isEditMode && editingReading) {
      const updatedReading: WeightReading = {
        ...editingReading,
        weight: parseFloat(weight),
        unit,
        timestamp: date,
        notes: notes.trim() || undefined,
      };

      setReadings(readings.map((r) => (r.id === editingReading.id ? updatedReading : r)));
      onEdit?.(updatedReading);
      Alert.alert('Success', `Weight updated: ${weight} ${unit}`);
    } else {
      const reading: WeightReading = {
        id: Date.now().toString(),
        weight: parseFloat(weight),
        unit,
        timestamp: date,
        notes: notes.trim() || undefined,
      };

      setReadings([reading, ...readings]);
      onLog(reading);
      Alert.alert('Success', `Weight logged: ${weight} ${unit}`);
    }

    setWeight('');
    setUnit('kg');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrors({});
    setIsVisible(false);
    setIsEditMode(false);
    setEditingReading(null);
  };

  const getWeightStatus = (currentWeight: number, unit: string) => {
    const weightInKg = unit === 'lbs' ? currentWeight * 0.453592 : currentWeight;
    if (weightInKg < 18.5 * 2.5) return { status: 'Underweight', color: '#FF9800' };
    if (weightInKg < 25 * 2.5) return { status: 'Normal', color: '#4CAF50' };
    if (weightInKg < 30 * 2.5) return { status: 'Overweight', color: '#FF9800' };
    return { status: 'Obese', color: '#FF5252' };
  };

  const getWeightTrend = () => {
    if (readings.length < 2) return null;
    const recent = readings.slice(0, 2);
    const current = recent[0].weight;
    const previous = recent[1].weight;
    const currentInKg = recent[0].unit === 'lbs' ? current * 0.453592 : current;
    const previousInKg = recent[1].unit === 'lbs' ? previous * 0.453592 : previous;
    const diff = currentInKg - previousInKg;
    if (Math.abs(diff) < 0.1) return { trend: 'stable', icon: '➡️', color: '#666666' };
    if (diff > 0) return { trend: 'increasing', icon: '📈', color: '#FF5252' };
    return { trend: 'decreasing', icon: '📉', color: '#4CAF50' };
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚖️ Weight</Text>
          <Text style={styles.subtitle}>Track your weight</Text>
        </View>

        <TouchableOpacity style={styles.logButton} onPress={() => setIsVisible(true)}>
          <Text style={styles.logButtonText}>+ Log Weight</Text>
        </TouchableOpacity>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>Tips:</Text>
          <Text style={styles.quickInfoItem}>• Weigh yourself at the same time daily</Text>
          <Text style={styles.quickInfoItem}>• Use a consistent scale</Text>
          <Text style={styles.quickInfoItem}>• Track trends over time</Text>
        </View>
      </Card>

      <Card style={styles.historyContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Weight History</Text>
          <Text style={styles.subtitle}>Your weight tracking progress</Text>
        </View>

        {readings.length === 0 ? (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryIcon}>📋</Text>
            <Text style={styles.noHistoryTitle}>No history yet</Text>
            <Text style={styles.noHistoryText}>
              Start logging your weight to see your progress and trends here
            </Text>
          </View>
        ) : (
          <>
            {readings.length >= 2 && (
              <View style={styles.trendContainer}>
                <Text style={styles.trendTitle}>Recent Trend</Text>
                {(() => {
                  const trend = getWeightTrend();
                  return trend ? (
                    <View style={styles.trendInfo}>
                      <Text style={[styles.trendIcon, { color: trend.color }]}>
                        {trend.icon}
                      </Text>
                      <Text style={[styles.trendText, { color: trend.color }]}>
                        Weight is {trend.trend}
                      </Text>
                    </View>
                  ) : null;
                })()}
              </View>
            )}

            <FlatList
              data={readings.slice(0, 10)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyValue}>
                        {item.weight} {item.unit}
                      </Text>
                      <View
                        style={[
                          styles.historyStatus,
                          { backgroundColor: getWeightStatus(item.weight, item.unit).color },
                        ]}
                      >
                        <Text style={styles.historyStatusText}>
                          {getWeightStatus(item.weight, item.unit).status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyDetail}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                      {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
                    </View>
                  </View>
                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        setEditingReading(item);
                        setWeight(item.weight.toString());
                        setUnit(item.unit);
                        setDate(item.timestamp.split('T')[0]);
                        setNotes(item.notes || '');
                        setIsEditMode(true);
                        setIsVisible(true);
                      }}
                    >
                      <Text style={styles.actionButtonText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        Alert.alert(
                          'Delete Weight Entry',
                          'Are you sure you want to delete this weight entry?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                setReadings(readings.filter((r) => r.id !== item.id));
                                onDelete?.(item.id);
                                Alert.alert('Success', 'Weight entry deleted successfully');
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.actionButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </Card>

      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Weight' : 'Log Weight'}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Weight</Text>
                <TextInput
                  style={[styles.input, errors.weight && styles.inputError]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter weight (e.g., 70)"
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.typeGrid}>
                  {weightUnits.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        unit === type.key && styles.typeButtonSelected,
                      ]}
                      onPress={() => setUnit(type.key)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          unit === type.key && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text
                        style={[
                          styles.typeDescription,
                          unit === type.key && styles.typeDescriptionSelected,
                        ]}
                      >
                        {type.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={[styles.input, errors.date && styles.inputError]}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999999"
                />
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>

              {weight && !errors.weight && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>📊 Weight Preview</Text>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewValue}>{weight} {unit}</Text>
                    <View
                      style={[
                        styles.previewStatus,
                        { backgroundColor: getWeightStatus(parseFloat(weight), unit).color },
                      ]}
                    >
                      <Text style={styles.previewStatusText}>
                        {getWeightStatus(parseFloat(weight), unit).status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.previewType}>Date: {date}</Text>
                </View>
              )}

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any relevant notes..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Update Weight' : 'Save Weight'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  historyContainer: {
    margin: 16,
    marginTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
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
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '92%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: 'bold',
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#333333',
  },
  inputError: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    gap: 12,
  },
  typeButton: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  typeButtonSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  typeButtonTextSelected: {
    color: '#2E7D32',
  },
  typeDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  typeDescriptionSelected: {
    color: '#4CAF50',
  },
  previewCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  previewStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  previewStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  previewType: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noHistoryIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  trendContainer: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyContent: {
    flex: 1,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyDetails: {
    marginTop: 4,
  },
  historyDetail: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  historyNotes: {
    fontSize: 13,
    color: '#333333',
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WeightLogger;
