
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';

const featuredRecipes = [
    {
      id: '1',
      name: 'Diabetic-Friendly Pancakes',
      prepTime: '15 min',
      difficulty: 'Easy',
      rating: 4.5,
      carbs: 25,
    },
    {
      id: '2',
      name: 'Mediterranean Quinoa Bowl',
      prepTime: '20 min',
      difficulty: 'Medium',
      rating: 4.8,
      carbs: 35,
    },
    {
      id: '3',
      name: 'Low-Carb Zucchini Noodles',
      prepTime: '10 min',
      difficulty: 'Easy',
      rating: 4.3,
      carbs: 8,
    },
  ];

const MealRecipesScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Meal Recipes</Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContainer}>
            <Card style={styles.searchCard}>
                <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                />
            </Card>

            <Card style={styles.recipesCard}>
                <Text style={styles.sectionTitle}>Featured Recipes</Text>
                <Text style={styles.sectionSubtitle}>Diabetes-friendly meals</Text>
                
                {featuredRecipes.map((recipe) => (
                <TouchableOpacity key={recipe.id} style={styles.recipeItem}>
                    <View style={styles.recipeImagePlaceholder}>
                    <Text style={styles.recipeImageIcon}>🍽️</Text>
                    </View>
                    <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <View style={styles.recipeDetails}>
                        <Text style={styles.recipeDetail}>⏱️ {recipe.prepTime}</Text>
                        <Text style={styles.recipeDetail}>📊 {recipe.difficulty}</Text>
                        <Text style={styles.recipeDetail}>⭐ {recipe.rating}</Text>
                    </View>
                    <Text style={styles.recipeCarbs}>{recipe.carbs}g carbs</Text>
                    </View>
                    <Text style={styles.recipeArrow}>›</Text>
                </TouchableOpacity>
                ))}
            </Card>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
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
    searchCard: {
        marginBottom: 16,
    },
    searchInput: {
        marginVertical: 0,
    },
    recipesCard: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 16,
    },
    recipeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    recipeImagePlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recipeImageIcon: {
        fontSize: 24,
    },
    recipeInfo: {
        flex: 1,
    },
    recipeName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 4,
    },
    recipeDetails: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    recipeDetail: {
        fontSize: 12,
        color: '#666666',
        marginRight: 12,
    },
    recipeCarbs: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    recipeArrow: {
        fontSize: 18,
        color: '#CCCCCC',
    },
});

export default MealRecipesScreen;
