from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from recommendation_engine import RecommendationEngine

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize recommendation engine
recommendation_engine = RecommendationEngine()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'recommendation-engine'})

@app.route('/api/recommendations/groups', methods=['POST'])
def get_group_recommendations():
    """
    Get personalized group recommendations for a user
    """
    try:
        data = request.get_json()

        if not data or 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400

        user_id = data['user_id']
        limit = data.get('limit', 10)

        # Get recommendations
        recommendations = recommendation_engine.get_group_recommendations(user_id, limit)

        return jsonify({
            'success': True,
            'recommendations': recommendations
        })

    except Exception as e:
        print(f"Error getting group recommendations: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/recommendations/sessions', methods=['POST'])
def get_session_recommendations():
    """
    Get personalized session recommendations for a user
    """
    try:
        data = request.get_json()

        if not data or 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400

        user_id = data['user_id']
        limit = data.get('limit', 10)

        # Get recommendations
        recommendations = recommendation_engine.get_session_recommendations(user_id, limit)

        return jsonify({
            'success': True,
            'recommendations': recommendations
        })

    except Exception as e:
        print(f"Error getting session recommendations: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/recommendations/train', methods=['POST'])
def train_model():
    """
    Trigger model training (admin endpoint)
    """
    try:
        success = recommendation_engine.train_models()
        return jsonify({
            'success': success,
            'message': 'Model training completed' if success else 'Model training failed'
        })
    except Exception as e:
        print(f"Error training model: {e}")
        return jsonify({'error': 'Training failed'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
