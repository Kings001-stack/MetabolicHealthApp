import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface WeightReading {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  bodyFat?: number;
  muscleMass?: number;
  timestamp: Date;
}

interface WeightChartProps {
  data: WeightReading[];
  period: '7d' | '30d' | '90d';
  targetWeight?: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ data, period, targetWeight }) => {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 40;

  const getAverageWeight = () => {
    if (data.length === 0) return 0;
    return data.reduce((sum, reading) => sum + reading.weight, 0) / data.length;
  };

  const getWeightChange = () => {
    if (data.length < 2) return 0;
    const firstWeight = data[0].weight;
    const lastWeight = data[data.length - 1].weight;
    return lastWeight - firstWeight;
  };

  const getBMICategory = (weight: number, height: number = 170) => {
    const heightInM = height / 100;
    const bmi = weight / (heightInM * heightInM);
    
    if (bmi < 18.5) return { category: 'Underweight', color: '#2196F3' };
    if (bmi < 25) return { category: 'Normal', color: '#4CAF50' };
    if (bmi < 30) return { category: 'Overweight', color: '#FF9800' };
    return { category: 'Obese', color: '#F44336' };
  };

  const renderDataPoints = () => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No weight data available</Text>
          <Text style={styles.emptySubtext}>Start logging to track your progress</Text>
        </View>
      );
    }

    const maxWeight = Math.max(...data.map(r => r.weight));
    const minWeight = Math.min(...data.map(r => r.weight));
    const range = maxWeight - minWeight || 1;

    return data.slice(-10).map((reading, index) => {
      const heightPercentage = ((reading.weight - minWeight) / range) * 60 + 20;
      const unit = reading.unit;
      
      return (
        <View key={reading.id} style={styles.dataPoint}>
          <View
            style={[
              styles.bar,
              {
                height: heightPercentage,
                backgroundColor: targetWeight && Math.abs(reading.weight - targetWeight) <= 2 
                  ? '#4CAF50' 
                  : '#9C27B0'
              }
            ]}
          />
          <Text style={styles.valueText}>{reading.weight.toFixed(1)}</Text>
          <Text style={styles.unitText}>{unit}</Text>
          <Text style={styles.dateText}>
            {reading.timestamp.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      );
    });
  };

  const averageWeight = getAverageWeight();
  const weightChange = getWeightChange();
  const unit = data.length > 0 ? data[data.length - 1].unit : 'kg';
  const bmiInfo = getBMICategory(averageWeight);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weight Progress</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {averageWeight.toFixed(1)} {unit}
          </Text>
          <Text style={styles.statLabel}>Average Weight</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue, 
            { color: weightChange >= 0 ? '#FF5722' : '#4CAF50' }
          ]}>
            {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} {unit}
          </Text>
          <Text style={styles.statLabel}>Change</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.categoryText, { color: bmiInfo.color }]}>
            {bmiInfo.category}
          </Text>
          <Text style={styles.statLabel}>BMI Category</Text>
        </View>
      </View>

      {targetWeight && (
        <View style={styles.targetContainer}>
          <Text style={styles.targetLabel}>
            Target: {targetWeight} {unit}
          </Text>
          <Text style={styles.targetProgress}>
            {averageWeight > targetWeight 
              ? `${(averageWeight - targetWeight).toFixed(1)} ${unit} to lose`
              : `${(targetWeight - averageWeight).toFixed(1)} ${unit} to gain`
            }
          </Text>
        </View>
      )}

      <View style={styles.chartContainer}>
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
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  targetContainer: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
  targetProgress: {
    fontSize: 12,
    color: '#7B1FA2',
    marginTop: 2,
  },
  chartContainer: {
    minHeight: 120,
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 100,
    paddingHorizontal: 8,
  },
  dataPoint: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 1,
  },
  unitText: {
    fontSize: 8,
    color: '#666666',
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

export default WeightChart;
