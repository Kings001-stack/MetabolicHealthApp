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
import { diabetesContent, hypertensionContent, obesityContent, cholesterolContent } from '@/data/education';

const MetabolicSyndromeScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'diabetes' | 'hypertension' | 'obesity' | 'cholesterol'>('all');

  // Combine all content for metabolic syndrome
  const allContent = [
    ...diabetesContent,
    ...hypertensionContent,
    ...obesityContent,
    ...cholesterolContent,
  ];

  const filteredContent = allContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'diabetes': return '#4CAF50';
      case 'hypertension': return '#F44336';
      case 'obesity': return '#9C27B0';
      case 'cholesterol': return '#FF9800';
      default: return '#666666';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Metabolic Syndrome</Text>
        <Text style={styles.subtitle}>Comprehensive health condition management</Text>
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>What is Metabolic Syndrome?</Text>
        <Text style={styles.infoText}>
          Metabolic syndrome is a cluster of conditions that occur together, increasing your risk of heart disease, stroke, and type 2 diabetes. These conditions include increased blood pressure, high blood sugar, excess body fat around the waist, and abnormal cholesterol levels.
        </Text>
      </Card>

      <Card style={styles.searchCard}>
        <Input
          label="Search Topics"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search metabolic health topics..."
        />
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Health Category</Text>
        <View style={styles.filterButtons}>
          {['all', 'diabetes', 'hypertension', 'obesity', 'cholesterol'].map((category) => (
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

      <View style={styles.contentList}>
        {filteredContent.map((item) => (
          <Card key={item.id} style={styles.contentCard}>
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>{item.title}</Text>
              <View style={styles.contentMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(item.category) },
                  ]}
                >
                  <Text style={styles.categoryText}>{item.category}</Text>
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
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
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
    backgroundColor: '#2196F3',
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
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
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
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#666666',
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

export default MetabolicSyndromeScreen;
