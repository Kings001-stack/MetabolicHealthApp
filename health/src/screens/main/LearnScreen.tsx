import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert as RNAlert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import Alert from '@/components/common/Alert';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';
import { User } from '@/database/repositories/UserRepository';
import { RootStackParamList } from '@/types';

interface EducationTopic {
  id: string;
  title: string;
  category: 'diabetes' | 'hypertension' | 'obesity' | 'general';
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  summary: string;
  content?: string;
  author?: string;
  datePublished?: string;
  views?: number;
  isBookmarked?: boolean;
}

interface UserHealthProfile {
  conditions: string[];
  interests: string[];
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface LearningProgress {
  totalTopicsRead: number;
  streakDays: number;
  lastReadDate: string;
  pointsEarned: number;
  level: number;
  badges: string[];
  weeklyGoal: number;
  weeklyProgress: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: string;
}

const LearnScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserHealthProfile | null>(null);
  const [educationTopics, setEducationTopics] = useState<EducationTopic[]>([]);
  const [featuredTopic, setFeaturedTopic] = useState<EducationTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarkedTopics, setBookmarkedTopics] = useState<string[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    totalTopicsRead: 0,
    streakDays: 0,
    lastReadDate: '',
    pointsEarned: 0,
    level: 1,
    badges: [],
    weeklyGoal: 3,
    weeklyProgress: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showAchievement, setShowAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    loadUserDataAndTopics();
  }, []);

  const loadUserDataAndTopics = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        await Promise.all([
          loadUserHealthProfile(user.id),
          loadEducationTopics(user.id),
          loadBookmarkedTopics(user.id),
          loadLearningProgress(user.id),
          loadAchievements(user.id),
        ]);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserHealthProfile = async (userId: string) => {
    try {
      // Load user's health conditions and interests from their health data
      const healthData = await DatabaseService.executeQuery<{condition: string}>(
        `SELECT DISTINCT 'diabetes' as condition FROM blood_sugar_readings WHERE user_id = ?
         UNION
         SELECT DISTINCT 'hypertension' as condition FROM blood_pressure_readings WHERE user_id = ?`,
        [userId, userId]
      );

      const conditions = healthData.map(row => row.condition);
      
      // Set user profile based on their health data
      setUserProfile({
        conditions,
        interests: conditions.length > 0 ? conditions : ['general'],
        readingLevel: 'beginner', // Could be determined by user settings
      });
    } catch (error) {
      console.error('Failed to load user health profile:', error);
      setUserProfile({
        conditions: [],
        interests: ['general'],
        readingLevel: 'beginner',
      });
    }
  };

  const loadEducationTopics = async (userId: string) => {
    try {
      // In a real app, this would fetch from a content API or CMS
      // For now, we'll use enhanced static data with personalization
      const allTopics = await getPersonalizedTopics(userId);
      setEducationTopics(allTopics);
      
      // Set featured topic based on user's health profile
      const featured = allTopics.find(topic => 
        userProfile?.conditions.includes(topic.category) || topic.category === 'general'
      ) || allTopics[0];
      setFeaturedTopic(featured);
    } catch (error) {
      console.error('Failed to load education topics:', error);
    }
  };

  const loadBookmarkedTopics = async (userId: string) => {
    try {
      const bookmarks = await DatabaseService.executeQuery<{topic_id: string}>(
        'SELECT topic_id FROM bookmarked_topics WHERE user_id = ?',
        [userId]
      );
      setBookmarkedTopics(bookmarks.map(b => b.topic_id));
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      // Set empty bookmarks if table doesn't exist yet
      setBookmarkedTopics([]);
    }
  };

  const loadLearningProgress = async (userId: string) => {
    try {
      const progressData = await DatabaseService.executeQuery<LearningProgress>(
        'SELECT * FROM learning_progress WHERE user_id = ?',
        [userId]
      );

      if (progressData.length > 0) {
        const progress = progressData[0];

        // Calculate current streak
        const today = new Date().toISOString().split('T')[0];
        const lastRead = new Date(progress.lastReadDate).toISOString().split('T')[0];
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(lastRead).getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > 1) {
          progress.streakDays = 0; // Reset streak if more than 1 day gap
        }

        // Calculate weekly progress
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weeklyReads = await DatabaseService.executeQuery<{count: number}>(
          'SELECT COUNT(*) as count FROM topic_views WHERE user_id = ? AND viewed_at >= ?',
          [userId, weekStart.toISOString()]
        );
        progress.weeklyProgress = weeklyReads[0]?.count || 0;

        setLearningProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load learning progress:', error);
      // Set default progress if table doesn't exist yet
      setLearningProgress({
        totalTopicsRead: 0,
        streakDays: 0,
        lastReadDate: '',
        pointsEarned: 0,
        level: 1,
        badges: [],
        weeklyGoal: 3,
        weeklyProgress: 0,
      });
    }
  };

  const loadAchievements = async (userId: string) => {
    try {
      // Get user's unlocked achievements
      const unlockedAchievements = await DatabaseService.executeQuery<{achievement_id: string, unlocked_date: string}>(
        'SELECT achievement_id, unlocked_date FROM user_achievements WHERE user_id = ?',
        [userId]
      );

      const unlockedIds = unlockedAchievements.map(a => a.achievement_id);
      
      // Define all possible achievements
      const allAchievements: Achievement[] = [
        {
          id: 'first_read',
          title: 'Knowledge Seeker',
          description: 'Read your first health topic',
          icon: '📚',
          points: 10,
          unlocked: unlockedIds.includes('first_read'),
        },
        {
          id: 'streak_3',
          title: 'Learning Streak',
          description: 'Read topics for 3 days in a row',
          icon: '🔥',
          points: 25,
          unlocked: unlockedIds.includes('streak_3'),
        },
        {
          id: 'streak_7',
          title: 'Knowledge Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: '⚡',
          points: 50,
          unlocked: unlockedIds.includes('streak_7'),
        },
        {
          id: 'topics_10',
          title: 'Health Scholar',
          description: 'Read 10 different topics',
          icon: '🎓',
          points: 75,
          unlocked: unlockedIds.includes('topics_10'),
        },
        {
          id: 'weekly_goal',
          title: 'Goal Crusher',
          description: 'Complete your weekly reading goal',
          icon: '🎯',
          points: 30,
          unlocked: unlockedIds.includes('weekly_goal'),
        },
        {
          id: 'bookmark_master',
          title: 'Bookmark Master',
          description: 'Bookmark 5 topics for later',
          icon: '🔖',
          points: 20,
          unlocked: unlockedIds.includes('bookmark_master'),
        },
        {
          id: 'category_explorer',
          title: 'Category Explorer',
          description: 'Read topics from all categories',
          icon: '🗺️',
          points: 40,
          unlocked: unlockedIds.includes('category_explorer'),
        },
        {
          id: 'level_5',
          title: 'Health Expert',
          description: 'Reach level 5 in learning',
          icon: '👑',
          points: 100,
          unlocked: unlockedIds.includes('level_5'),
        },
      ];

      // Add unlock dates
      allAchievements.forEach(achievement => {
        const unlockedData = unlockedAchievements.find(u => u.achievement_id === achievement.id);
        if (unlockedData) {
          achievement.unlockedDate = unlockedData.unlocked_date;
        }
      });

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      // Set default achievements if table doesn't exist yet
      setAchievements([
        {
          id: 'first_read',
          title: 'Knowledge Seeker',
          description: 'Read your first health topic',
          icon: '📚',
          points: 10,
          unlocked: false,
        },
        {
          id: 'streak_3',
          title: 'Learning Streak',
          description: 'Read topics for 3 days in a row',
          icon: '🔥',
          points: 25,
          unlocked: false,
        },
        {
          id: 'streak_7',
          title: 'Knowledge Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: '⚡',
          points: 50,
          unlocked: false,
        },
        {
          id: 'topics_10',
          title: 'Health Scholar',
          description: 'Read 10 different topics',
          icon: '🎓',
          points: 75,
          unlocked: false,
        },
        {
          id: 'weekly_goal',
          title: 'Goal Crusher',
          description: 'Complete your weekly reading goal',
          icon: '🎯',
          points: 30,
          unlocked: false,
        },
        {
          id: 'bookmark_master',
          title: 'Bookmark Master',
          description: 'Bookmark 5 topics for later',
          icon: '🔖',
          points: 20,
          unlocked: false,
        },
        {
          id: 'category_explorer',
          title: 'Category Explorer',
          description: 'Read topics from all categories',
          icon: '🗺️',
          points: 40,
          unlocked: false,
        },
        {
          id: 'level_5',
          title: 'Health Expert',
          description: 'Reach level 5 in learning',
          icon: '👑',
          points: 100,
          unlocked: false,
        },
      ]);
    }
  };

  const getPersonalizedTopics = async (userId: string): Promise<EducationTopic[]> => {
    // Enhanced topics with real content and personalization
    const baseTopics: EducationTopic[] = [
      {
        id: '1',
        title: 'Understanding Type 2 Diabetes',
        category: 'diabetes',
        readTime: '5 min',
        difficulty: 'beginner',
        icon: '🩸',
        summary: 'Learn the basics of Type 2 diabetes, its causes, and management strategies.',
        content: 'Type 2 diabetes is a chronic condition that affects how your body processes blood sugar (glucose)...',
        author: 'Dr. Sarah Johnson, Endocrinologist',
        datePublished: '2024-01-15',
        views: 1250,
      },
      {
        id: '2',
        title: 'Blood Pressure Management',
        category: 'hypertension',
        readTime: '7 min',
        difficulty: 'beginner',
        icon: '❤️',
        summary: 'Effective ways to monitor and control your blood pressure naturally.',
        content: 'High blood pressure, or hypertension, is often called the "silent killer" because...',
        author: 'Dr. Michael Chen, Cardiologist',
        datePublished: '2024-01-10',
        views: 980,
      },
      {
        id: '3',
        title: 'Healthy Weight Loss Strategies',
        category: 'obesity',
        readTime: '8 min',
        difficulty: 'intermediate',
        icon: '⚖️',
        summary: 'Science-backed approaches to sustainable weight management.',
        content: 'Sustainable weight loss is about making healthy lifestyle changes...',
        author: 'Dr. Lisa Rodriguez, Nutritionist',
        datePublished: '2024-01-08',
        views: 1500,
      },
      {
        id: '4',
        title: 'Recognizing Health Red Flags',
        category: 'general',
        readTime: '6 min',
        difficulty: 'beginner',
        icon: '🚨',
        summary: 'Warning signs that require immediate medical attention.',
        content: 'Knowing when to seek immediate medical attention can save your life...',
        author: 'Dr. Robert Kim, Emergency Medicine',
        datePublished: '2024-01-12',
        views: 2100,
      },
      {
        id: '5',
        title: 'Carbohydrate Counting Made Easy',
        category: 'diabetes',
        readTime: '10 min',
        difficulty: 'intermediate',
        icon: '🔢',
        summary: 'Master the art of counting carbs for better blood sugar control.',
        content: 'Carbohydrate counting is a meal planning tool for people with diabetes...',
        author: 'Dr. Amanda White, Diabetes Educator',
        datePublished: '2024-01-05',
        views: 890,
      },
      {
        id: '6',
        title: 'Exercise for Metabolic Health',
        category: 'general',
        readTime: '12 min',
        difficulty: 'intermediate',
        icon: '🏃‍♂️',
        summary: 'How physical activity improves insulin sensitivity and overall health.',
        content: 'Regular physical activity is one of the most effective ways to improve metabolic health...',
        author: 'Dr. James Thompson, Sports Medicine',
        datePublished: '2024-01-03',
        views: 1350,
      },
    ];

    // Add bookmark status for each topic
    return baseTopics.map(topic => ({
      ...topic,
      isBookmarked: bookmarkedTopics.includes(topic.id),
    }));
  };

  const handleBookmarkTopic = async (topicId: string) => {
    if (!currentUser) return;

    try {
      const isCurrentlyBookmarked = bookmarkedTopics.includes(topicId);
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await DatabaseService.executeUpdate(
          'DELETE FROM bookmarked_topics WHERE user_id = ? AND topic_id = ?',
          [currentUser.id, topicId]
        );
        setBookmarkedTopics(prev => prev.filter(id => id !== topicId));
      } else {
        // Add bookmark
        await DatabaseService.executeUpdate(
          'INSERT INTO bookmarked_topics (user_id, topic_id, created_at) VALUES (?, ?, ?)',
          [currentUser.id, topicId, new Date().toISOString()]
        );
        setBookmarkedTopics(prev => [...prev, topicId]);
      }

      // Update the topic in the list
      setEducationTopics(prev => 
        prev.map(topic => 
          topic.id === topicId 
            ? { ...topic, isBookmarked: !isCurrentlyBookmarked }
            : topic
        )
      );
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      RNAlert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleTopicView = async (topic: EducationTopic) => {
    if (!currentUser) return;

    try {
      // Track topic view
      await DatabaseService.executeUpdate(
        'INSERT INTO topic_views (user_id, topic_id, viewed_at) VALUES (?, ?, ?)',
        [currentUser.id, topic.id, new Date().toISOString()]
      );
      // Update learning progress
      await updateLearningProgress(topic);

      // Navigate to topic detail
      navigation.navigate('EducationTopic', {
        topic: {
          ...topic,
          views: (topic.views || 0) + 1,
        },
      });
    } catch (error) {
      console.error('Failed to track topic view:', error);
      navigation.navigate('EducationTopic', { topic });
    }
  };

  const updateLearningProgress = async (topic: EducationTopic) => {
    if (!currentUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Calculate new streak
      let newStreak = learningProgress.streakDays;
      if (learningProgress.lastReadDate === yesterdayStr) {
        newStreak += 1; // Continue streak
      } else if (learningProgress.lastReadDate !== today) {
        newStreak = 1; // Start new streak
      }

      // Calculate points based on difficulty
      const difficultyPoints = {
        beginner: 5,
        intermediate: 10,
        advanced: 15,
      };
      const newPoints = learningProgress.pointsEarned + difficultyPoints[topic.difficulty];

      // Calculate level (every 100 points = 1 level)
      const newLevel = Math.floor(newPoints / 100) + 1;

      const updatedProgress: LearningProgress = {
        ...learningProgress,
        totalTopicsRead: learningProgress.totalTopicsRead + 1,
        streakDays: newStreak,
        lastReadDate: today,
        pointsEarned: newPoints,
        level: newLevel,
        weeklyProgress: learningProgress.weeklyProgress + 1,
      };

      // Update database
      await DatabaseService.executeUpdate(
        `INSERT OR REPLACE INTO learning_progress
         (user_id, total_topics_read, streak_days, last_read_date, points_earned, level, weekly_goal, weekly_progress)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          currentUser.id,
          updatedProgress.totalTopicsRead,
          updatedProgress.streakDays,
          updatedProgress.lastReadDate,
          updatedProgress.pointsEarned,
          updatedProgress.level,
          updatedProgress.weeklyGoal,
          updatedProgress.weeklyProgress,
        ]
      );

      setLearningProgress(updatedProgress);

      // Check for new achievements
      await checkForNewAchievements(updatedProgress);

    } catch (error) {
      console.error('Failed to update learning progress:', error);
      // If database tables don't exist yet, just update local state
      const today = new Date().toISOString().split('T')[0];
      const difficultyPoints = {
        beginner: 5,
        intermediate: 10,
        advanced: 15,
      };
      const newPoints = learningProgress.pointsEarned + difficultyPoints[topic.difficulty];
      const newLevel = Math.floor(newPoints / 100) + 1;

      const updatedProgress: LearningProgress = {
        ...learningProgress,
        totalTopicsRead: learningProgress.totalTopicsRead + 1,
        streakDays: learningProgress.streakDays + 1,
        lastReadDate: today,
        pointsEarned: newPoints,
        level: newLevel,
        weeklyProgress: learningProgress.weeklyProgress + 1,
      };

      setLearningProgress(updatedProgress);
    }
  };

  const checkForNewAchievements = async (progress: LearningProgress) => {
    if (!currentUser) return;

    const newAchievements: string[] = [];

    // Check each achievement condition
    if (progress.totalTopicsRead >= 1 && !achievements.find(a => a.id === 'first_read')?.unlocked) {
      newAchievements.push('first_read');
    }
    if (progress.streakDays >= 3 && !achievements.find(a => a.id === 'streak_3')?.unlocked) {
      newAchievements.push('streak_3');
    }
    if (progress.streakDays >= 7 && !achievements.find(a => a.id === 'streak_7')?.unlocked) {
      newAchievements.push('streak_7');
    }
    if (progress.totalTopicsRead >= 10 && !achievements.find(a => a.id === 'topics_10')?.unlocked) {
      newAchievements.push('topics_10');
    }
    if (progress.weeklyProgress >= progress.weeklyGoal && !achievements.find(a => a.id === 'weekly_goal')?.unlocked) {
      newAchievements.push('weekly_goal');
    }
    if (bookmarkedTopics.length >= 5 && !achievements.find(a => a.id === 'bookmark_master')?.unlocked) {
      newAchievements.push('bookmark_master');
    }
    if (progress.level >= 5 && !achievements.find(a => a.id === 'level_5')?.unlocked) {
      newAchievements.push('level_5');
    }

    // Unlock new achievements
    for (const achievementId of newAchievements) {
      try {
        await DatabaseService.executeUpdate(
          'INSERT INTO user_achievements (user_id, achievement_id, unlocked_date) VALUES (?, ?, ?)',
          [currentUser.id, achievementId, new Date().toISOString()]
        );

        // Update local state
        setAchievements(prev => 
          prev.map(a => 
            a.id === achievementId 
              ? { ...a, unlocked: true, unlockedDate: new Date().toISOString() }
              : a
          )
        );

        // Show achievement popup
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
          setShowAchievement({ ...achievement, unlocked: true });
          setTimeout(() => setShowAchievement(null), 3000);
        }

      } catch (error) {
        console.error('Failed to unlock achievement:', error);
        // If database tables don't exist yet, just update local state
        setAchievements(prev =>
          prev.map(a =>
            a.id === achievementId
              ? { ...a, unlocked: true, unlockedDate: new Date().toISOString() }
              : a
          )
        );

        // Show achievement popup
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
          setShowAchievement({ ...achievement, unlocked: true });
          setTimeout(() => setShowAchievement(null), 3000);
        }
      }
    }
  };

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'diabetes', name: 'Diabetes', icon: '🩸' },
    { id: 'hypertension', name: 'Blood Pressure', icon: '❤️' },
    { id: 'obesity', name: 'Weight Management', icon: '⚖️' },
    { id: 'general', name: 'General Health', icon: '✨' },
  ];

  const filteredTopics = educationTopics.filter(topic => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (topic.author && topic.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading health topics...</Text>
      </View>
    );
  }

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
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Health Education</Text>
            <Text style={styles.subtitle}>Learn to manage your health better</Text>
          </View>
          <TouchableOpacity 
            style={styles.gameButton}
            onPress={() => navigation.navigate('GameScreen')}
          >
            <Text style={styles.gameButtonIcon}>🎮</Text>
            <Text style={styles.gameButtonText}>Games</Text>
          </TouchableOpacity>
        </View>
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

      {/* Learning Progress Dashboard */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Your Learning Journey</Text>
          <Text style={styles.levelBadge}>Level {learningProgress.level}</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{learningProgress.totalTopicsRead}</Text>
            <Text style={styles.statLabel}>Topics Read</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{learningProgress.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak 🔥</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{learningProgress.pointsEarned}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>

        {/* Weekly Goal Progress */}
        <View style={styles.weeklyGoal}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Weekly Goal</Text>
            <Text style={styles.goalProgress}>
              {learningProgress.weeklyProgress}/{learningProgress.weeklyGoal}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((learningProgress.weeklyProgress / learningProgress.weeklyGoal) * 100, 100)}%` }
              ]} 
            />
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.achievementsPreview}>
          <Text style={styles.achievementsTitle}>Recent Achievements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {achievements
              .filter(a => a.unlocked)
              .sort((a, b) => new Date(b.unlockedDate || '').getTime() - new Date(a.unlockedDate || '').getTime())
              .slice(0, 3)
              .map((achievement) => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementPoints}>+{achievement.points}pts</Text>
                </View>
              ))}
            {achievements.filter(a => a.unlocked).length === 0 && (
              <Text style={styles.noAchievements}>Complete your first topic to earn achievements!</Text>
            )}
          </ScrollView>
        </View>
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
          <TouchableOpacity key={topic.id} style={styles.topicItem} onPress={() => navigation.navigate('EducationTopic', { topic })}>
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

    {/* Achievement Popup */}
    {showAchievement && (
      <View style={styles.achievementPopup}>
        <View style={styles.achievementPopupContent}>
          <Text style={styles.achievementPopupIcon}>{showAchievement.icon}</Text>
          <Text style={styles.achievementPopupTitle}>Achievement Unlocked!</Text>
          <Text style={styles.achievementPopupName}>{showAchievement.title}</Text>
          <Text style={styles.achievementPopupDescription}>{showAchievement.description}</Text>
          <Text style={styles.achievementPopupPoints}>+{showAchievement.points} points</Text>
        </View>
      </View>
    )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gameButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  gameButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  // Gamification Styles
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  levelBadge: {
    backgroundColor: '#4CAF50',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  weeklyGoal: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#C8E6C9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  achievementsPreview: {
    marginTop: 4,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  achievementBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 2,
  },
  achievementPoints: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  noAchievements: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Achievement Popup Styles
  achievementPopup: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  achievementPopupContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  achievementPopupIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  achievementPopupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  achievementPopupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementPopupDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  achievementPopupPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default LearnScreen;
