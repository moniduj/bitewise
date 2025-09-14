import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import ChatScreen from './screens/ChatScreen';
import CartScreen from './screens/CartScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import SummaryScreen from './screens/SummaryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Cart') {
              iconName = focused ? 'basket' : 'basket-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Summary') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ title: 'Food Judge' }}
        />
        <Tab.Screen 
          name="Cart" 
          component={CartScreen}
          options={{ title: 'My Cart' }}
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavoritesScreen}
          options={{ title: 'Favorites' }}
        />
        <Tab.Screen 
          name="Summary" 
          component={SummaryScreen}
          options={{ title: 'Summary' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}