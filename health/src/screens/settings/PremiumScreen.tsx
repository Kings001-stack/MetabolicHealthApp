import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PremiumScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Premium Features</Text>
          <Text style={styles.subtitle}>Unlock advanced health tracking</Text>
        </View>
        
        <View style={styles.featureList}>
          <Text style={styles.feature}>✓ Advanced Analytics</Text>
          <Text style={styles.feature}>✓ Export Health Data</Text>
          <Text style={styles.feature}>✓ Priority Support</Text>
          <Text style={styles.feature}>✓ Ad-free Experience</Text>
        </View>
        
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333333' },
  subtitle: { fontSize: 16, color: '#666666', marginTop: 4 },
  featureList: { padding: 20 },
  feature: { fontSize: 16, color: '#333333', marginBottom: 12 },
  upgradeButton: { margin: 20, backgroundColor: '#4CAF50', borderRadius: 8, padding: 16, alignItems: 'center' },
  upgradeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default PremiumScreen;
