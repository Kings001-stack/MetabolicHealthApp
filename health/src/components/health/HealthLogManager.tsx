import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleModal from '@/components/common/SimpleModal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

interface HealthLog {
  id: string;
  type: 'blood_pressure' | 'blood_sugar' | 'weight' | 'medication';
  value: string;
  timestamp: Date;
  notes?: string;
  // Type-specific fields
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  unit?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  skipped?: boolean;
}

interface HealthLogManagerProps {
  logs: HealthLog[];
  onEdit: (log: HealthLog) => Promise<void>;
  onDelete: (logId: string) => Promise<void>;
  onRefresh: () => void;
}

const HealthLogManager: React.FC<HealthLogManagerProps> = ({
  logs,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [selectedLog, setSelectedLog] = useState<HealthLog | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<HealthLog>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'blood_pressure': return '❤️';
      case 'blood_sugar': return '🩸';
      case 'weight': return '⚖️';
      case 'medication': return '💊';
      default: return '📊';
    }
  };

  const getLogTitle = (type: string) => {
    switch (type) {
      case 'blood_pressure': return 'Blood Pressure';
      case 'blood_sugar': return 'Blood Sugar';
      case 'weight': return 'Weight';
      case 'medication': return 'Medication';
      default: return 'Health Log';
    }
  };

  const formatLogValue = (log: HealthLog) => {
    switch (log.type) {
      case 'blood_pressure':
        return `${log.systolic}/${log.diastolic} mmHg${log.pulse ? ` (${log.pulse} bpm)` : ''}`;
      case 'blood_sugar':
        return `${log.value} mg/dL`;
      case 'weight':
        return `${log.value} ${log.unit || 'kg'}`;
      case 'medication':
        return `${log.name} - ${log.dosage} ${log.unit}${log.skipped ? ' (Skipped)' : ''}`;
      default:
        return log.value;
    }
  };

  const handleEdit = (log: HealthLog) => {
    setSelectedLog(log);
    setEditFormData({ ...log });
    setIsEditModalVisible(true);
    setErrors({});
  };

  const handleDelete = (log: HealthLog) => {
    Alert.alert(
      'Delete Log Entry',
      `Are you sure you want to delete this ${getLogTitle(log.type).toLowerCase()} reading?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(log.id);
              Alert.alert('Success', 'Log entry deleted successfully');
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete log entry');
            }
          },
        },
      ]
    );
  };

  const validateEditForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedLog) return false;

    switch (selectedLog.type) {
      case 'blood_pressure':
        if (!editFormData.systolic || editFormData.systolic < 60 || editFormData.systolic > 300) {
          newErrors.systolic = 'Systolic must be between 60-300 mmHg';
        }
        if (!editFormData.diastolic || editFormData.diastolic < 40 || editFormData.diastolic > 200) {
          newErrors.diastolic = 'Diastolic must be between 40-200 mmHg';
        }
        if (editFormData.pulse && (editFormData.pulse < 30 || editFormData.pulse > 300)) {
          newErrors.pulse = 'Pulse must be between 30-300 bpm';
        }
        break;

      case 'blood_sugar':
        const bsValue = parseFloat(editFormData.value || '0');
        if (!editFormData.value || bsValue < 20 || bsValue > 600) {
          newErrors.value = 'Blood sugar must be between 20-600 mg/dL';
        }
        break;

      case 'weight':
        const weightValue = parseFloat(editFormData.value || '0');
        if (!editFormData.value || weightValue <= 0) {
          newErrors.value = 'Weight must be greater than zero';
        }
        break;

      case 'medication':
        if (!editFormData.name?.trim()) {
          newErrors.name = 'Medication name is required';
        }
        if (!editFormData.dosage?.trim()) {
          newErrors.dosage = 'Dosage is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!selectedLog || !validateEditForm()) return;

    try {
      const updatedLog: HealthLog = {
        ...selectedLog,
        ...editFormData,
        timestamp: new Date(), // Update timestamp
      };

      await onEdit(updatedLog);
      setIsEditModalVisible(false);
      setSelectedLog(null);
      setEditFormData({});
      Alert.alert('Success', 'Log entry updated successfully');
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to update log entry');
    }
  };

  const renderEditForm = () => {
    if (!selectedLog) return null;

    switch (selectedLog.type) {
      case 'blood_pressure':
        return (
          <View>
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Input
                  label="Systolic (mmHg)"
                  value={editFormData.systolic?.toString() || ''}
                  onChangeText={(text) => setEditFormData({ ...editFormData, systolic: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  error={errors.systolic}
                />
              </View>
              <View style={styles.inputHalf}>
                <Input
                  label="Diastolic (mmHg)"
                  value={editFormData.diastolic?.toString() || ''}
                  onChangeText={(text) => setEditFormData({ ...editFormData, diastolic: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  error={errors.diastolic}
                />
              </View>
            </View>
            <Input
              label="Pulse (Optional)"
              value={editFormData.pulse?.toString() || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, pulse: parseInt(text) || undefined })}
              keyboardType="numeric"
              error={errors.pulse}
            />
          </View>
        );

      case 'blood_sugar':
        return (
          <Input
            label="Blood Sugar (mg/dL)"
            value={editFormData.value || ''}
            onChangeText={(text) => setEditFormData({ ...editFormData, value: text })}
            keyboardType="numeric"
            error={errors.value}
          />
        );

      case 'weight':
        return (
          <View>
            <Input
              label={`Weight (${editFormData.unit || 'kg'})`}
              value={editFormData.value || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, value: text })}
              keyboardType="numeric"
              error={errors.value}
            />
          </View>
        );

      case 'medication':
        return (
          <View>
            <Input
              label="Medication Name"
              value={editFormData.name || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
              error={errors.name}
            />
            <Input
              label="Dosage"
              value={editFormData.dosage || ''}
              onChangeText={(text) => setEditFormData({ ...editFormData, dosage: text })}
              error={errors.dosage}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Log History</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logsList}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No health logs found</Text>
            <Text style={styles.emptySubtext}>Start logging your health metrics to see them here</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logContent}>
                <View style={styles.logLeft}>
                  <Text style={styles.logIcon}>{getLogIcon(log.type)}</Text>
                  <View style={styles.logDetails}>
                    <Text style={styles.logTitle}>{getLogTitle(log.type)}</Text>
                    <Text style={styles.logValue}>{formatLogValue(log)}</Text>
                    <Text style={styles.logDate}>{formatDate(log.timestamp)}</Text>
                    {log.notes && (
                      <Text style={styles.logNotes}>Notes: {log.notes}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.logActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEdit(log)}
                  >
                    <Ionicons name="pencil" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(log)}
                  >
                    <Ionicons name="trash" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <SimpleModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setSelectedLog(null);
          setEditFormData({});
          setErrors({});
        }}
        title={`Edit ${selectedLog ? getLogTitle(selectedLog.type) : ''}`}
      >
        <ScrollView style={styles.editForm}>
          {renderEditForm()}
          
          <Input
            label="Notes (Optional)"
            value={editFormData.notes || ''}
            onChangeText={(text) => setEditFormData({ ...editFormData, notes: text })}
            multiline
            numberOfLines={3}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={() => {
                setIsEditModalVisible(false);
                setSelectedLog(null);
                setEditFormData({});
                setErrors({});
              }}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSaveEdit}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </SimpleModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  refreshButton: {
    padding: 8,
  },
  logsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  logLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  logIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  logValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  logNotes: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  logActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  editForm: {
    maxHeight: 500,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default HealthLogManager;
