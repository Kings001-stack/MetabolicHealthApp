
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const mockMedications = [
  { id: '1', name: 'Metformin', dosage: '500mg', time: 'Morning' },
  { id: '2', name: 'Lisinopril', dosage: '10mg', time: 'Morning' },
  { id: '3', name: 'Atorvastatin', dosage: '20mg', time: 'Evening' },
];

const MedicationScreen = () => {
  const [medications, setMedications] = useState(mockMedications);
  const [newMedication, setNewMedication] = useState('');

  const addMedication = () => {
    if (newMedication.trim() === '') return;
    const newMed = {
      id: Math.random().toString(),
      name: newMedication,
      dosage: '10mg', // Default dosage for new meds
      time: 'Morning', // Default time
    };
    setMedications([...medications, newMed]);
    setNewMedication('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.medicationItem}>
      <View>
        <Text style={styles.medicationName}>{item.name}</Text>
        <Text style={styles.medicationDosage}>{`${item.dosage} - ${item.time}`}</Text>
      </View>
      <TouchableOpacity>
        <Feather name="more-vertical" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Log</Text>
      </View>
      <FlatList
        data={medications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add new medication..."
          value={newMedication}
          onChangeText={setNewMedication}
        />
        <TouchableOpacity style={styles.addButton} onPress={addMedication}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 20,
  },
  medicationItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 10,
    height: 50,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MedicationScreen;
