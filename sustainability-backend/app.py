from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
import json
import os
from dotenv import load_dotenv
from sustainability_judge import SustainabilityJudge
from data_store import DataStore

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native

claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
judge = SustainabilityJudge(claude_client)
data_store = DataStore()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Sustainability AI Judge is running"})

@app.route('/judge', methods=['POST'])
def judge_food():
    """Judge a single food item for sustainability"""
    try:
        data = request.json
        food_query = data.get('food_query', '')
        user_id = data.get('user_id', 'default_user')
        
        if not food_query:
            return jsonify({"error": "food_query is required"}), 400
        
        # Get sustainability judgment from AI
        judgment = judge.evaluate_food(food_query)
        
        # Add unique ID for tracking
        judgment['food_id'] = f"food_{len(data_store.get_user_foods(user_id)) + 1}"
        judgment['query'] = food_query
        
        return jsonify({
            "status": "success",
            "judgment": judgment
        })
        
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    """Add food item to user's cart"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default_user')
        food_item = data.get('food_item')
        
        if not food_item:
            return jsonify({"error": "food_item is required"}), 400
        
        data_store.add_to_cart(user_id, food_item)
        
        return jsonify({
            "status": "success",
            "message": "Item added to cart"
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/cart', methods=['GET'])
def get_cart():
    """Get user's cart items"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        cart_items = data_store.get_cart(user_id)
        
        return jsonify({
            "status": "success",
            "cart_items": cart_items
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/cart/remove', methods=['DELETE'])
def remove_from_cart():
    """Remove item from cart"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default_user')
        food_id = data.get('food_id')
        
        data_store.remove_from_cart(user_id, food_id)
        
        return jsonify({
            "status": "success",
            "message": "Item removed from cart"
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/favorites/add', methods=['POST'])
def add_to_favorites():
    """Add item to favorites"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default_user')
        food_item = data.get('food_item')
        
        data_store.add_to_favorites(user_id, food_item)
        
        return jsonify({
            "status": "success", 
            "message": "Item added to favorites"
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/favorites', methods=['GET'])
def get_favorites():
    """Get user's favorite items"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        favorites = data_store.get_favorites(user_id)
        
        return jsonify({
            "status": "success",
            "favorites": favorites
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/favorites/remove', methods=['DELETE'])
def remove_from_favorites():
    """Remove item from favorites"""
    try:
        data = request.json
        user_id = data.get('user_id', 'default_user')
        food_id = data.get('food_id')
        
        data_store.remove_from_favorites(user_id, food_id)
        
        return jsonify({
            "status": "success",
            "message": "Item removed from favorites"
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/summary', methods=['GET'])
def get_cart_summary():
    """Get sustainability summary of cart items"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        cart_items = data_store.get_cart(user_id)
        
        summary = judge.generate_summary(cart_items)
        
        return jsonify({
            "status": "success",
            "summary": summary
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)