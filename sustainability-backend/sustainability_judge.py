import anthropic
import json
import re
from typing import Dict, List, Any

class SustainabilityJudge:
    def __init__(self, claude_client):
        self.claude_client = claude_client
        self.constitution = self._load_constitution()
    
    def _load_constitution(self) -> str:
        """Load the sustainability scoring constitution"""
        return """
        # Food Sustainability Scoring System

        ## Criteria Weights (Total = 100%)
        1. **Carbon Footprint**: 25%
        2. **Processing Level**: 20% 
        3. **Artificial Ingredients**: 20%
        4. **Organic/Certifications**: 15%
        5. **Transportation/Origin**: 15%
        6. **Food Category Impact**: 5%

        ## Scoring Scales:

        ### Carbon Footprint (25% weight)
        - 100 points: ≤1.0 kg CO2e/kg (vegetables, fruits)
        - 75 points: 1.1-3.0 kg CO2e/kg (grains, dairy, eggs)
        - 50 points: 3.1-8.0 kg CO2e/kg (chicken, pork)
        - 25 points: 8.1-20.0 kg CO2e/kg (cheese, processed foods)
        - 0 points: >20.0 kg CO2e/kg (beef, lamb)

        ### Processing Level (20% weight)
        - 100 points: Minimal (1-3 ingredients)
        - 75 points: Light (4-8 ingredients)
        - 50 points: Moderate (9-15 ingredients)
        - 25 points: High (16-25 ingredients)
        - 0 points: Ultra-processed (25+ ingredients)

        ### Artificial Ingredients (20% weight)
        - 100 points: No artificial ingredients
        - 75-99 points: 1 minor artificial ingredient
        - 50-74 points: 2-3 artificial ingredients
        - 25-49 points: 4-6 artificial ingredients
        - 0-24 points: 7+ artificial ingredients

        ### Organic/Certifications (15% weight)
        - 100 points: Multiple certifications (Organic + Fair Trade)
        - 85 points: USDA Organic
        - 70 points: Made with Organic
        - 60 points: Single certification (Non-GMO, Fair Trade)
        - 40 points: Animal welfare only
        - 20 points: Minor claims ("Natural")
        - 0 points: No certifications

        ### Transportation/Origin (15% weight)
        - 100 points: Local (<100 miles)
        - 80 points: Regional (100-500 miles)
        - 60 points: National (500-1,500 miles)
        - 30 points: International (1,500+ miles)
        - 0 points: Long-distance air freight

        ### Food Category Impact (5% weight)
        - 100 points: Vegetables, fruits, legumes
        - 80 points: Grains, nuts
        - 60 points: Dairy alternatives, eggs
        - 40 points: Dairy products, fish
        - 20 points: Poultry, pork
        - 0 points: Beef, lamb

        ## Final Rating Scale:
        - 75-100%: 🌟 GREAT - Highly sustainable
        - 50-74%: ✅ GOOD - Reasonably sustainable
        - 25-49%: ⚠️ AVERAGE - Some concerns
        - 0-24%: ❌ POOR - Low sustainability
        """

    def evaluate_food(self, food_query: str) -> Dict[str, Any]:
        """Evaluate a food item using the constitution"""
        
        prompt = f"""
        You are a sustainability judge applying this constitution to evaluate food items:

        {self.constitution}

        Evaluate this food item: "{food_query}"

        Return your analysis in this exact JSON format:
        {{
            "food_name": "exact product name",
            "overall_score": 85,
            "overall_rating": "GREAT",
            "rating_emoji": "🌟",
            "confidence": 0.85,
            "breakdown": {{
                "carbon_footprint": {{"score": 75, "reasoning": "brief explanation"}},
                "processing_level": {{"score": 100, "reasoning": "brief explanation"}},
                "artificial_ingredients": {{"score": 100, "reasoning": "brief explanation"}},
                "organic_certifications": {{"score": 85, "reasoning": "brief explanation"}},
                "transportation_origin": {{"score": 60, "reasoning": "brief explanation"}},
                "food_category": {{"score": 60, "reasoning": "brief explanation"}}
            }},
            "rationale": "2-3 sentence summary of why this food got this rating",
            "recommendation": "specific advice for the consumer",
            "data_gaps": ["list any missing information that affected confidence"]
        }}

        Be specific about the product. If the query is vague (like "chicken"), ask for clarification or make reasonable assumptions about a common variant.
        """

        try:
            response = self.claude_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extract JSON from response
            content = response.content[0].text
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            
            if json_match:
                judgment = json.loads(json_match.group())
                return judgment
            else:
                raise ValueError("Could not parse JSON from Claude response")
                
        except Exception as e:
            return {
                "food_name": food_query,
                "overall_score": 0,
                "overall_rating": "ERROR",
                "rating_emoji": "❌",
                "confidence": 0.0,
                "breakdown": {},
                "rationale": f"Error occurred during evaluation: {str(e)}",
                "recommendation": "Unable to evaluate this food item",
                "data_gaps": ["Error in processing"]
            }

    def generate_summary(self, cart_items: List[Dict]) -> Dict[str, Any]:
        """Generate sustainability summary of cart items"""
        
        if not cart_items:
            return {
                "average_score": 0,
                "total_items": 0,
                "rating_distribution": {"GREAT": 0, "GOOD": 0, "AVERAGE": 0, "POOR": 0},
                "chart_data": [],
                "summary_text": "Your cart is empty.",
                "recommendations": []
            }
        
        # Calculate statistics
        total_score = sum(item.get('overall_score', 0) for item in cart_items)
        average_score = total_score / len(cart_items)
        
        # Rating distribution
        rating_counts = {"GREAT": 0, "GOOD": 0, "AVERAGE": 0, "POOR": 0}
        for item in cart_items:
            rating = item.get('overall_rating', 'POOR')
            if rating in rating_counts:
                rating_counts[rating] += 1
        
        # Chart data for React Native Chart Kit
        chart_data = [
            {"name": "GREAT", "count": rating_counts["GREAT"], "color": "#4CAF50"},
            {"name": "GOOD", "count": rating_counts["GOOD"], "color": "#8BC34A"},  
            {"name": "AVERAGE", "count": rating_counts["AVERAGE"], "color": "#FF9800"},
            {"name": "POOR", "count": rating_counts["POOR"], "color": "#F44336"}
        ]
        
        # Generate summary text with Claude
        prompt = f"""
        Summarize the sustainability of this grocery cart:
        
        Items: {[item.get('food_name', 'Unknown') + ' (' + str(item.get('overall_score', 0)) + '%)' for item in cart_items]}
        
        Average Score: {average_score:.1f}%
        Rating Distribution: {rating_counts}
        
        Provide:
        1. A 2-sentence overall assessment
        2. 2-3 specific recommendations for improvement
        
        Keep it encouraging but honest.
        """
        
        try:
            response = self.claude_client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            summary_text = response.content[0].text
            
            # Extract recommendations (assume they start with numbers or bullets)
            recommendations = []
            lines = summary_text.split('\n')
            for line in lines:
                if re.match(r'^[\d\-\*]', line.strip()):
                    recommendations.append(line.strip())
            
        except Exception as e:
            summary_text = f"Your cart has {len(cart_items)} items with an average sustainability score of {average_score:.1f}%."
            recommendations = ["Consider adding more plant-based options", "Look for organic alternatives"]
        
        return {
            "average_score": round(average_score, 1),
            "total_items": len(cart_items),
            "rating_distribution": rating_counts,
            "chart_data": chart_data,
            "summary_text": summary_text,
            "recommendations": recommendations
        }