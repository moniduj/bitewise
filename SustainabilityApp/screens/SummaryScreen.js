import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const screenWidth = Dimensions.get('window').width;

const SummaryScreen = () => {
  const [summary, setSummary] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/summary?user_id=default_user`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setSummary(data.summary);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to load summary: ${error.message}`);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSummary();
    setIsRefreshing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4CAF50';
    if (score >= 50) return '#8BC34A';
    if (score >= 25) return '#FF9800';
    return '#F44336';
  };

  const getScoreEmoji = (score) => {
    if (score >= 75) return '🌟';
    if (score >= 50) return '✅';
    if (score >= 25) return '⚠️';
    return '❌';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'GREAT';
    if (score >= 50) return 'GOOD';
    if (score >= 25) return 'AVERAGE';
    return 'POOR';
  };

  const renderChart = () => {
    if (!summary || summary.total_items === 0) return null;

    const chartData = summary.chart_data
      .filter(item => item.count > 0)
      .map(item => ({
        name: item.name,
        population: item.count,
        color: item.color,
        legendFontColor: '#333',
        legendFontSize: 12,
      }));

    if (chartData.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Rating Distribution</Text>
        <PieChart
          data={chartData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    );
  };

  const renderScoreBreakdown = () => {
    if (!summary) return null;

    const { rating_distribution } = summary;
    
    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.breakdownTitle}>Item Breakdown</Text>
        {Object.entries(rating_distribution).map(([rating, count]) => {
          if (count === 0) return null;
          
          const color = getScoreColor(rating === 'GREAT' ? 85 : rating === 'GOOD' ? 65 : rating === 'AVERAGE' ? 35 : 15);
          const emoji = getScoreEmoji(rating === 'GREAT' ? 85 : rating === 'GOOD' ? 65 : rating === 'AVERAGE' ? 35 : 15);
          
          return (
            <View key={rating} style={styles.breakdownItem}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownEmoji}>{emoji}</Text>
                <Text style={styles.breakdownRating}>{rating}</Text>
              </View>
              <Text style={[styles.breakdownCount, { color }]}>
                {count} item{count !== 1 ? 's' : ''}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!summary || !summary.recommendations || summary.recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
        {summary.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationText}>
              {recommendation.replace(/^[\d\-\*\s]+/, '')}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!summary) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.emptyContainer}
      >
        <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No data to summarize</Text>
        <Text style={styles.emptySubtitle}>
          Add items to your cart to see a sustainability summary!
        </Text>
      </ScrollView>
    );
  }

  if (summary.total_items === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.emptyContainer}
      >
        <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Add some items to your cart to see their sustainability summary!
        </Text>
      </ScrollView>
    );
  }

  const scoreColor = getScoreColor(summary.average_score);
  const scoreEmoji = getScoreEmoji(summary.average_score);
  const scoreLabel = getScoreLabel(summary.average_score);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overall Score */}
      <View style={styles.overallContainer}>
        <Text style={styles.overallTitle}>Overall Sustainability</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreEmoji}>{scoreEmoji}</Text>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {summary.average_score}%
            </Text>
            <Text style={[styles.scoreLabel, { color: scoreColor }]}>
              {scoreLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.itemCount}>
          Based on {summary.total_items} item{summary.total_items !== 1 ? 's' : ''} in your cart
        </Text>
      </View>

      {/* Chart */}
      {renderChart()}

      {/* Score Breakdown */}
      {renderScoreBreakdown()}

      {/* Summary Text */}
      <View style={styles.summaryTextContainer}>
        <Text style={styles.summaryTextTitle}>Analysis</Text>
        <Text style={styles.summaryText}>
          {summary.summary_text}
        </Text>
      </View>

      {/* Recommendations */}
      {renderRecommendations()}
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
  overallContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overallTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  scoreInfo: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  breakdownRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTextContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
});

export default SummaryScreen;