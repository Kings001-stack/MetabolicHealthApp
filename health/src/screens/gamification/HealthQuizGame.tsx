import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '@/components/common/Card';

const { width } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: 'diabetes' | 'hypertension' | 'nutrition' | 'exercise';
}

const HealthQuizGame: React.FC = () => {
  const navigation = useNavigation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  const questions: Question[] = [
    {
      id: 1,
      question: "What is a normal blood pressure reading?",
      options: ["120/80 mmHg", "140/90 mmHg", "160/100 mmHg", "180/110 mmHg"],
      correctAnswer: 0,
      explanation: "Normal blood pressure is typically around 120/80 mmHg. Higher readings may indicate hypertension.",
      category: 'hypertension'
    },
    {
      id: 2,
      question: "Which food has the highest impact on blood sugar?",
      options: ["Broccoli", "White bread", "Chicken breast", "Olive oil"],
      correctAnswer: 1,
      explanation: "White bread is high in refined carbohydrates, which cause rapid spikes in blood sugar levels.",
      category: 'diabetes'
    },
    {
      id: 3,
      question: "How much exercise is recommended per week for adults?",
      options: ["30 minutes", "75 minutes", "150 minutes", "300 minutes"],
      correctAnswer: 2,
      explanation: "Adults should get at least 150 minutes of moderate-intensity aerobic activity per week.",
      category: 'exercise'
    },
    {
      id: 4,
      question: "What is the recommended daily water intake?",
      options: ["4 cups", "6 cups", "8 cups", "12 cups"],
      correctAnswer: 2,
      explanation: "The general recommendation is about 8 cups (64 ounces) of water per day, though needs vary by individual.",
      category: 'nutrition'
    },
    {
      id: 5,
      question: "What is a healthy HbA1c level for most adults with diabetes?",
      options: ["Below 5%", "Below 7%", "Below 9%", "Below 11%"],
      correctAnswer: 1,
      explanation: "For most adults with diabetes, an HbA1c level below 7% is recommended to reduce complications.",
      category: 'diabetes'
    }
  ];

  useEffect(() => {
    if (!gameComplete && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp();
    }
  }, [timeLeft, gameComplete, showResult]);

  const handleTimeUp = () => {
    setSelectedAnswer(null);
    setShowResult(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
      // Correct answer animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setGameComplete(true);
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "🏆 Excellent! You're a health expert!";
    if (percentage >= 60) return "👍 Good job! Keep learning!";
    if (percentage >= 40) return "📚 Not bad! Room for improvement!";
    return "💪 Keep studying! You'll get better!";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'diabetes': return '#E91E63';
      case 'hypertension': return '#F44336';
      case 'nutrition': return '#4CAF50';
      case 'exercise': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  if (gameComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Complete!</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.resultContainer}>
          <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.resultIcon}>🎉</Text>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>
              You scored {score} out of {questions.length}
            </Text>
            <Text style={styles.percentageText}>
              {Math.round((score / questions.length) * 100)}%
            </Text>
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
            
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>
                🏆 You earned {score * 10} XP!
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={() => {
                setCurrentQuestion(0);
                setScore(0);
                setGameComplete(false);
                setSelectedAnswer(null);
                setShowResult(false);
                setTimeLeft(30);
              }}
            >
              <Text style={styles.playAgainText}>Play Again</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  const question = questions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Health Quiz</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.gameContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestion + 1) / questions.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestion + 1} / {questions.length}
          </Text>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={[
            styles.timerText,
            { color: timeLeft <= 10 ? '#F44336' : '#4CAF50' }
          ]}>
            ⏰ {timeLeft}s
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question Card */}
          <Card style={[styles.questionCard, { borderLeftColor: getCategoryColor(question.category) }]}>
            <View style={styles.categoryBadge}>
              <Text style={[styles.categoryText, { color: getCategoryColor(question.category) }]}>
                {question.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.questionText}>{question.question}</Text>
          </Card>

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === index && styles.selectedOption,
                  showResult && index === question.correctAnswer && styles.correctOption,
                  showResult && selectedAnswer === index && index !== question.correctAnswer && styles.wrongOption,
                ]}
                onPress={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.selectedOptionText,
                  showResult && index === question.correctAnswer && styles.correctOptionText,
                ]}>
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
                {showResult && index === question.correctAnswer && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
                {showResult && selectedAnswer === index && index !== question.correctAnswer && (
                  <Text style={styles.xMark}>✗</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Explanation */}
          {showResult && (
            <Card style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>Explanation:</Text>
              <Text style={styles.explanationText}>{question.explanation}</Text>
              
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        </Animated.View>
      </View>
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
  gameContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  questionCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  wrongOption: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  xMark: {
    fontSize: 20,
    color: '#F44336',
    fontWeight: 'bold',
  },
  explanationCard: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  scoreMessage: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HealthQuizGame;
