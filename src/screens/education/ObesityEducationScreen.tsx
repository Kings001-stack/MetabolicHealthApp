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
import { obesityContent } from '@/data/education';

const ObesityEducationScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredContent = obesityContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666666';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Obesity & Weight Management</Text>
        <Text style={styles.subtitle}>Learn about healthy weight management strategies</Text>
      </View>

      <Card style={styles.searchCard}>
        <Input
          label="Search Topics"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search weight management topics..."
        />
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Difficulty Level</Text>
        <View style={styles.filterButtons}>
          {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterButton,
                selectedDifficulty === level && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedDifficulty(level as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedDifficulty === level && styles.filterButtonTextActive,
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <View style={styles.contentList}>
        {filteredContent.map((item) => (
          <Card key={item.id} style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>{item.title}</Text>
              <View style={styles.contentMeta}>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(item.difficulty) },
                  ]}
                >
                  <Text style={styles.difficultyText}>{item.difficulty}</Text>
                </View>
                <Text style={styles.readTime}>{item.readTime} min read</Text>
              </View>
            </View>
            
            <Text style={styles.contentText}>{item.content}</Text>
            
            <View style={styles.tagsContainer}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      {filteredContent.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No content found</Text>
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
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    backgroundColor: '#9C27B0',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  contentList: {
    paddingHorizontal: 20,
  },
  contentCard: {
    marginBottom: 16,
  },
  contentHeader: {
    marginBottom: 12,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  readTime: {
    fontSize: 12,
    color: '#666666',
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#9C27B0',
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

export default ObesityEducationScreen;
