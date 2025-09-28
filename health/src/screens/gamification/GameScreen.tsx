import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '@/components/common/Card';
import AuthenticationService from '@/services/auth/AuthenticationService';
import DatabaseService from '@/database/DatabaseService';

const { width } = Dimensions.get('window');

interface GameStats {
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  totalPoints: number;
  badges: Badge[];
  dailyChallenge: Challenge;
  weeklyQuest: Quest;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  tasks: QuestTask[];
  reward: number;
  completed: boolean;
}

interface QuestTask {
  id: string;
  description: string;
  completed: boolean;
}

const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  const [gameStats, setGameStats] = useState<GameStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    totalPoints: 0,
    badges: [],
    dailyChallenge: {
      id: '1',
      title: 'Health Explorer',
      description: 'Read 2 health articles today',
      icon: '📚',
      progress: 0,
      target: 2,
      reward: 50,
      completed: false,
    },
    weeklyQuest: {
      id: '1',
      title: 'Wellness Warrior',
      description: 'Complete your weekly health journey',
      icon: '⚔️',
      tasks: [
        { id: '1', description: 'Log blood pressure 3 times', completed: false },
        { id: '2', description: 'Read 5 health articles', completed: false },
        { id: '3', description: 'Maintain 3-day streak', completed: false },
      ],
      reward: 200,
      completed: false,
    },
  });

  const [selectedTab, setSelectedTab] = useState<'overview' | 'badges' | 'challenges'>('overview');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadGameData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Pulse animation for active elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadGameData = async () => {
    try {
      const user = await AuthenticationService.getCurrentUser();
      if (user) {
        // Load game stats from database
        const stats = await DatabaseService.executeQuery<GameStats>(
          'SELECT * FROM game_stats WHERE user_id = ?',
          [user.id]
        );
        
        if (stats.length > 0) {
          setGameStats(prev => ({ ...prev, ...stats[0] }));
        }
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  };

  const getBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#95A5A6';
      case 'rare': return '#3498DB';
      case 'epic': return '#9B59B6';
      case 'legendary': return '#F39C12';
      default: return '#95A5A6';
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Level Progress */}
      <Card style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>Health Champion</Text>
          <Text style={styles.levelNumber}>Level {gameStats.level}</Text>
        </View>
        
        <View style={styles.xpContainer}>
          <View style={styles.xpBar}>
            <View 
              style={[
                styles.xpFill, 
                { width: `${(gameStats.xp / gameStats.xpToNext) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.xpText}>
            {gameStats.xp} / {gameStats.xpToNext} XP
          </Text>
        </View>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{gameStats.streak}</Text>
          <Text style={styles.statLabel}>🔥 Day Streak</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{gameStats.totalPoints}</Text>
          <Text style={styles.statLabel}>💎 Total Points</Text>
        </Card>
      </View>

      {/* Daily Challenge */}
      <Card style={styles.challengeCard}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>Daily Challenge</Text>
          <Text style={styles.challengeIcon}>{gameStats.dailyChallenge.icon}</Text>
        </View>
        <Text style={styles.challengeName}>{gameStats.dailyChallenge.title}</Text>
        <Text style={styles.challengeDesc}>{gameStats.dailyChallenge.description}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(gameStats.dailyChallenge.progress / gameStats.dailyChallenge.target) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {gameStats.dailyChallenge.progress}/{gameStats.dailyChallenge.target}
          </Text>
        </View>
        
        <View style={styles.rewardContainer}>
          <Text style={styles.rewardText}>Reward: {gameStats.dailyChallenge.reward} XP</Text>
        </View>
      </Card>
    </View>
  );

  const renderBadges = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Achievement Badges</Text>
      <View style={styles.badgesGrid}>
        {[
          { id: '1', name: 'First Steps', icon: '👶', rarity: 'common', unlocked: true, description: 'Complete your first health log' },
          { id: '2', name: 'Streak Master', icon: '🔥', rarity: 'rare', unlocked: true, description: '7-day logging streak' },
          { id: '3', name: 'Knowledge Seeker', icon: '📚', rarity: 'epic', unlocked: false, description: 'Read 50 health articles' },
          { id: '4', name: 'Health Guardian', icon: '🛡️', rarity: 'legendary', unlocked: false, description: 'Maintain perfect health for 30 days' },
          { id: '5', name: 'Data Master', icon: '📊', rarity: 'rare', unlocked: true, description: 'Log all health metrics in one day' },
          { id: '6', name: 'Wellness Warrior', icon: '⚔️', rarity: 'epic', unlocked: false, description: 'Complete 10 weekly quests' },
        ].map((badge) => (
          <Animated.View
            key={badge.id}
            style={[
              styles.badgeContainer,
              { 
                opacity: badge.unlocked ? 1 : 0.5,
                transform: [{ scale: badge.unlocked ? pulseAnim : 1 }]
              }
            ]}
          >
            <View style={[styles.badge, { borderColor: getBadgeColor(badge.rarity) }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeRarity}>{badge.rarity.toUpperCase()}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderChallenges = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Weekly Quest</Text>
      
      <Card style={styles.questCard}>
        <View style={styles.questHeader}>
          <Text style={styles.questTitle}>{gameStats.weeklyQuest.title}</Text>
          <Text style={styles.questIcon}>{gameStats.weeklyQuest.icon}</Text>
        </View>
        <Text style={styles.questDesc}>{gameStats.weeklyQuest.description}</Text>
        
        <View style={styles.tasksContainer}>
          {gameStats.weeklyQuest.tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <Text style={styles.taskCheck}>
                {task.completed ? '✅' : '⭕'}
              </Text>
              <Text style={[
                styles.taskText,
                { textDecorationLine: task.completed ? 'line-through' : 'none' }
              ]}>
                {task.description}
              </Text>
            </View>
          ))}
        </View>
        
        <View style={styles.questReward}>
          <Text style={styles.questRewardText}>
            🏆 Quest Reward: {gameStats.weeklyQuest.reward} XP
          </Text>
        </View>
      </Card>

      {/* Mini Games */}
      <Text style={styles.sectionTitle}>Health Mini-Games</Text>
      
      <View style={styles.miniGamesGrid}>
        <TouchableOpacity 
          style={styles.miniGameCard}
          onPress={() => (navigation as any).navigate('HealthQuizGame')}
        >
          <Text style={styles.miniGameIcon}>🧠</Text>
          <Text style={styles.miniGameTitle}>Health Quiz</Text>
          <Text style={styles.miniGameDesc}>Test your knowledge</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.miniGameCard}>
          <Text style={styles.miniGameIcon}>🎯</Text>
          <Text style={styles.miniGameTitle}>Goal Setter</Text>
          <Text style={styles.miniGameDesc}>Set daily targets</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Health Games</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { id: 'overview', label: 'Overview', icon: '🏠' },
          { id: 'badges', label: 'Badges', icon: '🏆' },
          { id: 'challenges', label: 'Quests', icon: '⚔️' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab(tab.id as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              selectedTab === tab.id && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0],
              })
            }]
          }}
        >
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'badges' && renderBadges()}
          {selectedTab === 'challenges' && renderChallenges()}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#E8F5E8',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  levelCard: {
    marginBottom: 20,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  xpContainer: {
    marginTop: 8,
  },
  xpBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  xpText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  challengeCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 4,
  },
  rewardContainer: {
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeContainer: {
    width: (width - 60) / 2,
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeRarity: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  questCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  questIcon: {
    fontSize: 24,
  },
  questDesc: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  tasksContainer: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCheck: {
    fontSize: 16,
    marginRight: 12,
  },
  taskText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  questReward: {
    backgroundColor: '#F3E5F5',
    padding: 12,
    borderRadius: 8,
  },
  questRewardText: {
    fontSize: 16,
    color: '#9C27B0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  miniGamesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniGameCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  miniGameIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  miniGameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  miniGameDesc: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default GameScreen;
