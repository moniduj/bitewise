import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";

import { API_BASE_URL } from "../../config/api";

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [foods, setFoods] = useState([]); // holds judged foods
  const [response, setResponse] = useState("");

  // 🔹 1. Judge food with backend
  const judgeFood = async () => {
    if (!input.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/judge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food_query: input.trim(),
          user_id: "default_user",
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setFoods((prev) => [...prev, data.judgment]);
        setResponse("");
      } else {
        setResponse("❌ Error: " + data.message);
      }
    } catch (err) {
      console.error(err);
      setResponse("❌ Error connecting to backend");
    }

    setInput("");
  };

  // 🔹 2. Add to cart
  const addToCart = async (food) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default_user", food_item: food }),
      });
      const data = await res.json();
      setResponse(data.message || "Added to cart");
    } catch (err) {
      setResponse("❌ Error adding to cart");
    }
  };

  // 🔹 3. Get cart
  const getCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart?user_id=default_user`);
      const data = await res.json();
      setResponse(JSON.stringify(data.cart_items, null, 2));
    } catch (err) {
      setResponse("❌ Error fetching cart");
    }
  };

  // 🔹 4. Remove from cart
  const removeFromCart = async (foodId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default_user", food_id: foodId }),
      });
      const data = await res.json();
      setResponse(data.message || "Removed from cart");
    } catch (err) {
      setResponse("❌ Error removing from cart");
    }
  };

  // 🔹 5. Add to favorites
  const addToFavorites = async (food) => {
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default_user", food_item: food }),
      });
      const data = await res.json();
      setResponse(data.message || "Added to favorites");
    } catch (err) {
      setResponse("❌ Error adding to favorites");
    }
  };

  // 🔹 6. Get favorites
  const getFavorites = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/favorites?user_id=default_user`);
      const data = await res.json();
      setResponse(JSON.stringify(data.favorites, null, 2));
    } catch (err) {
      setResponse("❌ Error fetching favorites");
    }
  };

  // 🔹 7. Remove from favorites
  const removeFromFavorites = async (foodId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "default_user", food_id: foodId }),
      });
      const data = await res.json();
      setResponse(data.message || "Removed from favorites");
    } catch (err) {
      setResponse("❌ Error removing from favorites");
    }
  };

  // 🔹 8. Get sustainability summary
  const getSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/summary?user_id=default_user`);
      const data = await res.json();
      setResponse(JSON.stringify(data.summary, null, 2));
    } catch (err) {
      setResponse("❌ Error fetching summary");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Sustainability Chat</Text>

      {/* Input box */}
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder="Enter a food item"
      />
      <Button title="Judge Food" onPress={judgeFood} />

      {/* List of judged foods */}
      <FlatList
        style={styles.list}
        data={foods}
        keyExtractor={(item) => item.food_id}
        renderItem={({ item }) => (
          <View style={styles.foodItem}>
            <Text style={styles.foodName}>{item.query}</Text>
            <Text style={styles.foodRating}>
              {item.overall_rating} ({item.overall_score}%)
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => addToCart(item)}
              >
                <Text>🛒</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => addToFavorites(item)}
              >
                <Text>❤️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => removeFromCart(item.food_id)}
              >
                <Text>❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Utility buttons */}
      <View style={styles.utility}>
        <Button title="🛒 Get Cart" onPress={getCart} />
        <Button title="⭐ Get Favorites" onPress={getFavorites} />
        <Button title="📊 Get Summary" onPress={getSummary} />
      </View>

      {/* Response box */}
      {response ? <Text style={styles.response}>{response}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  list: { marginVertical: 16 },
  foodItem: {
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  foodName: { fontSize: 16, fontWeight: "bold" },
  foodRating: { fontSize: 14, marginTop: 4, color: "#4CAF50" },
  actions: { flexDirection: "row", marginTop: 8 },
  actionBtn: { marginRight: 12 },
  utility: { marginTop: 20 },
  response: { marginTop: 20, fontSize: 14, color: "green" },
});
