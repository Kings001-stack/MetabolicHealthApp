import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';

interface EducationTopic {
  id: string;
  title: string;
  category: 'diabetes' | 'hypertension' | 'obesity' | 'general';
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  summary: string;
}

const LearnScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'diabetes', name: 'Diabetes', icon: '🩸' },
    { id: 'hypertension', name: 'Blood Pressure', icon: '❤️' },
    { id: 'obesity', name: 'Weight Management', icon: '⚖️' },
    { id: 'general', name: 'General Health', icon: '✨' },
  ];

  const educationTopics: EducationTopic[] = [
    {
      id: '1',
      title: 'Understanding Type 2 Diabetes',
      category: 'diabetes',
      readTime: '5 min',
      difficulty: 'beginner',
      icon: '🩸',
      summary: 'Learn the basics of Type 2 diabetes, its causes, and management strategies.',
    },
    {
      id: '2',
      title: 'Blood Pressure Management',
      category: 'hypertension',
      readTime: '7 min',
      difficulty: 'beginner',
      icon: '❤️',
      summary: 'Effective ways to monitor and control your blood pressure naturally.',
    },
    {
      id: '3',
      title: 'Healthy Weight Loss Strategies',
      category: 'obesity',
      readTime: '8 min',
      difficulty: 'intermediate',
      icon: '⚖️',
      summary: 'Science-backed approaches to sustainable weight management.',
    },
    {
      id: '4',
      title: 'Recognizing Health Red Flags',
      category: 'general',
      readTime: '6 min',
      difficulty: 'beginner',
      icon: '🚨',
      summary: 'Warning signs that require immediate medical attention.',
    },
    {
      id: '5',
      title: 'Carbohydrate Counting Made Easy',
      category: 'diabetes',
      readTime: '10 min',
      difficulty: 'intermediate',
      icon: '🔢',
      summary: 'Master the art of counting carbs for better blood sugar control.',
    },
    {
      id: '6',
      title: 'Exercise for Metabolic Health',
      category: 'general',
      readTime: '12 min',
      difficulty: 'intermediate',
      icon: '🏃‍♂️',
      summary: 'How physical activity improves insulin sensitivity and overall health.',
    },
  ];

  const redFlags = [
    {
      id: '1',
      title: 'Severe Hypoglycemia',
      symptoms: 'Confusion, seizures, loss of consciousness',
      action: 'Call emergency services immediately',
      severity: 'critical',
    },
    {
      id: '2',
      title: 'Chest Pain',
      symptoms: 'Pressure, squeezing, or pain in chest',
      action: 'Seek immediate medical attention',
      severity: 'critical',
    },
    {
      id: '3',
      title: 'Sudden Vision Changes',
      symptoms: 'Blurred vision, blind spots, flashing lights',
      action: 'Contact your doctor immediately',
      severity: 'urgent',
    },
  ];

  const filteredTopics = educationTopics.filter(topic => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666666';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#F44336';
      case 'urgent': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Health Education</Text>
        <Text style={styles.subtitle}>Learn to manage your health better</Text>
      </View>

      {/* Search */}
      <Card style={styles.searchCard}>
        <Input
          placeholder="Search health topics..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </Card>

      {/* Red Flags Alert */}
      <Alert
        type="error"
        title="Emergency Warning Signs"
        message="Know when to seek immediate medical help"
        style={styles.redFlagsAlert}
      />

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Topic */}
      <Card style={styles.featuredCard}>
        <View style={styles.featuredHeader}>
          <Text style={styles.featuredBadge}>Featured</Text>
          <Text style={styles.featuredIcon}>⭐</Text>
        </View>
        <Text style={styles.featuredTitle}>Understanding Metabolic Syndrome</Text>
        <Text style={styles.featuredSummary}>
          Learn how diabetes, obesity, high blood pressure, and cholesterol are connected 
          and how to manage them together for better health outcomes.
        </Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredMetaText}>📖 15 min read</Text>
          <Text style={styles.featuredMetaText}>👥 Expert reviewed</Text>
        </View>
        <TouchableOpacity style={styles.featuredButton}>
          <Text style={styles.featuredButtonText}>Read Now</Text>
        </TouchableOpacity>
      </Card>

      {/* Education Topics */}
      <Card style={styles.topicsCard}>
        <Text style={styles.sectionTitle}>Health Topics</Text>
        
        {filteredTopics.map((topic) => (
          <TouchableOpacity key={topic.id} style={styles.topicItem}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <View style={styles.topicInfo}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicSummary}>{topic.summary}</Text>
                <View style={styles.topicMeta}>
                  <Text style={styles.topicMetaText}>📖 {topic.readTime}</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(topic.difficulty) },
                    ]}
                  >
                    <Text style={styles.difficultyText}>
                      {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.topicArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Red Flags Section */}
      <Card style={styles.redFlagsCard}>
        <View style={styles.redFlagsHeader}>
          <Text style={styles.sectionTitle}>Health Red Flags</Text>
          <Text style={styles.redFlagsIcon}>🚨</Text>
        </View>
        <Text style={styles.redFlagsSubtitle}>
          Recognize these warning signs and know when to seek immediate help
        </Text>
        
        {redFlags.map((flag) => (
          <View key={flag.id} style={styles.redFlagItem}>
            <View
              style={[
                styles.severityIndicator,
                { backgroundColor: getSeverityColor(flag.severity) },
              ]}
            />
            <View style={styles.redFlagContent}>
              <Text style={styles.redFlagTitle}>{flag.title}</Text>
              <Text style={styles.redFlagSymptoms}>Symptoms: {flag.symptoms}</Text>
              <Text style={styles.redFlagAction}>Action: {flag.action}</Text>
            </View>
          </View>
        ))}
        
        <TouchableOpacity style={styles.emergencyButton}>
          <Text style={styles.emergencyButtonText}>📞 Emergency Contacts</Text>
        </TouchableOpacity>
      </Card>

      {/* Quick Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.sectionTitle}>Daily Health Tips</Text>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Stay Hydrated</Text>
            <Text style={styles.tipText}>
              Drink water regularly throughout the day to help regulate blood sugar levels.
            </Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🚶‍♂️</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Post-Meal Walks</Text>
            <Text style={styles.tipText}>
              A 10-15 minute walk after meals can help lower blood sugar spikes.
            </Text>
          </View>
        </View>
        
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>😴</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Quality Sleep</Text>
            <Text style={styles.tipText}>
              Aim for 7-8 hours of sleep to help your body regulate hormones properly.
            </Text>
          </View>
        </View>
      </Card>

      {/* Resources */}
      <Card style={styles.resourcesCard}>
        <Text style={styles.sectionTitle}>Additional Resources</Text>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>🏥</Text>
          <View style={styles.resourceContent}>
            <Text style={styles.resourceTitle}>Find Healthcare Providers</Text>
            <Text style={styles.resourceDescription}>Locate diabetes specialists near you</Text>
          </View>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>📱</Text>
          <View style={styles.resourceContent}>
            <Text style={styles.resourceTitle}>Health Apps & Tools</Text>
            <Text style={styles.resourceDescription}>Recommended apps for health tracking</Text>
          </View>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resourceItem}>
          <Text style={styles.resourceIcon}>👥</Text>
          <View style={styles.resourceContent}>
            <Text style={styles.resourceTitle}>Support Groups</Text>
            <Text style={styles.resourceDescription}>Connect with others on similar journeys</Text>
          </View>
          <Text style={styles.resourceArrow}>›</Text>
        </TouchableOpacity>
      </Card>

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
  searchInput: {
    marginVertical: 0,
  },
  redFlagsAlert: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  featuredCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredIcon: {
    fontSize: 20,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  featuredSummary: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featuredMetaText: {
    fontSize: 12,
    color: '#4CAF50',
    marginRight: 16,
  },
  featuredButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topicsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  topicItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  topicSummary: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicMetaText: {
    fontSize: 12,
    color: '#999999',
    marginRight: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  topicArrow: {
    fontSize: 18,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  redFlagsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  redFlagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  redFlagsIcon: {
    fontSize: 20,
  },
  redFlagsSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  redFlagItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  severityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  redFlagContent: {
    flex: 1,
  },
  redFlagTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  redFlagSymptoms: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  redFlagAction: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: '500',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  resourcesCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resourceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 12,
    color: '#666666',
  },
  resourceArrow: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default LearnScreen;
