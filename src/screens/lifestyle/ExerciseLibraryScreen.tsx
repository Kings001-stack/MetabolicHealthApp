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
import { cardioExercises, strengthExercises } from '@/data/exercises';

const ExerciseLibraryScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cardio' | 'strength'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  // Combine all exercises
  const allExercises = [
    ...cardioExercises.map(ex => ({ ...ex, category: 'cardio' })),
    ...strengthExercises.map(ex => ({ ...ex, category: 'strength' })),
  ];

  const filteredExercises = allExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cardio': return '#E91E63';
      case 'strength': return '#3F51B5';
      default: return '#666666';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.subtitle}>Discover exercises for your fitness journey</Text>
      </View>

      <Card style={styles.searchCard}>
        <Input
          label="Search Exercises"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or description..."
        />
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Category</Text>
        <View style={styles.filterButtons}>
          {['all', 'cardio', 'strength'].map((category) => (
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

        <Text style={styles.filterTitle}>Difficulty Level</Text>
        <View style={styles.filterButtons}>
          {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
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

      <View style={styles.exercisesList}>
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(exercise.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>{exercise.category}</Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(exercise.difficulty) },
                  ]}
                >
                  <Text style={styles.badgeText}>{exercise.difficulty}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.exerciseDescription}>{exercise.description}</Text>

            <View style={styles.exerciseDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{exercise.duration}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Calories:</Text>
                <Text style={styles.detailValue}>{exercise.caloriesBurned}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Equipment:</Text>
                <Text style={styles.detailValue}>{exercise.equipment}</Text>
              </View>
            </View>

            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>Instructions:</Text>
              {exercise.instructions.map((instruction, index) => (
                <Text key={index} style={styles.instruction}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>Benefits:</Text>
              <View style={styles.benefitsList}>
                {exercise.benefits.map((benefit, index) => (
                  <Text key={index} style={styles.benefit}>• {benefit}</Text>
                ))}
              </View>
            </View>

            {exercise.precautions && exercise.precautions.length > 0 && (
              <View style={styles.precautionsSection}>
                <Text style={styles.precautionsTitle}>⚠️ Precautions:</Text>
                {exercise.precautions.map((precaution, index) => (
                  <Text key={index} style={styles.precaution}>• {precaution}</Text>
                ))}
              </View>
            )}
          </Card>
        ))}
      </View>

      {filteredExercises.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No exercises found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
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
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 16,
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
  exercisesList: {
    paddingHorizontal: 20,
  },
  exerciseCard: {
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
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
  exerciseDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  exerciseDetails: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  instructionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 16,
  },
  benefitsList: {
    paddingLeft: 8,
  },
  benefit: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
    lineHeight: 20,
  },
  precautionsSection: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  precautionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 8,
  },
  precaution: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
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

export default ExerciseLibraryScreen;
