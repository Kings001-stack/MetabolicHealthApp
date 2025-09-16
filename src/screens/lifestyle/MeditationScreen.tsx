import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'mindfulness' | 'body-scan' | 'loving-kindness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
}

const meditationSessions: MeditationSession[] = [
  {
    id: 'basic-breathing',
    title: 'Basic Breathing Meditation',
    description: 'Simple breath awareness practice perfect for beginners',
    duration: 5,
    type: 'breathing',
    difficulty: 'beginner',
    instructions: [
      'Sit comfortably with your back straight',
      'Close your eyes or soften your gaze',
      'Focus on your natural breath',
      'When your mind wanders, gently return to the breath',
      'Continue for the full duration',
    ],
  },
  {
    id: '4-7-8-breathing',
    title: '4-7-8 Breathing Technique',
    description: 'Calming breath pattern to reduce stress and anxiety',
    duration: 3,
    type: 'breathing',
    difficulty: 'beginner',
    instructions: [
      'Inhale through your nose for 4 counts',
      'Hold your breath for 7 counts',
      'Exhale through your mouth for 8 counts',
      'Repeat this cycle 4 times',
      'Return to normal breathing',
    ],
  },
  {
    id: 'body-scan',
    title: 'Progressive Body Scan',
    description: 'Systematic relaxation of the entire body',
    duration: 15,
    type: 'body-scan',
    difficulty: 'intermediate',
    instructions: [
      'Lie down comfortably on your back',
      'Start by focusing on your toes',
      'Gradually move attention up through each body part',
      'Notice any tension and consciously relax',
      'End at the top of your head',
    ],
  },
  {
    id: 'mindful-awareness',
    title: 'Mindful Awareness Practice',
    description: 'Observe thoughts and feelings without judgment',
    duration: 10,
    type: 'mindfulness',
    difficulty: 'intermediate',
    instructions: [
      'Sit in a comfortable position',
      'Focus on your breath initially',
      'Notice thoughts as they arise',
      'Observe without getting caught up in them',
      'Return attention to the present moment',
    ],
  },
  {
    id: 'loving-kindness',
    title: 'Loving-Kindness Meditation',
    description: 'Cultivate compassion for yourself and others',
    duration: 12,
    type: 'loving-kindness',
    difficulty: 'advanced',
    instructions: [
      'Begin by sending love to yourself',
      'Extend loving wishes to loved ones',
      'Include neutral people in your life',
      'Send compassion to difficult people',
      'Expand to all living beings',
    ],
  },
];

const MeditationScreen: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'breathing' | 'mindfulness' | 'body-scan' | 'loving-kindness'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const filteredSessions = meditationSessions.filter(session => {
    const matchesType = selectedType === 'all' || session.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || session.difficulty === selectedDifficulty;
    return matchesType && matchesDifficulty;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'breathing': return '#4CAF50';
      case 'mindfulness': return '#2196F3';
      case 'body-scan': return '#9C27B0';
      case 'loving-kindness': return '#E91E63';
      default: return '#666666';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666666';
    }
  };

  const startSession = (session: MeditationSession) => {
    setActiveSession(session);
    setSessionTime(session.duration * 60); // Convert to seconds
    setIsSessionActive(true);
  };

  const stopSession = () => {
    setActiveSession(null);
    setIsSessionActive(false);
    setSessionTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && sessionTime > 0) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          if (prev <= 1) {
            setIsSessionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, sessionTime]);

  if (activeSession) {
    return (
      <View style={styles.sessionContainer}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>{activeSession.title}</Text>
          <TouchableOpacity onPress={stopSession} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
          <View style={styles.progressRing}>
            <View 
              style={[
                styles.progressFill,
                { 
                  transform: [{ 
                    rotate: `${((activeSession.duration * 60 - sessionTime) / (activeSession.duration * 60)) * 360}deg` 
                  }] 
                }
              ]} 
            />
          </View>
        </View>

        <Card style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Follow these steps:</Text>
          {activeSession.instructions.map((instruction, index) => (
            <Text key={index} style={styles.instructionItem}>
              {index + 1}. {instruction}
            </Text>
          ))}
        </Card>

        <View style={styles.sessionControls}>
          <Button
            title={isSessionActive ? "Pause" : "Resume"}
            onPress={() => setIsSessionActive(!isSessionActive)}
            variant="outline"
            style={styles.controlButton}
          />
          <Button
            title="End Session"
            onPress={stopSession}
            variant="primary"
            style={styles.controlButton}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Meditation & Mindfulness</Text>
        <Text style={styles.subtitle}>Find peace and reduce stress through meditation</Text>
      </View>

      <Card style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Benefits of Meditation</Text>
        <View style={styles.benefitsList}>
          <Text style={styles.benefit}>• Reduces stress and anxiety</Text>
          <Text style={styles.benefit}>• Improves focus and concentration</Text>
          <Text style={styles.benefit}>• Enhances emotional well-being</Text>
          <Text style={styles.benefit}>• Promotes better sleep</Text>
          <Text style={styles.benefit}>• Supports metabolic health</Text>
        </View>
      </Card>

      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Meditation Type</Text>
        <View style={styles.filterButtons}>
          {['all', 'breathing', 'mindfulness', 'body-scan', 'loving-kindness'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && styles.filterButtonActive,
                selectedType === type && { backgroundColor: getTypeColor(type) },
              ]}
              onPress={() => setSelectedType(type as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === type && styles.filterButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
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

      <View style={styles.sessionsList}>
        {filteredSessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionCardHeader}>
              <Text style={styles.sessionCardTitle}>{session.title}</Text>
              <View style={styles.badges}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(session.type) },
                  ]}
                >
                  <Text style={styles.badgeText}>{session.type.replace('-', ' ')}</Text>
                </View>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(session.difficulty) },
                  ]}
                >
                  <Text style={styles.badgeText}>{session.difficulty}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sessionDescription}>{session.description}</Text>

            <View style={styles.sessionDetails}>
              <Text style={styles.durationText}>Duration: {session.duration} minutes</Text>
            </View>

            <Button
              title="Start Session"
              onPress={() => startSession(session)}
              variant="primary"
              style={styles.startButton}
            />
          </Card>
        ))}
      </View>

      {filteredSessions.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No meditation sessions found</Text>
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
  benefitsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#E8F5E8',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  benefitsList: {
    paddingLeft: 8,
  },
  benefit: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 6,
    lineHeight: 20,
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
  sessionsList: {
    paddingHorizontal: 20,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    alignItems: 'flex-end',
  },
  typeBadge: {
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
  sessionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  sessionContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#4CAF50',
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  instructionItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 20,
  },
  sessionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 8,
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

export default MeditationScreen;
