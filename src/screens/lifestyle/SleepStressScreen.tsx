import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

interface SleepTip {
  id: string;
  title: string;
  description: string;
  category: 'sleep' | 'stress';
  difficulty: 'easy' | 'moderate' | 'advanced';
}

const sleepStressTips: SleepTip[] = [
  {
    id: 'sleep-schedule',
    title: 'Maintain a Consistent Sleep Schedule',
    description: 'Go to bed and wake up at the same time every day, even on weekends. This helps regulate your body\'s internal clock.',
    category: 'sleep',
    difficulty: 'easy',
  },
  {
    id: 'sleep-environment',
    title: 'Create a Sleep-Friendly Environment',
    description: 'Keep your bedroom cool (60-67°F), dark, and quiet. Consider blackout curtains, eye masks, or white noise machines.',
    category: 'sleep',
    difficulty: 'easy',
  },
  {
    id: 'bedtime-routine',
    title: 'Develop a Relaxing Bedtime Routine',
    description: 'Start winding down 30-60 minutes before bed. Try reading, gentle stretching, or meditation.',
    category: 'sleep',
    difficulty: 'moderate',
  },
  {
    id: 'screen-time',
    title: 'Limit Screen Time Before Bed',
    description: 'Avoid phones, tablets, and TV for at least 1 hour before bedtime. Blue light can interfere with melatonin production.',
    category: 'sleep',
    difficulty: 'moderate',
  },
  {
    id: 'deep-breathing',
    title: 'Practice Deep Breathing',
    description: 'Try the 4-7-8 technique: inhale for 4 counts, hold for 7, exhale for 8. Repeat 3-4 times.',
    category: 'stress',
    difficulty: 'easy',
  },
  {
    id: 'progressive-relaxation',
    title: 'Progressive Muscle Relaxation',
    description: 'Tense and then relax each muscle group in your body, starting from your toes and working up to your head.',
    category: 'stress',
    difficulty: 'moderate',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness Meditation',
    description: 'Spend 10-20 minutes focusing on your breath and observing thoughts without judgment.',
    category: 'stress',
    difficulty: 'moderate',
  },
  {
    id: 'exercise-timing',
    title: 'Time Your Exercise Right',
    description: 'Regular exercise improves sleep quality, but avoid vigorous workouts within 3 hours of bedtime.',
    category: 'sleep',
    difficulty: 'easy',
  },
];

const SleepStressScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'sleep' | 'stress'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'moderate' | 'advanced'>('all');
  const [sleepHours, setSleepHours] = useState('');
  const [stressLevel, setStressLevel] = useState<number | null>(null);

  const filteredTips = sleepStressTips.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || tip.difficulty === selectedDifficulty;
    return matchesCategory && matchesDifficulty;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sleep': return '#3F51B5';
      case 'stress': return '#FF9800';
      default: return '#666666';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'moderate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666666';
    }
  };

  const getStressLevelColor = (level: number) => {
    if (level <= 3) return '#4CAF50';
    if (level <= 6) return '#FF9800';
    return '#F44336';
  };

  const getSleepRecommendation = (hours: number) => {
    if (hours < 6) return { text: 'Too little sleep - aim for 7-9 hours', color: '#F44336' };
    if (hours < 7) return { text: 'Below recommended - try to get more sleep', color: '#FF9800' };
    if (hours <= 9) return { text: 'Good sleep duration!', color: '#4CAF50' };
    return { text: 'Possibly too much sleep - 7-9 hours is ideal', color: '#FF9800' };
  };

  const getStressRecommendation = (level: number) => {
    if (level <= 3) return { text: 'Low stress - keep up the good work!', color: '#4CAF50' };
    if (level <= 6) return { text: 'Moderate stress - try some relaxation techniques', color: '#FF9800' };
    return { text: 'High stress - consider stress management strategies', color: '#F44336' };
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Sleep & Stress Management</Text>
        <Text style={styles.subtitle}>Improve your sleep quality and manage stress</Text>
      </View>

      <Card style={styles.trackingCard}>
        <Text style={styles.trackingTitle}>Daily Check-in</Text>
        
        <View style={styles.inputSection}>
          <Input
            label="Hours of Sleep Last Night"
            value={sleepHours}
            onChangeText={setSleepHours}
            placeholder="e.g., 7.5"
            keyboardType="numeric"
          />
          {sleepHours && !isNaN(parseFloat(sleepHours)) && (
            <View style={styles.recommendation}>
              <Text style={[styles.recommendationText, { color: getSleepRecommendation(parseFloat(sleepHours)).color }]}>
                {getSleepRecommendation(parseFloat(sleepHours)).text}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stressSection}>
          <Text style={styles.stressLabel}>Current Stress Level (1-10)</Text>
          <View style={styles.stressButtons}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.stressButton,
                  stressLevel === level && styles.stressButtonSelected,
                  stressLevel === level && { backgroundColor: getStressLevelColor(level) },
                ]}
                onPress={() => setStressLevel(level)}
              >
                <Text
                  style={[
                    styles.stressButtonText,
                    stressLevel === level && styles.stressButtonTextSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {stressLevel && (
            <View style={styles.recommendation}>
              <Text style={[styles.recommendationText, { color: getStressRecommendation(stressLevel).color }]}>
                {getStressRecommendation(stressLevel).text}
              </Text>
            </View>
          )}
        </View>

        <Button
          title="Save Daily Check-in"
          onPress={() => console.log('Save check-in', { sleepHours, stressLevel })}
          variant="primary"
          style={styles.saveButton}
        />
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Category</Text>
        <View style={styles.filterButtons}>
          {['all', 'sleep', 'stress'].map((category) => (
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

        <Text style={styles.filterTitle}>Difficulty</Text>
        <View style={styles.filterButtons}>
          {['all', 'easy', 'moderate', 'advanced'].map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[
                styles.filterButton,
                selectedDifficulty === difficulty && styles.filterButtonActive,
                selectedDifficulty === difficulty && { backgroundColor: getDifficultyColor(difficulty) },
              ]}
              onPress={() => setSelectedDifficulty(difficulty as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedDifficulty === difficulty && styles.filterButtonTextActive,
                ]}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <View style={styles.tipsList}>
        {filteredTips.map((tip) => (
          <Card key={tip.id} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(tip.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>{tip.category}</Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(tip.difficulty) },
                  ]}
                >
                  <Text style={styles.badgeText}>{tip.difficulty}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.tipDescription}>{tip.description}</Text>
            
            <TouchableOpacity style={styles.tryButton}>
              <Text style={styles.tryButtonText}>Try This Tip</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {filteredTips.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tips found</Text>
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
  trackingCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  recommendation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  stressSection: {
    marginBottom: 20,
  },
  stressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  stressButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stressButton: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stressButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  stressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  stressButtonTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    marginTop: 8,
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
  tipsList: {
    paddingHorizontal: 20,
  },
  tipCard: {
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tipDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 16,
  },
  tryButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tryButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
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

export default SleepStressScreen;
