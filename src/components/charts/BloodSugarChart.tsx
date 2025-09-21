import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface BloodSugarReading {
  id: string;
  value: number;
  type: 'fasting' | 'pre-meal' | 'post-meal' | 'bedtime';
  timestamp: Date;
}

interface BloodSugarChartProps {
  data: BloodSugarReading[];
  period: '7d' | '30d' | '90d';
}

const BloodSugarChart: React.FC<BloodSugarChartProps> = ({ data, period }) => {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 40;

  const getAverageValue = () => {
    if (data.length === 0) return 0;
    return data.reduce((sum, reading) => sum + reading.value, 0) / data.length;
  };

  const getTargetRange = () => {
    return { min: 70, max: 140 };
  };

  const renderDataPoints = () => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No blood sugar data available</Text>
          <Text style={styles.emptySubtext}>Start logging to see your trends</Text>
        </View>
      );
    }

    return data.slice(-10).map((reading, index) => (
      <View key={reading.id} style={styles.dataPoint}>
        <View
          style={[
            styles.point,
            {
              backgroundColor: reading.value > 140 ? '#F44336' : 
                             reading.value < 70 ? '#2196F3' : '#4CAF50'
            }
          ]}
        />
        <Text style={styles.valueText}>{reading.value}</Text>
        <Text style={styles.dateText}>
          {reading.timestamp.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blood Sugar Trends</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{getAverageValue().toFixed(1)}</Text>
          <Text style={styles.statLabel}>Average mg/dL</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Readings</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.targetRange}>
          <Text style={styles.rangeLabel}>Target: 70-140 mg/dL</Text>
        </View>
        
        <View style={styles.dataContainer}>
          {renderDataPoints()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  period: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  chartContainer: {
    minHeight: 120,
  },
  targetRange: {
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 80,
  },
  dataPoint: {
    alignItems: 'center',
    flex: 1,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 8,
    color: '#999999',
  },
  emptyState: {
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
});

export default BloodSugarChart;
