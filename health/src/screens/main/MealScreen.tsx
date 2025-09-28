import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import SuccessOverlay from '@/components/common/SuccessOverlay';
import AuthenticationService from '@/services/auth/AuthenticationService';
import MealService, { DailyTotals, Meal, MealItem } from '@/services/meals/MealService';
import NutritionService, { NutritionSearchItem } from '@/services/nutrition/NutritionService';

interface MealPlan {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  image?: string;
}

const MealScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'plans' | 'recipes' | 'counter' | 'hydration'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [waterIntake, setWaterIntake] = useState(0); // glasses consumed
  const [dailyWaterGoal] = useState(8); // glasses target
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const GLASS_ML = 250;

  // Food search and daily totals state
  const [foodSearchResults, setFoodSearchResults] = useState<NutritionSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  
  // Success overlay state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Recent meals state
  const [recentMeals, setRecentMeals] = useState<Meal[]>([]);
  const [recentMealItems, setRecentMealItems] = useState<MealItem[]>([]);

  useEffect(() => {
    const init = async () => {
      const user = await AuthenticationService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        try {
          const amountMl = await MealService.getHydrationByDate(user.id);
          const glasses = Math.max(0, Math.round(amountMl / GLASS_ML));
          setWaterIntake(glasses);
          
          // Load daily nutrition totals
          const totals = await MealService.getDailyTotals(user.id);
          setDailyTotals(totals);
          
          // Load recent meals
          const meals = await MealService.listMealsByDate(user.id);
          setRecentMeals(meals);
        } catch (e) {
          // Keep default if load fails
        }
      }
    };
    init();
  }, []);

  const todayMeals: MealPlan[] = [
    {
      id: '1',
      name: 'Oatmeal with Berries',
      type: 'breakfast',
      calories: 320,
      carbs: 45,
      protein: 12,
      fat: 8,
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      type: 'lunch',
      calories: 380,
      carbs: 15,
      protein: 35,
      fat: 18,
    },
    {
      id: '3',
      name: 'Baked Salmon with Vegetables',
      type: 'dinner',
      calories: 420,
      carbs: 20,
      protein: 40,
      fat: 22,
    },
  ];

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

  const handleTabChange = (tab: typeof selectedTab) => {
    if (tab === 'recipes') {
      navigation.navigate('MealRecipes');
    } else {
      setSelectedTab(tab);
    }
  };

  const handleAddWater = async () => {
    if (waterIntake < dailyWaterGoal) {
      const next = waterIntake + 1;
      setWaterIntake(next);
      if (currentUserId) {
        try {
          await MealService.saveHydration(currentUserId, next * GLASS_ML);
          setSuccessMessage(`Added glass of water! ${next}/${dailyWaterGoal} glasses`);
          setShowSuccess(true);
        } catch (e) {
          Alert.alert('Error', 'Failed to save hydration data');
        }
      }
    }
  };

  const handleRemoveWater = async () => {
    if (waterIntake > 0) {
      const next = waterIntake - 1;
      setWaterIntake(next);
      if (currentUserId) {
        try {
          await MealService.saveHydration(currentUserId, next * GLASS_ML);
          setSuccessMessage(`Removed glass of water. ${next}/${dailyWaterGoal} glasses`);
          setShowSuccess(true);
        } catch (e) {
          Alert.alert('Error', 'Failed to save hydration data');
        }
      }
    }
  };

  const handleFoodSearch = async (query: string) => {
    if (!query.trim()) {
      setFoodSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await NutritionService.searchFoods(query.trim());
      setFoodSearchResults(results);
    } catch (e) {
      console.error('Food search failed:', e);
      setFoodSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFoodItem = async (item: NutritionSearchItem) => {
    if (!currentUserId) return;
    try {
      // Get food details for nutrition info
      const details = await NutritionService.getFoodDetails(item.fdcId);
      const mealId = await MealService.getOrCreateDailyMeal(currentUserId);
      
      // Add item with nutrition data
      await MealService.addMealItem({
        meal_id: mealId,
        food_name: details.description,
        brand_name: details.brandOwner || null,
        serving_qty: 1,
        serving_unit: 'serving',
        calories: details.labelNutrients?.calories?.value || 0,
        carbs: details.labelNutrients?.carbohydrates?.value || 0,
        protein: details.labelNutrients?.protein?.value || 0,
        fat: details.labelNutrients?.fat?.value || 0,
      });
      
      // Refresh daily totals and recent meals
      const totals = await MealService.getDailyTotals(currentUserId);
      setDailyTotals(totals);
      const meals = await MealService.listMealsByDate(currentUserId);
      setRecentMeals(meals);
      
      // Show success overlay
      setSuccessMessage(`Added ${details.description} to your meal log`);
      setShowSuccess(true);
      
      // Clear search
      setSearchQuery('');
      setFoodSearchResults([]);
    } catch (e) {
      console.error('Failed to add food item:', e);
    }
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  const renderMealPlans = () => (
    <View>
      <Card style={styles.mealPlanCard}>
        <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
        <Text style={styles.sectionSubtitle}>Balanced nutrition for diabetes management</Text>
        
        {todayMeals.map((meal) => (
          <TouchableOpacity key={meal.id} style={styles.mealItem}>
            <View style={styles.mealHeader}>
              <View style={styles.mealInfo}>
                <Text style={styles.mealIcon}>{getMealIcon(meal.type)}</Text>
                <View style={styles.mealDetails}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealType}>{meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</Text>
                </View>
              </View>
              <Text style={styles.mealArrow}>›</Text>
            </View>
            <View style={styles.nutritionInfo}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.calories}</Text>
                <Text style={styles.nutritionLabel}>cal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.fat}g</Text>
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        <Button
          title="View Weekly Meal Plans"
          onPress={() => navigation.navigate('WeeklyPlan')}
          variant="outline"
          size="medium"
          style={styles.viewPlansButton}
        />
      </Card>

      <Card style={styles.nutritionSummaryCard}>
        <Text style={styles.sectionTitle}>Daily Nutrition Summary</Text>
        <View style={styles.nutritionSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{dailyTotals.calories.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total Calories</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((dailyTotals.calories / 2000) * 100, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{dailyTotals.carbs.toFixed(1)}g</Text>
            <Text style={styles.summaryLabel}>Carbohydrates</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((dailyTotals.carbs / 250) * 100, 100)}%` }]} />
            </View>
          </View>
        </View>
      </Card>
      
      {recentMeals.length > 0 && (
        <Card style={styles.recentMealsCard}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          <Text style={styles.sectionSubtitle}>Your logged meals today</Text>
          {recentMeals.slice(0, 3).map((meal) => (
            <TouchableOpacity key={meal.id} style={styles.recentMealItem}>
              <View style={styles.recentMealInfo}>
                <Text style={styles.recentMealName}>{meal.name}</Text>
                <Text style={styles.recentMealDate}>
                  {new Date(meal.created_at || meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.recentMealNutrition}>
                <Text style={styles.recentMealCalories}>{meal.total_calories?.toFixed(0) || '0'} cal</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </View>
  );

  const renderRecipes = () => (
    <View>
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
    </View>
  );

  const renderCarbCounter = () => (
    <View>
      <Card style={styles.carbCounterCard}>
        <Text style={styles.sectionTitle}>Carb Counter</Text>
        <Text style={styles.sectionSubtitle}>Track your daily carbohydrate intake</Text>
        
        <Input
          placeholder="Search food items..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleFoodSearch(text);
          }}
          style={styles.searchInput}
        />
        
        {isSearching && (
          <Text style={styles.searchStatus}>Searching...</Text>
        )}
        
        {foodSearchResults.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            {foodSearchResults.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.fdcId}
                style={styles.searchResultItem}
                onPress={() => handleAddFoodItem(item)}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{item.description}</Text>
                  {item.brandOwner && (
                    <Text style={styles.searchResultBrand}>{item.brandOwner}</Text>
                  )}
                </View>
                <Text style={styles.addButton}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <View style={styles.quickFoods}>
          <Text style={styles.quickFoodsTitle}>Quick Add</Text>
          <View style={styles.quickFoodsGrid}>
            {['Apple', 'Banana', 'Rice', 'Bread', 'Pasta', 'Potato'].map((food) => (
              <TouchableOpacity
                key={food}
                style={styles.quickFoodItem}
                onPress={() => handleFoodSearch(food)}
              >
                <Text style={styles.quickFoodText}>{food}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.carbSummary}>
          <Text style={styles.carbSummaryTitle}>Today's Nutrition</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionGridValue}>{dailyTotals.calories.toFixed(0)}</Text>
              <Text style={styles.nutritionGridLabel}>calories</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionGridValue}>{dailyTotals.carbs.toFixed(1)}g</Text>
              <Text style={styles.nutritionGridLabel}>carbs</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionGridValue}>{dailyTotals.protein.toFixed(1)}g</Text>
              <Text style={styles.nutritionGridLabel}>protein</Text>
            </View>
            <View style={styles.nutritionGridItem}>
              <Text style={styles.nutritionGridValue}>{dailyTotals.fat.toFixed(1)}g</Text>
              <Text style={styles.nutritionGridLabel}>fat</Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderHydration = () => (
    <View>
      <Card style={styles.hydrationCard}>
        <Text style={styles.sectionTitle}>Hydration Tracker</Text>
        <Text style={styles.sectionSubtitle}>Stay hydrated throughout the day</Text>
        
        <View style={styles.waterProgress}>
          <Text style={styles.waterGoal}>{waterIntake} / {dailyWaterGoal} glasses</Text>
          <View style={styles.waterProgressBar}>
            <View 
              style={[
                styles.waterProgressFill, 
                { width: `${(waterIntake / dailyWaterGoal) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.waterPercentage}>
            {Math.round((waterIntake / dailyWaterGoal) * 100)}% of daily goal
          </Text>
        </View>
        
        <View style={styles.waterGlasses}>
          {Array.from({ length: dailyWaterGoal }, (_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.waterGlass,
                index < waterIntake && styles.waterGlassFilled,
              ]}
              onPress={() => {
                if (index < waterIntake) {
                  setWaterIntake(index);
                } else if (index === waterIntake) {
                  handleAddWater();
                }
              }}
            >
              <Text style={styles.waterGlassIcon}>
                {index < waterIntake ? '💧' : '🥛'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.waterActions}>
          <Button
            title="Add Glass"
            onPress={handleAddWater}
            variant="primary"
            size="medium"
            style={styles.waterButton}
            disabled={waterIntake >= dailyWaterGoal}
          />
          <Button
            title="Remove"
            onPress={handleRemoveWater}
            variant="outline"
            size="medium"
            style={styles.waterButton}
            disabled={waterIntake <= 0}
          />
        </View>
        
        <View style={styles.hydrationTips}>
          <Text style={styles.tipsTitle}>💡 Hydration Tips</Text>
          <Text style={styles.tipText}>• Drink water before, during, and after meals</Text>
          <Text style={styles.tipText}>• Add lemon or cucumber for flavor</Text>
          <Text style={styles.tipText}>• Set reminders to drink water regularly</Text>
        </View>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nutrition & Meals</Text>
        <Text style={styles.subtitle}>Plan your healthy eating journey</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'plans', label: 'Meal Plans', icon: '🍽️' },
            { key: 'recipes', label: 'Recipes', icon: '👨‍🍳' },
            { key: 'counter', label: 'Carb Counter', icon: '🔢' },
            { key: 'hydration', label: 'Hydration', icon: '💧' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.tabActive,
              ]}
              onPress={() => handleTabChange(tab.key as typeof selectedTab)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'plans' && renderMealPlans()}
        {selectedTab === 'recipes' && renderRecipes()}
        {selectedTab === 'counter' && renderCarbCounter()}
        {selectedTab === 'hydration' && renderHydration()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <SuccessOverlay
        visible={showSuccess}
        message={successMessage}
        onHide={() => setShowSuccess(false)}
      />
    </SafeAreaView>
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
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  mealPlanCard: {
    marginBottom: 16,
  },
  mealItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  mealType: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  mealArrow: {
    fontSize: 18,
    color: '#CCCCCC',
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  viewPlansButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  nutritionSummaryCard: {
    marginBottom: 16,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
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
  carbCounterCard: {
    marginBottom: 16,
  },
  quickFoods: {
    marginVertical: 16,
  },
  quickFoodsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  quickFoodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickFoodItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickFoodText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  carbSummary: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  carbSummaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  carbSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  searchStatus: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginVertical: 8,
  },
  searchResults: {
    marginVertical: 12,
    maxHeight: 200,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 4,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  searchResultBrand: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  addButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    paddingHorizontal: 8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  nutritionGridItem: {
    alignItems: 'center',
  },
  nutritionGridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nutritionGridLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  hydrationCard: {
    marginBottom: 16,
  },
  waterProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  waterGoal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  waterProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    marginBottom: 8,
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  waterPercentage: {
    fontSize: 14,
    color: '#666666',
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  waterGlass: {
    width: 40,
    height: 40,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  waterGlassFilled: {
    backgroundColor: '#E3F2FD',
  },
  waterGlassIcon: {
    fontSize: 20,
  },
  waterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  waterButton: {
    flex: 0.4,
    borderRadius: 8,
  },
  hydrationTips: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 20,
  },
  recentMealsCard: {
    marginBottom: 16,
  },
  recentMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentMealInfo: {
    flex: 1,
  },
  recentMealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  recentMealDate: {
    fontSize: 12,
    color: '#666666',
  },
  recentMealNutrition: {
    alignItems: 'flex-end',
  },
  recentMealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
});

export default MealScreen;
