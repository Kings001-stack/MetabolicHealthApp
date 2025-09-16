import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: Date;
}

interface BloodPressureChartProps {
  data: BloodPressureReading[];
  period: '7d' | '30d' | '90d';
}

const BloodPressureChart: React.FC<BloodPressureChartProps> = ({ data, period }) => {
  const { width } = Dimensions.get('window');
  const chartWidth = width - 40;

  const getAverageValues = () => {
    if (data.length === 0) return { systolic: 0, diastolic: 0 };
    const totalSystolic = data.reduce((sum, reading) => sum + reading.systolic, 0);
    const totalDiastolic = data.reduce((sum, reading) => sum + reading.diastolic, 0);
    return {
      systolic: totalSystolic / data.length,
      diastolic: totalDiastolic / data.length,
    };
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: 'Normal', color: '#4CAF50' };
    if (systolic < 130 && diastolic < 80) return { category: 'Elevated', color: '#FF9800' };
    if (systolic < 140 || diastolic < 90) return { category: 'Stage 1', color: '#FF5722' };
    if (systolic < 180 || diastolic < 120) return { category: 'Stage 2', color: '#F44336' };
    return { category: 'Crisis', color: '#9C27B0' };
  };

  const renderDataPoints = () => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No blood pressure data available</Text>
          <Text style={styles.emptySubtext}>Start logging to see your trends</Text>
        </View>
      );
    }

    return data.slice(-10).map((reading, index) => {
      const category = getBPCategory(reading.systolic, reading.diastolic);
      return (
        <View key={reading.id} style={styles.dataPoint}>
          <View
            style={[
              styles.point,
              { backgroundColor: category.color }
            ]}
          />
          <Text style={styles.valueText}>
            {reading.systolic}/{reading.diastolic}
          </Text>
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

  const averages = getAverageValues();
  const avgCategory = getBPCategory(averages.systolic, averages.diastolic);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blood Pressure Trends</Text>
        <Text style={styles.period}>{period}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: avgCategory.color }]}>
            {averages.systolic.toFixed(0)}/{averages.diastolic.toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Average mmHg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.length}</Text>
          <Text style={styles.statLabel}>Readings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.categoryText, { color: avgCategory.color }]}>
            {avgCategory.category}
          </Text>
          <Text style={styles.statLabel}>Category</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.targetRange}>
          <Text style={styles.rangeLabel}>Target: &lt;120/80 mmHg (Normal)</Text>
        </View>
        
        <View style={styles.dataContainer}>
          {renderDataPoints()}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Normal</Text>
          <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Elevated</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
          <Text style={styles.legendText}>Stage 1</Text>
          <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Stage 2</Text>
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
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
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
    fontSize: 9,
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
  legend: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666666',
    marginRight: 12,
  },
});

export default BloodPressureChart;
