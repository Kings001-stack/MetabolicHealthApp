import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'diabetes' | 'hypertension' | 'heart' | 'general';
  symptoms: string[];
  action: string;
}

const redFlags: RedFlag[] = [
  {
    id: 'severe-hypoglycemia',
    title: 'Severe Low Blood Sugar',
    description: 'Blood sugar below 54 mg/dL or symptoms of severe hypoglycemia',
    severity: 'high',
    category: 'diabetes',
    symptoms: ['Confusion', 'Seizures', 'Loss of consciousness', 'Inability to eat or drink'],
    action: 'Call emergency services immediately (911) or go to nearest emergency room',
  },
  {
    id: 'dka-symptoms',
    title: 'Diabetic Ketoacidosis (DKA)',
    description: 'Life-threatening complication of diabetes',
    severity: 'high',
    category: 'diabetes',
    symptoms: ['Blood sugar over 250 mg/dL', 'Nausea/vomiting', 'Fruity breath odor', 'Rapid breathing', 'Severe dehydration'],
    action: 'Seek immediate emergency medical care',
  },
  {
    id: 'hypertensive-crisis',
    title: 'Hypertensive Crisis',
    description: 'Dangerously high blood pressure requiring immediate attention',
    severity: 'high',
    category: 'hypertension',
    symptoms: ['Blood pressure over 180/120', 'Severe headache', 'Chest pain', 'Difficulty breathing', 'Vision changes'],
    action: 'Call emergency services immediately',
  },
  {
    id: 'chest-pain',
    title: 'Chest Pain',
    description: 'Potential heart attack symptoms',
    severity: 'high',
    category: 'heart',
    symptoms: ['Chest pressure or pain', 'Pain in arm, jaw, or back', 'Shortness of breath', 'Nausea', 'Cold sweats'],
    action: 'Call emergency services immediately - do not drive yourself',
  },
  {
    id: 'stroke-symptoms',
    title: 'Stroke Symptoms',
    description: 'Signs of potential stroke (FAST)',
    severity: 'high',
    category: 'general',
    symptoms: ['Face drooping', 'Arm weakness', 'Speech difficulty', 'Time to call emergency'],
    action: 'Call emergency services immediately - note time symptoms started',
  },
  {
    id: 'persistent-high-bg',
    title: 'Persistent High Blood Sugar',
    description: 'Blood sugar consistently over 300 mg/dL',
    severity: 'medium',
    category: 'diabetes',
    symptoms: ['Blood sugar over 300 mg/dL for 24+ hours', 'Excessive thirst', 'Frequent urination', 'Fatigue'],
    action: 'Contact your healthcare provider within 24 hours',
  },
  {
    id: 'medication-side-effects',
    title: 'Severe Medication Side Effects',
    description: 'Serious adverse reactions to medications',
    severity: 'medium',
    category: 'general',
    symptoms: ['Severe allergic reaction', 'Unusual bleeding', 'Severe muscle pain', 'Persistent nausea/vomiting'],
    action: 'Contact healthcare provider or pharmacist immediately',
  },
];

const RedFlagsScreen: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'diabetes' | 'hypertension' | 'heart' | 'general'>('all');

  const filteredRedFlags = redFlags.filter(flag => {
    const matchesSeverity = selectedSeverity === 'all' || flag.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    return matchesSeverity && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diabetes': return '#4CAF50';
      case 'hypertension': return '#F44336';
      case 'heart': return '#E91E63';
      case 'general': return '#2196F3';
      default: return '#666666';
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Services',
      'This will dial emergency services (911). Only use for true medical emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 911', style: 'destructive', onPress: () => console.log('Emergency call initiated') },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🚨 Health Red Flags</Text>
        <Text style={styles.subtitle}>Know when to seek immediate medical attention</Text>
      </View>

      <Card style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Medical Emergency?</Text>
        <Text style={styles.emergencyText}>
          If you're experiencing a life-threatening emergency, don't wait - call emergency services immediately.
        </Text>
        <Button
          title="🚨 Call Emergency Services"
          onPress={handleEmergencyCall}
          variant="primary"
          style={styles.emergencyButton}
        />
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter by Severity</Text>
        <View style={styles.filterButtons}>
          {['all', 'high', 'medium', 'low'].map((severity) => (
            <TouchableOpacity
              key={severity}
              style={[
                styles.filterButton,
                selectedSeverity === severity && styles.filterButtonActive,
                selectedSeverity === severity && { backgroundColor: getSeverityColor(severity) },
              ]}
              onPress={() => setSelectedSeverity(severity as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedSeverity === severity && styles.filterButtonTextActive,
                ]}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.filterTitle}>Filter by Category</Text>
        <View style={styles.filterButtons}>
          {['all', 'diabetes', 'hypertension', 'heart', 'general'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive,
                selectedCategory === category && { backgroundColor: getCategoryColor(category) },
              ]}
              onPress={() => setSelectedCategory(category as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.filterButtonTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <View style={styles.flagsList}>
        {filteredRedFlags.map((flag) => (
          <Card key={flag.id} style={[styles.flagCard, { borderLeftColor: getSeverityColor(flag.severity) }]}>
            <View style={styles.flagHeader}>
              <Text style={styles.flagTitle}>{flag.title}</Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(flag.severity) },
                  ]}
                >
                  <Text style={styles.badgeText}>{flag.severity.toUpperCase()}</Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(flag.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>{flag.category}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.flagDescription}>{flag.description}</Text>
            
            <View style={styles.symptomsSection}>
              <Text style={styles.sectionTitle}>Symptoms to Watch For:</Text>
              {flag.symptoms.map((symptom, index) => (
                <Text key={index} style={styles.symptom}>• {symptom}</Text>
              ))}
            </View>
            
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>What to Do:</Text>
              <Text style={[styles.actionText, { color: getSeverityColor(flag.severity) }]}>
                {flag.action}
              </Text>
            </View>
          </Card>
        ))}
      </View>

      {filteredRedFlags.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No red flags found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </Card>
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  emergencyCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#F44336',
  },
  filterCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginTop: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  flagsList: {
    paddingHorizontal: 20,
  },
  flagCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  flagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  flagTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  flagDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  symptomsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  symptom: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  actionSection: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyCard: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RedFlagsScreen;
