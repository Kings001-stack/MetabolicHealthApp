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
import DateTimePicker from '@react-native-community/datetimepicker';
import Card from '@/components/common/Card';
import HealthDataService, { BloodPressureReading } from '@/services/HealthDataService';

interface BloodPressureLoggerProps {
  onLog: (reading: BloodPressureReading) => void;
  onEdit?: (reading: BloodPressureReading) => void;
  onDelete?: (id: string) => void;
}

const BloodPressureLogger: React.FC<BloodPressureLoggerProps> = ({ onLog, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReading, setEditingReading] = useState<BloodPressureReading | null>(null);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [logStreak, setLogStreak] = useState(0);

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      setIsLoading(true);
      const dbReadings = await HealthDataService.getBloodPressureReadings(10);
      setReadings(dbReadings);

      // Calculate streak
      if (dbReadings.length > 0) {
        const sortedReadings = dbReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        let streak = 1;
        let prevDate = new Date(sortedReadings[0].timestamp).toISOString().split('T')[0];
        for (let i = 1; i < sortedReadings.length; i++) {
          const currDate = new Date(sortedReadings[i].timestamp).toISOString().split('T')[0];
          const diffDays = (new Date(prevDate).getTime() - new Date(currDate).getTime()) / (1000 * 3600 * 24);
          if (diffDays === 1) {
            streak++;
          } else if (diffDays > 1) {
            break;
          }
          prevDate = currDate;
        }
        setLogStreak(streak);
        if (streak >= 7) {
          Alert.alert('🎉 Achievement Unlocked', '7-day blood pressure log streak!');
        }
      }
    } catch (error) {
      console.error('Failed to load blood pressure readings:', error);
      Alert.alert('Error', 'Failed to load your blood pressure history');
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!systolic.trim()) {
      newErrors.systolic = 'Systolic pressure is required';
    } else {
      const sysValue = parseInt(systolic);
      if (isNaN(sysValue)) {
        newErrors.systolic = 'Please enter a valid number';
      } else if (sysValue < 60) {
        newErrors.systolic = 'Systolic pressure cannot be below 60 mmHg (critically low)';
      } else if (sysValue > 300) {
        newErrors.systolic = 'Systolic pressure cannot exceed 300 mmHg (critically high)';
      } else if (sysValue > 250) {
        newErrors.systolic = 'Warning: Systolic above 250 mmHg requires immediate medical attention';
      } else if (sysValue < 90) {
        newErrors.systolic = 'Warning: Systolic below 90 mmHg may indicate hypotension';
      }
    }

    if (!diastolic.trim()) {
      newErrors.diastolic = 'Diastolic pressure is required';
    } else {
      const diaValue = parseInt(diastolic);
      if (isNaN(diaValue)) {
        newErrors.diastolic = 'Please enter a valid number';
      } else if (diaValue < 40) {
        newErrors.diastolic = 'Diastolic pressure cannot be below 40 mmHg (critically low)';
      } else if (diaValue > 200) {
        newErrors.diastolic = 'Diastolic pressure cannot exceed 200 mmHg (critically high)';
      } else if (diaValue > 150) {
        newErrors.diastolic = 'Warning: Diastolic above 150 mmHg requires immediate medical attention';
      } else if (diaValue < 60) {
        newErrors.diastolic = 'Warning: Diastolic below 60 mmHg may indicate hypotension';
      }
    }

    if (heartRate.trim()) {
      const heartRateValue = parseInt(heartRate);
      if (isNaN(heartRateValue)) {
        newErrors.heartRate = 'Please enter a valid number';
      } else if (heartRateValue < 30) {
        newErrors.heartRate = 'Pulse rate cannot be below 30 bpm (critically low)';
      } else if (heartRateValue > 300) {
        newErrors.heartRate = 'Pulse rate cannot exceed 300 bpm (critically high)';
      } else if (heartRateValue > 200) {
        newErrors.heartRate = 'Warning: Pulse rate above 200 bpm requires medical attention';
      } else if (heartRateValue < 50) {
        newErrors.heartRate = 'Warning: Pulse rate below 50 bpm may indicate bradycardia';
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

    if (!newErrors.systolic && !newErrors.diastolic) {
      const sysValue = parseInt(systolic);
      const diaValue = parseInt(diastolic);
      if (sysValue <= diaValue) {
        newErrors.systolic = 'Systolic pressure must be higher than diastolic pressure';
      } else if (sysValue - diaValue < 20) {
        newErrors.systolic = 'The difference between systolic and diastolic should be at least 20 mmHg';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateStreak = (newReadingDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const lastReadingDate = readings[0]?.timestamp.split('T')[0];
    if (lastReadingDate) {
      const lastDate = new Date(lastReadingDate);
      const newDate = new Date(newReadingDate);
      const diffDays = (newDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays === 1 || (diffDays === 0 && newReadingDate === today)) {
        setLogStreak(logStreak + 1);
        if (logStreak + 1 >= 7) {
          Alert.alert('🎉 Achievement Unlocked', '7-day blood pressure log streak!');
        }
      } else if (diffDays > 1) {
        setLogStreak(1);
      }
    } else {
      setLogStreak(1);
    }
  };

  const handleSave = async () => {
    if (!validateInput()) return;

    try {
      const reading: BloodPressureReading = {
        id: isEditMode && editingReading ? editingReading.id : Date.now().toString(),
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        heart_rate: heartRate.trim() ? parseInt(heartRate) : undefined,
        timestamp: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
      };

      if (isEditMode && editingReading) {
        await HealthDataService.updateBloodPressureReading(reading);
        setReadings(readings.map((r) => (r.id === editingReading.id ? reading : r)));
        onEdit?.(reading);
      } else {
        await HealthDataService.saveBloodPressureReading(reading);
        setReadings([reading, ...readings]);
        updateStreak(date);
        onLog(reading);
      }

      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrors({});
      setIsVisible(false);
      setIsEditMode(false);
      setEditingReading(null);
    } catch (error) {
      console.error('Failed to save blood pressure reading:', error);
      Alert.alert('Error', 'Failed to save blood pressure reading. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await HealthDataService.deleteBloodPressureReading(id);
      setReadings(readings.filter((r) => r.id !== id));
      onDelete?.(id);
      Alert.alert('Success', 'Reading deleted successfully');
    } catch (error) {
      console.error('Failed to delete blood pressure reading:', error);
      Alert.alert('Error', 'Failed to delete reading. Please try again.');
    }
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
          <Text style={styles.subtitle}>
            Track your cardiovascular health {logStreak > 0 ? `(Streak: ${logStreak} days)` : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.logButton} onPress={() => setIsVisible(true)}>
          <Text style={styles.logButtonText}>+ Log Reading</Text>
        </TouchableOpacity>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>BP Categories (mmHg):</Text>
          <Text style={styles.quickInfoItem}>• Normal: &lt;120/80</Text>
          <Text style={styles.quickInfoItem}>• Elevated: 120-129/&lt;80</Text>
          <Text style={styles.quickInfoItem}>• Stage 1: 130-139/80-89</Text>
          <Text style={styles.quickInfoItem}>• Stage 2: ≥140/≥90</Text>
          <Text style={styles.quickInfoItem}>• Crisis: ≥180/≥120</Text>
        </View>
      </Card>

      <Card style={styles.historyContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Recent Readings</Text>
          <Text style={styles.subtitle}>
            Your blood pressure history {logStreak > 0 ? `(Streak: ${logStreak} days)` : ''}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryText}>Loading...</Text>
          </View>
        ) : readings.length === 0 ? (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryIcon}>📋</Text>
            <Text style={styles.noHistoryTitle}>No history yet</Text>
            <Text style={styles.noHistoryText}>
              Start logging your blood pressure readings to see your history here
            </Text>
          </View>
        ) : (
          readings.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyContent}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyValue}>
                    {item.systolic}/{item.diastolic} mmHg
                  </Text>
                  <View
                    style={[
                      styles.historyCategory,
                      { backgroundColor: getBPCategory(item.systolic, item.diastolic).color },
                    ]}
                  >
                    <Text style={styles.historyCategoryText}>
                      {getBPCategory(item.systolic, item.diastolic).category}
                    </Text>
                  </View>
                </View>
                <View style={styles.historyDetails}>
                  {item.heart_rate && (
                    <Text style={styles.historyDetail}>Pulse: {item.heart_rate} bpm</Text>
                  )}
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
                    setSystolic(item.systolic.toString());
                    setDiastolic(item.diastolic.toString());
                    setHeartRate(item.heart_rate?.toString() || '');
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
                      'Delete Reading',
                      'Are you sure you want to delete this blood pressure reading?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDelete(item.id),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
                {isEditMode ? 'Edit Blood Pressure' : 'Log Blood Pressure'}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Blood Pressure (mmHg)</Text>
                <View style={styles.bpInputRow}>
                  <View style={styles.bpInputHalf}>
                    <TextInput
                      style={[styles.input, errors.systolic && styles.inputError]}
                      value={systolic}
                      onChangeText={setSystolic}
                      placeholder="Systolic (e.g., 120)"
                      keyboardType="numeric"
                      placeholderTextColor="#999999"
                    />
                    {errors.systolic && <Text style={styles.errorText}>{errors.systolic}</Text>}
                  </View>
                  <Text style={styles.bpSeparator}>/</Text>
                  <View style={styles.bpInputHalf}>
                    <TextInput
                      style={[styles.input, errors.diastolic && styles.inputError]}
                      value={diastolic}
                      onChangeText={setDiastolic}
                      placeholder="Diastolic (e.g., 80)"
                      keyboardType="numeric"
                      placeholderTextColor="#999999"
                    />
                    {errors.diastolic && <Text style={styles.errorText}>{errors.diastolic}</Text>}
                  </View>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Pulse (Optional, bpm)</Text>
                <TextInput
                  style={[styles.input, errors.heartRate && styles.inputError]}
                  value={heartRate}
                  onChangeText={setHeartRate}
                  placeholder="Enter pulse rate (e.g., 70)"
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
                {errors.heartRate && <Text style={styles.errorText}>{errors.heartRate}</Text>}
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity
                  style={[styles.input, errors.date && styles.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.inputText}>{date || 'Select date'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date ? new Date(date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDate(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>

              {systolic && diastolic && !errors.systolic && !errors.diastolic && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>📊 Reading Preview</Text>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewValue}>{systolic}/{diastolic} mmHg</Text>
                    <View
                      style={[
                        styles.previewStatus,
                        { backgroundColor: getBPCategory(parseInt(systolic), parseInt(diastolic)).color },
                      ]}
                    >
                      <Text style={styles.previewStatusText}>
                        {getBPCategory(parseInt(systolic), parseInt(diastolic)).category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {heartRate && <Text style={styles.previewType}>Pulse: {heartRate} bpm</Text>}
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
                  onPress={() => {
                    setIsVisible(false);
                    setIsEditMode(false);
                    setEditingReading(null);
                    setSystolic('');
                    setDiastolic('');
                    setHeartRate('');
                    setDate(new Date().toISOString().split('T')[0]);
                    setNotes('');
                    setErrors({});
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Update Reading' : 'Save Reading'}
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
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Bold',
  },
  quickInfoItem: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Regular',
  },
  inputText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Regular',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
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
    marginBottom: 12,
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Bold',
  },
  previewType: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Bold',
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
  },
  historyCategory: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  historyDetails: {
    marginTop: 4,
  },
  historyDetail: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
    fontFamily: 'Inter-Regular',
  },
  historyNotes: {
    fontSize: 13,
    color: '#333333',
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-Bold',
  },
});

export default BloodPressureLogger;
