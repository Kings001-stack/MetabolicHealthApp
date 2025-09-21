import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Main Screens
import HomeScreen from '@/screens/main/HomeScreen';
import LogScreen from '@/screens/main/LogScreen';
import MealScreen from '@/screens/main/MealScreen';
import LearnScreen from '@/screens/main/LearnScreen';
import MoreScreen from '@/screens/main/MoreScreen';

// Types
import { MainTabParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
);

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Meal"
        component={MealScreen}
        options={{
          tabBarLabel: 'Meal',
          tabBarIcon: ({ focused }) => <TabIcon icon="🍽️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default TabNavigator;
