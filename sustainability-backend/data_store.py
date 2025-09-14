from typing import Dict, List, Any
import json
import os

class DataStore:
    """Simple in-memory data store for hackathon (no database needed)"""
    
    def __init__(self):
        # In-memory storage (will reset when container restarts)
        self.users_data = {}
        
        # Try to load from file if it exists (for persistence)
        self.data_file = "user_data.json"
        self._load_data()
    
    def _load_data(self):
        """Load data from file if it exists"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    self.users_data = json.load(f)
        except Exception as e:
            print(f"Could not load data: {e}")
            self.users_data = {}
    
    def _save_data(self):
        """Save data to file for persistence"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.users_data, f, indent=2)
        except Exception as e:
            print(f"Could not save data: {e}")
    
    def _ensure_user_exists(self, user_id: str):
        """Ensure user data structure exists"""
        if user_id not in self.users_data:
            self.users_data[user_id] = {
                "cart": [],
                "favorites": [],
                "history": []
            }
    
    def add_to_cart(self, user_id: str, food_item: Dict[str, Any]):
        """Add food item to user's cart"""
        self._ensure_user_exists(user_id)
        
        # Check if item already exists in cart
        existing_item = None
        for item in self.users_data[user_id]["cart"]:
            if item.get("food_id") == food_item.get("food_id"):
                existing_item = item
                break
        
        if existing_item:
            # Update existing item
            existing_item.update(food_item)
        else:
            # Add new item
            self.users_data[user_id]["cart"].append(food_item)
        
        self._save_data()
    
    def get_cart(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's cart items"""
        self._ensure_user_exists(user_id)
        return self.users_data[user_id]["cart"]
    
    def remove_from_cart(self, user_id: str, food_id: str):
        """Remove item from user's cart"""
        self._ensure_user_exists(user_id)
        self.users_data[user_id]["cart"] = [
            item for item in self.users_data[user_id]["cart"] 
            if item.get("food_id") != food_id
        ]
        self._save_data()
    
    def add_to_favorites(self, user_id: str, food_item: Dict[str, Any]):
        """Add food item to user's favorites"""
        self._ensure_user_exists(user_id)
        
        # Check if already in favorites
        existing_item = None
        for item in self.users_data[user_id]["favorites"]:
            if item.get("food_id") == food_item.get("food_id"):
                existing_item = item
                break
        
        if not existing_item:
            self.users_data[user_id]["favorites"].append(food_item)
            self._save_data()
    
    def get_favorites(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's favorite items"""
        self._ensure_user_exists(user_id)
        return self.users_data[user_id]["favorites"]
    
    def remove_from_favorites(self, user_id: str, food_id: str):
        """Remove item from user's favorites"""
        self._ensure_user_exists(user_id)
        self.users_data[user_id]["favorites"] = [
            item for item in self.users_data[user_id]["favorites"]
            if item.get("food_id") != food_id
        ]
        self._save_data()
    
    def get_user_foods(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all food items for a user (cart + favorites)"""
        self._ensure_user_exists(user_id)
        return self.users_data[user_id]["cart"] + self.users_data[user_id]["favorites"]
    
    def add_to_history(self, user_id: str, food_item: Dict[str, Any]):
        """Add evaluated food to user's history"""
        self._ensure_user_exists(user_id)
        
        # Keep only last 50 items in history
        history = self.users_data[user_id]["history"]
        history.append(food_item)
        if len(history) > 50:
            history.pop(0)
        
        self._save_data()
    
    def get_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's evaluation history"""
        self._ensure_user_exists(user_id)
        return self.users_data[user_id]["history"]
    
    def clear_cart(self, user_id: str):
        """Clear user's cart"""
        self._ensure_user_exists(user_id)
        self.users_data[user_id]["cart"] = []
        self._save_data()
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        self._ensure_user_exists(user_id)
        
        cart = self.users_data[user_id]["cart"]
        favorites = self.users_data[user_id]["favorites"]
        history = self.users_data[user_id]["history"]
        
        return {
            "cart_items": len(cart),
            "favorite_items": len(favorites),
            "total_evaluations": len(history),
            "average_cart_score": sum(item.get("overall_score", 0) for item in cart) / len(cart) if cart else 0
        }