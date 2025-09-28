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
  Switch,
  Animated,
} from 'react-native';
import Card from '@/components/common/Card';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  schedule: string[]; // e.g., ['08:00', '14:00', '20:00']
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  doctor?: string;
  pharmacy?: string;
  refills?: number;
}

interface MedicationLog {
  medicationId: string;
  taken: boolean;
  timestamp: string; // ISO date string
  notes?: string;
}

interface MedicationLoggerProps {
  onLog: (data: MedicationLog) => void;
  onAddMedication: (medication: Medication) => void;
}

const MedicationLogger: React.FC<MedicationLoggerProps> = ({ onLog, onAddMedication }) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLogModalVisible, setIsLogModalVisible] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    unit: 'mg',
    frequency: '',
    schedule: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    doctor: '',
    pharmacy: '',
    refills: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState({ taken: 0, total: 0, adherence: 0 });
  const pulseAnimation = new Animated.Value(1);

  const dosageUnits = ['mg', 'g', 'ml', 'units', 'tablets', 'capsules'];
  const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed', 'Weekly'];

  // Smart Timer and Adherence Tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      calculateTodayStats();
    }, 60000); // Update every minute

    // Pulse animation for overdue medications
    const pulseTimer = setInterval(() => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(pulseTimer);
    };
  }, [logs, medications]);

  const calculateTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.timestamp.startsWith(today));
    
    let totalDosesToday = 0;
    medications.forEach(med => {
      totalDosesToday += med.schedule.length;
    });

    const takenToday = todayLogs.filter(log => log.taken).length;
    const adherence = totalDosesToday > 0 ? Math.round((takenToday / totalDosesToday) * 100) : 0;

    setTodayStats({
      taken: takenToday,
      total: totalDosesToday,
      adherence
    });
  };

  const getNextDoseInfo = (medication: Medication) => {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Find next scheduled time
    const nextTime = medication.schedule.find(time => time > currentTimeStr) || medication.schedule[0];
    
    if (nextTime) {
      const [hours, minutes] = nextTime.split(':').map(Number);
      const nextDose = new Date();
      nextDose.setHours(hours, minutes, 0, 0);
      
      // If next dose is tomorrow
      if (nextTime <= currentTimeStr) {
        nextDose.setDate(nextDose.getDate() + 1);
      }
      
      const timeDiff = nextDose.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        nextTime,
        hoursLeft,
        minutesLeft,
        isOverdue: timeDiff < 0,
        isUpcoming: timeDiff > 0 && timeDiff <= 30 * 60 * 1000 // 30 minutes
      };
    }
    
    return null;
  };

  const getMedicationStatus = (medication: Medication) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => 
      log.medicationId === medication.id && 
      log.timestamp.startsWith(today)
    );
    
    const scheduledDoses = medication.schedule.length;
    const takenDoses = todayLogs.filter(log => log.taken).length;
    const skippedDoses = todayLogs.filter(log => !log.taken).length;
    
    return {
      scheduledDoses,
      takenDoses,
      skippedDoses,
      remainingDoses: scheduledDoses - takenDoses - skippedDoses,
      adherenceToday: scheduledDoses > 0 ? Math.round((takenDoses / scheduledDoses) * 100) : 0
    };
  };

  const getSmartSuggestion = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 6 && hour < 10) return "Good morning! Time for your morning medications.";
    if (hour >= 12 && hour < 14) return "Lunch time! Don't forget your afternoon doses.";
    if (hour >= 18 && hour < 22) return "Evening reminder: Check your medication schedule.";
    if (hour >= 22 || hour < 6) return "Before bed: Any evening medications to take?";
    
    return "Stay on track with your medication schedule!";
  };

  const validateMedicationInput = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!newMedication.name.trim()) {
      newErrors.name = 'Medication name is required';
    } else if (newMedication.name.trim().length < 2) {
      newErrors.name = 'Medication name must be at least 2 characters';
    }

    if (!newMedication.dosage.trim()) {
      newErrors.dosage = 'Dosage is required';
    } else {
      const dosageValue = parseFloat(newMedication.dosage);
      if (isNaN(dosageValue)) {
        newErrors.dosage = 'Please enter a valid number';
      } else if (dosageValue <= 0) {
        newErrors.dosage = 'Dosage must be greater than zero';
      } else if (newMedication.unit === 'mg' && dosageValue > 5000) {
        newErrors.dosage = 'Warning: Dosage above 5000mg may not be realistic';
      } else if (newMedication.unit === 'g' && dosageValue > 10) {
        newErrors.dosage = 'Warning: Dosage above 10g may not be realistic';
      } else if (newMedication.unit === 'ml' && dosageValue > 100) {
        newErrors.dosage = 'Warning: Dosage above 100ml may not be realistic';
      } else if (newMedication.unit === 'units' && dosageValue > 200) {
        newErrors.dosage = 'Warning: Insulin dosage above 200 units may not be realistic';
      }
    }

    if (!newMedication.frequency.trim()) {
      newErrors.frequency = 'Frequency is required';
    }

    if (!newMedication.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    } else {
      const parsedDate = new Date(newMedication.startDate);
      if (isNaN(parsedDate.getTime())) {
        newErrors.startDate = 'Please enter a valid date (YYYY-MM-DD)';
      }
    }

    if (newMedication.endDate.trim()) {
      const parsedEndDate = new Date(newMedication.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        newErrors.endDate = 'Please enter a valid end date (YYYY-MM-DD)';
      } else if (new Date(newMedication.startDate) > parsedEndDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (newMedication.schedule.length === 0) {
      newErrors.schedule = 'At least one schedule time is required';
    } else {
      newMedication.schedule.forEach((time, index) => {
        if (!/^\d{2}:\d{2}$/.test(time)) {
          newErrors[`schedule_${index}`] = `Invalid time format for schedule ${index + 1} (use HH:MM)`;
        }
      });
    }

    if (newMedication.refills.trim()) {
      const refillsValue = parseInt(newMedication.refills);
      if (isNaN(refillsValue) || refillsValue < 0) {
        newErrors.refills = 'Please enter a valid number of refills';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMedication = () => {
    if (!validateMedicationInput()) return;

    const medication: Medication = {
      id: Date.now().toString(),
      name: newMedication.name.trim(),
      dosage: newMedication.dosage.trim(),
      unit: newMedication.unit,
      frequency: newMedication.frequency.trim(),
      schedule: newMedication.schedule,
      startDate: newMedication.startDate,
      endDate: newMedication.endDate.trim() || undefined,
      doctor: newMedication.doctor.trim() || undefined,
      pharmacy: newMedication.pharmacy.trim() || undefined,
      refills: newMedication.refills.trim() ? parseInt(newMedication.refills) : undefined,
    };

    setMedications([...medications, medication]);
    onAddMedication(medication);

    // Schedule reminders
    medication.schedule.forEach((time) => {
      console.log(`Task Schedule for ${medication.name} at ${time}:`);
      console.log(`\`\`\`xaitask
{
  "name": "Reminder: ${medication.name}",
  "prompt": "Reminder: Take ${medication.dosage} ${medication.unit} of ${medication.name} now.",
  "cadence": "${medication.frequency === 'Weekly' ? 'weekly' : 'daily'}",
  "time_of_day": "${time}",
  "day_of_week": 1,
  "day_of_month": 1,
  "day_of_year": 1
}
\`\`\``);
    });

    // Reset form
    setNewMedication({
      name: '',
      dosage: '',
      unit: 'mg',
      frequency: '',
      schedule: ['08:00'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      doctor: '',
      pharmacy: '',
      refills: '',
    });
    setErrors({});
    setIsAddModalVisible(false);

    // Success UI is handled by parent screen via onAddMedication
  };

  const handleLogDose = () => {
    if (!selectedMedicationId) {
      Alert.alert('Error', 'Please select a medication to log.');
      return;
    }

    const log: MedicationLog = {
      medicationId: selectedMedicationId,
      taken: !skipped,
      timestamp: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    setLogs([...logs, log]);

    setSelectedMedicationId(null);
    setNotes('');
    setSkipped(false);
    setIsLogModalVisible(false);

    // Call onLog after all state updates to trigger screen success overlay
    onLog(log);
  };

  const addScheduleTime = () => {
    setNewMedication({
      ...newMedication,
      schedule: [...newMedication.schedule, '12:00'],
    });
  };

  return (
    <>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>💊 Medications</Text>
          <Text style={styles.subtitle}>Manage and track your medications</Text>
        </View>

        {/* Smart Dashboard */}
        <View style={styles.smartDashboard}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayStats.taken}/{todayStats.total}</Text>
              <Text style={styles.statLabel}>Today's Doses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: todayStats.adherence >= 80 ? '#4CAF50' : '#FF9800' }]}>
                {todayStats.adherence}%
              </Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              <Text style={styles.statLabel}>Current Time</Text>
            </View>
          </View>
          
          <View style={styles.smartSuggestion}>
            <Text style={styles.suggestionText}>💡 {getSmartSuggestion()}</Text>
          </View>
        </View>

        {/* Active Medications with Smart Features */}
        {medications.length > 0 && (
          <View style={styles.medicationsSection}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {medications.map((med) => {
              const nextDose = getNextDoseInfo(med);
              const status = getMedicationStatus(med);
              
              return (
                <Animated.View 
                  key={med.id} 
                  style={[
                    styles.medicationCard,
                    nextDose?.isOverdue && styles.overdueCard,
                    nextDose?.isUpcoming && styles.upcomingCard,
                    { transform: [{ scale: nextDose?.isOverdue ? pulseAnimation : 1 }] }
                  ]}
                >
                  <View style={styles.medicationInfo}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      {nextDose?.isOverdue && <Text style={styles.overdueLabel}>⚠️ OVERDUE</Text>}
                      {nextDose?.isUpcoming && <Text style={styles.upcomingLabel}>🔔 SOON</Text>}
                    </View>
                    
                    <Text style={styles.medicationDose}>{med.dosage} {med.unit}</Text>
                    
                    {/* Smart Timer Display */}
                    {nextDose && (
                      <View style={styles.timerInfo}>
                        <Text style={styles.nextDoseLabel}>
                          Next dose: {nextDose.nextTime}
                        </Text>
                        {!nextDose.isOverdue && (
                          <Text style={styles.countdownText}>
                            ⏱️ {nextDose.hoursLeft > 0 ? `${nextDose.hoursLeft}h ` : ''}{nextDose.minutesLeft}m
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${status.adherenceToday}%`,
                              backgroundColor: status.adherenceToday >= 80 ? '#4CAF50' : '#FF9800'
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {status.takenDoses}/{status.scheduledDoses} doses • {status.adherenceToday}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.medicationActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.takenButton]}
                      onPress={() => {
                        const log: MedicationLog = {
                          medicationId: med.id,
                          taken: true,
                          timestamp: new Date().toISOString(),
                        };
                        setLogs([...logs, log]);
                        // Call onLog after state update to trigger screen success overlay
                        onLog(log);
                      }}
                    >
                      <Text style={styles.actionButtonText}>✓ Take</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.skipButton]}
                      onPress={() => {
                        const log: MedicationLog = {
                          medicationId: med.id,
                          taken: false,
                          timestamp: new Date().toISOString(),
                        };
                        setLogs([...logs, log]);
                        // Call onLog after state update to trigger screen success overlay
                        onLog(log);
                      }}
                    >
                      <Text style={styles.actionButtonText}>⏭ Skip</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => setIsLogModalVisible(true)}
          >
            <Text style={styles.logButtonText}>+ Log Dose</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logButton, styles.addButton]}
            onPress={() => setIsAddModalVisible(true)}
          >
            <Text style={styles.logButtonText}>+ Add Medication</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickInfo}>
          <Text style={styles.quickInfoTitle}>Tips:</Text>
          <Text style={styles.quickInfoItem}>• Take medications at the same time daily</Text>
          <Text style={styles.quickInfoItem}>• Don't skip doses without consulting your doctor</Text>
          <Text style={styles.quickInfoItem}>• Monitor for side effects</Text>
        </View>

        {logs.length > 0 && (
          <View style={styles.logHistory}>
            <Text style={styles.logHistoryTitle}>Recent Logs</Text>
            {logs.slice(0, 3).map((log, index) => {
              const med = medications.find((m) => m.id === log.medicationId);
              return (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logItemText}>
                    {med?.name || 'Unknown'} - {log.taken ? 'Taken' : 'Skipped'} at{' '}
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                  {log.notes && <Text style={styles.logItemNotes}>{log.notes}</Text>}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Add Medication Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Medication</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Medication Name */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Medication Name</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={newMedication.name}
                  onChangeText={(text) => setNewMedication({ ...newMedication, name: text })}
                  placeholder="Enter medication name"
                  placeholderTextColor="#999999"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Dosage */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Dosage</Text>
                <TextInput
                  style={[styles.input, errors.dosage && styles.inputError]}
                  value={newMedication.dosage}
                  onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
                  placeholder="Enter dosage (e.g., 500)"
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
                {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
              </View>

              {/* Unit Selection */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.typeGrid}>
                  {dosageUnits.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.typeButton,
                        newMedication.unit === unit && styles.typeButtonSelected,
                      ]}
                      onPress={() => setNewMedication({ ...newMedication, unit })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newMedication.unit === unit && styles.typeButtonTextSelected,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Frequency */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.typeGrid}>
                  {frequencies.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.typeButton,
                        newMedication.frequency === freq && styles.typeButtonSelected,
                      ]}
                      onPress={() => setNewMedication({ ...newMedication, frequency: freq })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          newMedication.frequency === freq && styles.typeButtonTextSelected,
                        ]}
                      >
                        {freq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.frequency && <Text style={styles.errorText}>{errors.frequency}</Text>}
              </View>

              {/* Schedule Times */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Schedule Times (HH:MM)</Text>
                {newMedication.schedule.map((time, index) => (
                  <View key={index} style={styles.scheduleRow}>
                    <TextInput
                      style={[styles.input, errors[`schedule_${index}`] && styles.inputError]}
                      value={time}
                      onChangeText={(text) => {
                        const newSchedule = [...newMedication.schedule];
                        newSchedule[index] = text;
                        setNewMedication({ ...newMedication, schedule: newSchedule });
                      }}
                      placeholder="HH:MM (e.g., 08:00)"
                      placeholderTextColor="#999999"
                    />
                    {errors[`schedule_${index}`] && (
                      <Text style={styles.errorText}>{errors[`schedule_${index}`]}</Text>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addScheduleButton} onPress={addScheduleTime}>
                  <Text style={styles.addScheduleButtonText}>+ Add Time</Text>
                </TouchableOpacity>
                {errors.schedule && <Text style={styles.errorText}>{errors.schedule}</Text>}
              </View>

              {/* Start Date */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={[styles.input, errors.startDate && styles.inputError]}
                  value={newMedication.startDate}
                  onChangeText={(text) => setNewMedication({ ...newMedication, startDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999999"
                />
                {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
              </View>

              {/* End Date */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>End Date (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.endDate && styles.inputError]}
                  value={newMedication.endDate}
                  onChangeText={(text) => setNewMedication({ ...newMedication, endDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999999"
                />
                {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
              </View>

              {/* Doctor */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Prescribing Doctor (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newMedication.doctor}
                  onChangeText={(text) => setNewMedication({ ...newMedication, doctor: text })}
                  placeholder="Enter doctor's name"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Pharmacy */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Pharmacy (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newMedication.pharmacy}
                  onChangeText={(text) => setNewMedication({ ...newMedication, pharmacy: text })}
                  placeholder="Enter pharmacy name"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Refills */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Number of Refills (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.refills && styles.inputError]}
                  value={newMedication.refills}
                  onChangeText={(text) => setNewMedication({ ...newMedication, refills: text })}
                  placeholder="Enter number of refills"
                  keyboardType="numeric"
                  placeholderTextColor="#999999"
                />
                {errors.refills && <Text style={styles.errorText}>{errors.refills}</Text>}
              </View>

              {/* Preview */}
              {newMedication.name && newMedication.dosage && newMedication.frequency && !Object.keys(errors).length && (
                <View style={styles.previewCard}>
                  <Text style={styles.previewLabel}>📊 Medication Preview</Text>
                  <Text style={styles.previewValue}>
                    {newMedication.dosage} {newMedication.unit} {newMedication.name}
                  </Text>
                  <Text style={styles.previewType}>Frequency: {newMedication.frequency}</Text>
                  <Text style={styles.previewType}>Schedule: {newMedication.schedule.join(', ')}</Text>
                  <Text style={styles.previewType}>Start: {newMedication.startDate}</Text>
                  {newMedication.endDate && <Text style={styles.previewType}>End: {newMedication.endDate}</Text>}
                  {newMedication.doctor && <Text style={styles.previewType}>Doctor: {newMedication.doctor}</Text>}
                  {newMedication.pharmacy && <Text style={styles.previewType}>Pharmacy: {newMedication.pharmacy}</Text>}
                  {newMedication.refills && <Text style={styles.previewType}>Refills: {newMedication.refills}</Text>}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsAddModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddMedication}
                >
                  <Text style={styles.saveButtonText}>Add Medication</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Log Dose Modal */}
      <Modal
        visible={isLogModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {skipped ? 'Log Skipped Dose' : 'Log Medication Dose'}
              </Text>
              <TouchableOpacity onPress={() => setIsLogModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Medication Selection */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Select Medication</Text>
                <View style={styles.typeGrid}>
                  {medications.map((med) => (
                    <TouchableOpacity
                      key={med.id}
                      style={[
                        styles.typeButton,
                        selectedMedicationId === med.id && styles.typeButtonSelected,
                      ]}
                      onPress={() => setSelectedMedicationId(med.id)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedMedicationId === med.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {med.name} ({med.dosage} {med.unit})
                      </Text>
                      <Text
                        style={[
                          styles.typeDescription,
                          selectedMedicationId === med.id && styles.typeDescriptionSelected,
                        ]}
                      >
                        {med.frequency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
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

              {/* Taken/Skipped Toggle */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.typeGrid}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      !skipped && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSkipped(false)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        !skipped && styles.typeButtonTextSelected,
                      ]}
                    >
                      Taken
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      skipped && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSkipped(true)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        skipped && styles.typeButtonTextSelected,
                      ]}
                    >
                      Skipped
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsLogModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleLogDose}
                >
                  <Text style={styles.saveButtonText}>
                    {skipped ? 'Log Skip' : 'Log Dose'}
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
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  logButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2196F3',
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
  
  // Smart Dashboard Styles
  smartDashboard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  smartSuggestion: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  
  // Enhanced Medication Card Styles
  medicationsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  medicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  upcomingCard: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  overdueLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5252',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  medicationDose: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  timerInfo: {
    backgroundColor: '#F0F8F0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  nextDoseLabel: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  countdownText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  medicationInfo: {
    flex: 1,
    marginBottom: 12,
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logHistory: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  logHistoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  logItem: {
    marginBottom: 8,
  },
  logItemText: {
    fontSize: 13,
    color: '#333333',
  },
  logItemNotes: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
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
  scheduleRow: {
    marginBottom: 8,
  },
  addScheduleButton: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addScheduleButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
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
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  previewType: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
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
});

export default MedicationLogger;
