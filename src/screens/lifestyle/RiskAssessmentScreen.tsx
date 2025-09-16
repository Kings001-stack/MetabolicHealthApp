import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

interface RiskFactor {
  id: string;
  question: string;
  type: 'boolean' | 'number' | 'select';
  options?: string[];
  weight: number;
}

const riskFactors: RiskFactor[] = [
  {
    id: 'age',
    question: 'Are you over 45 years old?',
    type: 'boolean',
    weight: 2,
  },
  {
    id: 'family-history',
    question: 'Do you have a family history of diabetes?',
    type: 'boolean',
    weight: 3,
  },
  {
    id: 'weight',
    question: 'Are you overweight (BMI > 25)?',
    type: 'boolean',
    weight: 2,
  },
  {
    id: 'exercise',
    question: 'Do you exercise less than 3 times per week?',
    type: 'boolean',
    weight: 2,
  },
  {
    id: 'blood-pressure',
    question: 'Do you have high blood pressure?',
    type: 'boolean',
    weight: 3,
  },
  {
    id: 'cholesterol',
    question: 'Do you have high cholesterol?',
    type: 'boolean',
    weight: 2,
  },
  {
    id: 'smoking',
    question: 'Do you smoke or use tobacco?',
    type: 'boolean',
    weight: 2,
  },
  {
    id: 'sleep',
    question: 'Do you get less than 7 hours of sleep per night?',
    type: 'boolean',
    weight: 1,
  },
];

const RiskAssessmentScreen: React.FC = () => {
  const [answers, setAnswers] = useState<{ [key: string]: boolean }>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (factorId: string, value: boolean) => {
    setAnswers(prev => ({
      ...prev,
      [factorId]: value,
    }));
  };

  const calculateRiskScore = () => {
    return riskFactors.reduce((total, factor) => {
      return total + (answers[factor.id] ? factor.weight : 0);
    }, 0);
  };

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { level: 'Low', color: '#4CAF50', description: 'Your risk is relatively low. Continue healthy habits!' };
    if (score <= 7) return { level: 'Moderate', color: '#FF9800', description: 'You have some risk factors. Consider lifestyle changes.' };
    return { level: 'High', color: '#F44336', description: 'You have multiple risk factors. Consult with a healthcare provider.' };
  };

  const getRecommendations = (score: number) => {
    const recommendations = [];
    
    if (answers['exercise']) {
      recommendations.push('Start a regular exercise routine - aim for 150 minutes per week');
    }
    if (answers['weight']) {
      recommendations.push('Work on achieving a healthy weight through diet and exercise');
    }
    if (answers['sleep']) {
      recommendations.push('Improve sleep hygiene - aim for 7-9 hours per night');
    }
    if (answers['smoking']) {
      recommendations.push('Consider quitting smoking - seek support from healthcare providers');
    }
    if (answers['blood-pressure'] || answers['cholesterol']) {
      recommendations.push('Monitor and manage your cardiovascular health regularly');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue your healthy lifestyle habits');
      recommendations.push('Regular health check-ups with your doctor');
    }

    return recommendations;
  };

  const resetAssessment = () => {
    setAnswers({});
    setShowResults(false);
  };

  const completeAssessment = () => {
    setShowResults(true);
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = riskFactors.length;
  const isComplete = answeredQuestions === totalQuestions;

  if (showResults) {
    const score = calculateRiskScore();
    const risk = getRiskLevel(score);
    const recommendations = getRecommendations(score);

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Risk Assessment Results</Text>
          <Text style={styles.subtitle}>Your metabolic health risk evaluation</Text>
        </View>

        <Card style={[styles.resultCard, { borderColor: risk.color }]}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Your Risk Score</Text>
            <Text style={[styles.scoreValue, { color: risk.color }]}>{score}/16</Text>
            <View style={[styles.riskBadge, { backgroundColor: risk.color }]}>
              <Text style={styles.riskLevel}>{risk.level} Risk</Text>
            </View>
          </View>
          <Text style={styles.riskDescription}>{risk.description}</Text>
        </Card>

        <Card style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendation}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Important Notice</Text>
          <Text style={styles.disclaimerText}>
            This assessment is for educational purposes only and should not replace professional medical advice. 
            Please consult with a healthcare provider for personalized health recommendations.
          </Text>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            title="Retake Assessment"
            onPress={resetAssessment}
            variant="outline"
            style={styles.retakeButton}
          />
          <Button
            title="Save Results"
            onPress={() => console.log('Save results')}
            variant="primary"
            style={styles.saveButton}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Risk Assessment</Text>
        <Text style={styles.subtitle}>Evaluate your metabolic health risk factors</Text>
      </View>

      <Card style={styles.progressCard}>
        <Text style={styles.progressText}>
          Progress: {answeredQuestions}/{totalQuestions} questions
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(answeredQuestions / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </Card>

      <View style={styles.questionsList}>
        {riskFactors.map((factor, index) => (
          <Card key={factor.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>Question {index + 1}</Text>
            <Text style={styles.questionText}>{factor.question}</Text>
            
            <View style={styles.answerButtons}>
              <TouchableOpacity
                style={[
                  styles.answerButton,
                  answers[factor.id] === true && styles.answerButtonSelected,
                ]}
                onPress={() => handleAnswer(factor.id, true)}
              >
                <Text
                  style={[
                    styles.answerButtonText,
                    answers[factor.id] === true && styles.answerButtonTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.answerButton,
                  answers[factor.id] === false && styles.answerButtonSelected,
                ]}
                onPress={() => handleAnswer(factor.id, false)}
              >
                <Text
                  style={[
                    styles.answerButtonText,
                    answers[factor.id] === false && styles.answerButtonTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.completeSection}>
        <Button
          title="Complete Assessment"
          onPress={completeAssessment}
          variant="primary"
          disabled={!isComplete}
          style={[styles.completeButton, !isComplete && styles.disabledButton]}
        />
        {!isComplete && (
          <Text style={styles.completeHint}>
            Please answer all questions to see your results
          </Text>
        )}
      </View>

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
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  questionsList: {
    paddingHorizontal: 20,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 24,
  },
  answerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  answerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  answerButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  answerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  answerButtonTextSelected: {
    color: '#FFFFFF',
  },
  completeSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButton: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.5,
  },
  completeHint: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  resultCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  riskDescription: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  recommendationsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    lineHeight: 20,
  },
  disclaimerCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF3E0',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retakeButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RiskAssessmentScreen;
