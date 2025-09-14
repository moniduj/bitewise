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

const CartScreen = () => {
  const [cartItems, setCartItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart?user_id=default_user`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setCartItems(data.cart_items);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to load cart: ${error.message}`);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCartItems();
    setIsRefreshing(false);
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const removeFromCart = async (foodId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/remove`, {
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
        setCartItems(prev => prev.filter(item => item.food_id !== foodId));
        Alert.alert('Removed', 'Item removed from cart');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to remove item: ${error.message}`);
    }
  };

  const addToFavorites = async (item) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/add`, {
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
        Alert.alert('Added to Favorites', `${item.food_name} has been added to your favorites!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add to favorites: ${error.message}`);
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

  const renderCartItem = (item) => {
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
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={() => removeFromCart(item.food_id)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.favoriteButton]}
            onPress={() => addToFavorites(item)}
          >
            <Ionicons name="heart-outline" size={16} color="#fff" />
            <Text style={styles.buttonText}>Favorite</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.emptyContainer}
      >
        <Ionicons name="basket-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Use the chat screen to evaluate foods and add them to your cart!
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
        </Text>
      </View>
      
      {cartItems.map(renderCartItem)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rationale: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  breakdown: {
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  breakdownScore: {
    flex: 1,
  },
  breakdownPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  breakdownReasoning: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  dataGaps: {
    marginTop: 8,
  },
  dataGapsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  dataGap: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderBottomLeftRadius: 12,
  },
  favoriteButton: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default CartScreen;