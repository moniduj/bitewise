import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites?user_id=default_user`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setFavorites(data.favorites);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to load favorites: ${error.message}`);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchFavorites();
    setIsRefreshing(false);
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const removeFromFavorites = async (foodId, foodName) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${foodName} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/favorites/remove`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: 'default_user',
                  food_id: foodId,
                }),
              });

              const data = await response.json();

              if (data.status === 'success') {
                setFavorites(prev => prev.filter(item => item.food_id !== foodId));
                Alert.alert('Removed', 'Item removed from favorites');
              } else {
                throw new Error(data.message);
              }
            } catch (error) {
              Alert.alert('Error', `Failed to remove item: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const addToCart = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'default_user',
          food_item: item,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        Alert.alert('Added to Cart', `${item.food_name} has been added to your cart!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add to cart: ${error.message}`);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'GREAT': return '#4CAF50';
      case 'GOOD': return '#8BC34A';
      case 'AVERAGE': return '#FF9800';
      case 'POOR': return '#F44336';
      default: return '#666';
    }
  };

  const renderBreakdown = (breakdown) => {
    const categories = [
      { key: 'carbon_footprint', label: 'Carbon Footprint' },
      { key: 'processing_level', label: 'Processing Level' },
      { key: 'artificial_ingredients', label: 'Artificial Ingredients' },
      { key: 'organic_certifications', label: 'Certifications' },
      { key: 'transportation_origin', label: 'Transportation' },
      { key: 'food_category', label: 'Food Category' },
    ];

    return (
      <View style={styles.breakdown}>
        {categories.map(({ key, label }) => {
          const item = breakdown[key];
          if (!item) return null;
          
          return (
            <View key={key} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>{label}:</Text>
              <View style={styles.breakdownScore}>
                <Text style={styles.breakdownPoints}>{item.score}/100</Text>
                <Text style={styles.breakdownReasoning}>{item.reasoning}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderFavoriteItem = (item) => {
    const isExpanded = expandedItems[item.food_id];
    const ratingColor = getRatingColor(item.overall_rating);

    return (
      <View key={item.food_id} style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemHeader}
          onPress={() => toggleExpanded(item.food_id)}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.food_name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingEmoji}>{item.rating_emoji}</Text>
              <Text style={[styles.ratingText, { color: ratingColor }]}>
                {item.overall_score}% ({item.overall_rating})
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.rationale}>{item.rationale}</Text>
            <Text style={styles.recommendation}>💡 {item.recommendation}</Text>
            
            {item.breakdown && renderBreakdown(item.breakdown)}
            
            {item.data_gaps && item.data_gaps.length > 0 && (
              <View style={styles.dataGaps}>
                <Text style={styles.dataGapsTitle}>Data Limitations:</Text>
                {item.data_gaps.map((gap, index) => (
                  <Text key={index} style={styles.dataGap}>• {gap}</Text>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => addToCart(item)}
            >
              <Ionicons name="basket-outline" size={16} color="#fff" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeFromFavorites(item.food_id, item.food_name)}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.delete