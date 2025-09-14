import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

const ChatScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      text: 'Hi! I\'m your sustainability food judge. Ask me about any food item and I\'ll evaluate its environmental impact! 🌱',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef();

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/judge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          food_query: userMessage.text,
          user_id: 'default_user',
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: formatJudgmentResponse(data.judgment),
          judgment: data.judgment,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Failed to evaluate food');
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: `Sorry, I couldn't evaluate that food item. Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const formatJudgmentResponse = (judgment) => {
    const { food_name, overall_score, overall_rating, rating_emoji, rationale, recommendation } = judgment;
    
    return `${rating_emoji} ${food_name}\n\nSustainability Score: ${overall_score}% (${overall_rating})\n\n${rationale}\n\n💡 ${recommendation}`;
  };

  const addToCart = async (judgment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'default_user',
          food_item: judgment,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        Alert.alert('Added to Cart', `${judgment.food_name} has been added to your cart!`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add item to cart: ${error.message}`);
    }
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    const hasJudgment = message.judgment && !isUser;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.aiMessage
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.text}
        </Text>
        
        {hasJudgment && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(message.judgment)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Evaluating sustainability...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about any food item..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen;