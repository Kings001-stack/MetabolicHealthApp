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

interface BloodSugarReading {
  id: string;
  value: number;
  type: string;
  timestamp: string;
  notes?: string;
}

interface BloodSugarLoggerProps {
  onLog: (reading: BloodSugarReading) => void;
  onEdit?: (reading: BloodSugarReading) => void;
  onDelete?: (id: string) => void;
}

const BloodSugarLogger: React.FC<BloodSugarLoggerProps> = ({ onLog, onEdit, onDelete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReading, setEditingReading] = useState<BloodSugarReading | null>(null);
  const [value, setValue] = useState('');
  const [selectedType, setSelectedType] = useState('fasting');
  const [notes, setNotes] = useState('');
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const readingTypes = [
    { key: 'fasting', label: 'Fasting', description: 'Before eating (8+ hours)' },
    { key: 'pre-meal', label: 'Pre-meal', description: 'Before eating' },
    { key: 'post-meal', label: 'Post-meal', description: '2 hours after eating' },
    { key: 'bedtime', label: 'Bedtime', description: 'Before sleep' },
  ];

  const validateInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!value.trim()) {
      newErrors.value = 'Blood sugar value is required';
    } else {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = 'Please enter a valid blood sugar value';
      } else if (numValue < 20) {
        newErrors.value = 'Blood sugar cannot be below 20 mg/dL (this is dangerously low)';
      } else if (numValue > 600) {
        newErrors.value = 'Blood sugar cannot exceed 600 mg/dL (this is dangerously high)';
      } else if (numValue > 400) {
        newErrors.value = 'Warning: Blood sugar above 400 mg/dL is critically high. Please seek medical attention.';
      } else if (numValue < 40) {
        newErrors.value = 'Critical: Blood sugar below 40 mg/dL requires immediate medical attention.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateInput()) return;

    if (isEditMode && editingReading) {
      // Update existing reading
      const updatedReading: BloodSugarReading = {
        ...editingReading,
        value: parseFloat(value),
        type: selectedType,
        notes: notes.trim() || undefined,
      };

      setReadings(readings.map(r => r.id === editingReading.id ? updatedReading : r));
      onEdit?.(updatedReading);
      Alert.alert('Success', `Blood sugar updated: ${value} mg/dL`);
    } else {
      // Create new reading
      const reading: BloodSugarReading = {
        id: Date.now().toString(),
        value: parseFloat(value),
        type: selectedType,
        timestamp: new Date().toISOString(),
        notes: notes.trim() || undefined,
      };

      setReadings([reading, ...readings]); // Add to beginning for newest first
      onLog(reading);
      Alert.alert('Success', `Blood sugar logged: ${value} mg/dL`);
    }

    // Reset form
    setValue('');
    setSelectedType('fasting');
    setNotes('');
    setErrors({});
    setIsVisible(false);
    setIsEditMode(false);
    setEditingReading(null);
  };

  const getBloodSugarStatus = (value: number, type: string) => {
    // Blood sugar ranges in mg/dL
    if (type === 'fasting') {
      if (value < 70) return { status: 'Low', color: '#FF5252', urgent: true };
      if (value <= 99) return { status: 'Normal', color: '#4CAF50', urgent: false };
      if (value <= 125) return { status: 'Prediabetes', color: '#FF9800', urgent: false };
      return { status: 'Diabetes', color: '#FF5252', urgent: true };
    } else if (type === 'post-meal') {
      if (value < 70) return { status: 'Low', color: '#FF5252', urgent: true };
      if (value <= 139) return { status: 'Normal', color: '#4CAF50', urgent: false };
      if (value <= 199) return { status: 'Prediabetes', color: '#FF9800', urgent: false };
      return { status: 'Diabetes', color: '#FF5252', urgent: true };
    } else {
      // General ranges for other types
      if (value < 70) return { status: 'Low', color: '#FF5252', urgent: true };
      if (value <= 140) return { status: 'Normal', color: '#4CAF50', urgent: false };
      if (value <= 180) return { status: 'Elevated', color: '#FF9800', urgent: false };
      return { status: 'High', color: '#FF5252', urgent: true };
    }
  };

  const getBloodSugarTrend = () => {
    if (readings.length < 2) return null;
    
    const recent = readings.slice(0, 2);
    const current = recent[0].value;
    const previous = recent[1].value;
    const diff = current - previous;
    
    if (Math.abs(diff) < 10) return { trend: 'stable', icon: '➡️', color: '#666666' };
    if (diff > 0) return { trend: 'increasing', icon: '📈', color: '#FF5252' };
    return { trend: 'decreasing', icon: '📉', color: '#4CAF50' };
  };

  const getAverageReading = () => {
    if (readings.length === 0) return null;
    
    const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
    const average = sum / readings.length;
    
    return {
      value: Math.round(average),
      status: getBloodSugarStatus(average, 'fasting') // Use fasting as general reference
    };
  };

  const getReadingStatus = (value: number, type: string) => {
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

    if (value < normal[0]) return { status: 'Low', color: '#2196F3' };
    if (value > normal[1]) return { status: 'High', color: '#F44336' };
    return { status: 'Normal', color: '#4CAF50' };
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

      {/* History Section */}
      <Card style={[styles.container, { marginTop: 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 Blood Sugar History</Text>
          <Text style={styles.subtitle}>Your glucose tracking progress</Text>
        </View>

        {readings.length === 0 ? (
          <View style={styles.noHistoryContainer}>
            <Text style={styles.noHistoryIcon}>📋</Text>
            <Text style={styles.noHistoryTitle}>No history yet</Text>
            <Text style={styles.noHistoryText}>
              Start logging your blood sugar readings to track your glucose levels
            </Text>
          </View>
        ) : (
          <>
            {/* Blood Sugar Analytics */}
            <View style={styles.analyticsContainer}>
              {/* Average Reading */}
              {(() => {
                const average = getAverageReading();
                return average ? (
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsLabel}>Average</Text>
                    <Text style={styles.analyticsValue}>{average.value} mg/dL</Text>
                    <View style={[
                      styles.analyticsStatus,
                      { backgroundColor: average.status.color }
                    ]}>
                      <Text style={styles.analyticsStatusText}>
                        {average.status.status}
                      </Text>
                    </View>
                  </View>
                ) : null;
              })()}

              {/* Recent Trend */}
              {readings.length >= 2 && (
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsLabel}>Trend</Text>
                  {(() => {
                    const trend = getBloodSugarTrend();
                    return trend ? (
                      <View style={styles.trendInfo}>
                        <Text style={[styles.trendIcon, { color: trend.color }]}>
                          {trend.icon}
                        </Text>
                        <Text style={[styles.trendText, { color: trend.color }]}>
                          {trend.trend}
                        </Text>
                      </View>
                    ) : null;
                  })()}
                </View>
              )}

              {/* Total Readings */}
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsLabel}>Readings</Text>
                <Text style={styles.analyticsValue}>{readings.length}</Text>
                <Text style={styles.analyticsSubtext}>logged</Text>
              </View>
            </View>

            <FlatList
              data={readings.slice(0, 10)} // Show last 10 readings
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyValue}>{item.value} mg/dL</Text>
                      <View style={[
                        styles.historyStatus,
                        { backgroundColor: getBloodSugarStatus(item.value, item.type).color }
                      ]}>
                        <Text style={styles.historyStatusText}>
                          {getBloodSugarStatus(item.value, item.type).status}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyType}>
                        {readingTypes.find(t => t.key === item.type)?.label || item.type}
                      </Text>
                      <Text style={styles.historyDetail}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                      {item.notes && (
                        <Text style={styles.historyNotes}>{item.notes}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        setEditingReading(item);
                        setValue(item.value.toString());
                        setSelectedType(item.type);
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
                          'Delete Blood Sugar Reading',
                          'Are you sure you want to delete this reading?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => {
                                setReadings(readings.filter(r => r.id !== item.id));
                                onDelete?.(item.id);
                                Alert.alert('Success', 'Reading deleted successfully');
                              }
                            }
                          ]
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
                {isEditMode ? 'Edit Blood Sugar' : 'Log Blood Sugar'}
              </Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Blood Sugar Value Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Blood Sugar (mg/dL)</Text>
                <TextInput
                  style={[styles.input, errors.value && styles.inputError]}
                  value={value}
                  onChangeText={setValue}
                  placeholder="Enter value (e.g., 120)"
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
                {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
              </View>

              {/* Reading Type Selection */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Reading Type</Text>
                <View style={styles.typeGrid}>
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
              </View>

              {/* Reading Preview */}
              {value && !errors.value && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>📊 Reading Preview</Text>
                  <View style={styles.previewContent}>
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
                  <Text style={styles.previewType}>Type: {readingTypes.find(t => t.key === selectedType)?.label}</Text>
                </View>
              )}

              {/* Notes Input */}
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

              {/* Action Buttons */}
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
                  <Text style={styles.saveButtonText}>Save Reading</Text>
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
  
  // Modal Styles
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
  
  // Input Styles
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
  formContainer: {
    flex: 1,
  },
  
  // Type Selection Styles
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
  
  // Preview Styles
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
  
  // Button Styles
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
  
  // History Section Styles
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
  
  // Analytics Styles
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'center',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  analyticsSubtext: {
    fontSize: 11,
    color: '#666666',
  },
  analyticsStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  analyticsStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // History Item Styles
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
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
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
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 12,
  },
});

export default BloodSugarLogger;