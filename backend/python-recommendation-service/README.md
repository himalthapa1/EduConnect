# EduConnect Recommendation Service

Python-based recommendation engine for EduConnect using hybrid filtering approach.

## Features

- **Content-Based Filtering**: Recommends groups based on user interests and group tags
- **Collaborative Filtering**: Finds similar users and recommends groups they like
- **Popularity-Based**: Boosts recommendations for active and popular groups
- **Cold Start Handling**: Special logic for new users with limited data
- **Hybrid Scoring**: Combines multiple algorithms for better recommendations

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Copy `.env` file and update MongoDB URI if needed:
   ```
   MONGODB_URI=mongodb://localhost:27017/study
   FLASK_ENV=development
   PORT=5000
   ```

3. **Run the Service**
   ```bash
   python app.py
   ```

   Service will be available at `http://localhost:5000`

## API Endpoints

### Health Check
```http
GET /health
```

### Group Recommendations
```http
POST /api/recommendations/groups
Content-Type: application/json

{
  "user_id": "user_object_id",
  "limit": 10
}
```

### Session Recommendations
```http
POST /api/recommendations/sessions
Content-Type: application/json

{
  "user_id": "user_object_id",
  "limit": 10
}
```

### Train Models (Admin)
```http
POST /api/recommendations/train
```

## Algorithm Details

### Scoring Formula
```
Final Score = (Content Similarity × 0.4) + (Collaborative Score × 0.4) + (Popularity Score × 0.2)
```

### Cold Start Strategy
For new users with limited data:
```
Cold Start Score = (Content Similarity × 0.6) + (Popularity Score × 0.4)
```

### Content Similarity
- Uses TF-IDF vectorization on user interests and group tags
- Falls back to Jaccard similarity if TF-IDF fails

### Collaborative Filtering
- Finds users who joined the same groups
- Calculates interest overlap between similar users

### Popularity Score
- Based on member count (normalized)
- Activity score from group interactions
- Recency bonus for newer groups

## Data Requirements

The service expects these MongoDB collections:
- `users`: User profiles with interests and activity data
- `study_groups`: Group information with tags and member counts
- `sessions`: Study sessions with participant data

## Development

### Project Structure
```
├── app.py                 # Flask application
├── recommendation_engine.py # Core recommendation logic
├── requirements.txt       # Python dependencies
├── .env                  # Environment configuration
└── README.md             # This file
```

### Adding New Features
1. Extend `RecommendationEngine` class
2. Add new methods for specific algorithms
3. Update scoring formulas as needed
4. Test with sample data

### Performance Considerations
- Results are not cached (can be added for production)
- Database queries are optimized for the hybrid approach
- TF-IDF vectorization is fitted on demand

## Integration with Node.js Backend

The Node.js backend should proxy requests to this Python service:

```javascript
// Example integration
const response = await axios.post('http://localhost:5000/api/recommendations/groups', {
  user_id: req.user.userId,
  limit: 10
});
