
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const mockWeeklyPlan = {
  monday: {
    meals: { breakfast: 'Oatmeal', lunch: 'Salad', dinner: 'Chicken' },
    exercise: '30 min walk',
  },
  tuesday: {
    meals: { breakfast: 'Eggs', lunch: 'Sandwich', dinner: 'Fish' },
    exercise: 'Yoga',
  },
  wednesday: {
    meals: { breakfast: 'Smoothie', lunch: 'Soup', dinner: 'Pasta' },
    exercise: '30 min walk',
  },
  thursday: {
    meals: { breakfast: 'Yogurt', lunch: 'Salad', dinner: 'Chicken' },
    exercise: 'Strength training',
  },
  friday: {
    meals: { breakfast: 'Oatmeal', lunch: 'Sandwich', dinner: 'Fish' },
    exercise: '30 min walk',
  },
  saturday: {
    meals: { breakfast: 'Pancakes', lunch: 'Leftovers', dinner: 'Pizza' },
    exercise: 'Hiking',
  },
  sunday: {
    meals: { breakfast: 'Eggs', lunch: 'Salad', dinner: 'Roast' },
    exercise: 'Rest',
  },
};

const WeeklyPlanScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weekly Plan</Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {Object.entries(mockWeeklyPlan).map(([day, plan]) => (
          <View key={day} style={styles.dayContainer}>
            <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <View style={styles.planDetails}>
              <View style={styles.mealPlan}>
                <Text style={styles.planTitle}>Meals</Text>
                <Text>Breakfast: {plan.meals.breakfast}</Text>
                <Text>Lunch: {plan.meals.lunch}</Text>
                <Text>Dinner: {plan.meals.dinner}</Text>
              </View>
              <View style={styles.exercisePlan}>
                <Text style={styles.planTitle}>Exercise</Text>
                <Text>{plan.exercise}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 20,
  },
  dayContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealPlan: {
    flex: 1,
  },
  exercisePlan: {
    flex: 1,
    marginLeft: 20,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default WeeklyPlanScreen;
