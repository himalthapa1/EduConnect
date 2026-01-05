import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
import pymongo
from datetime import datetime, timedelta
import os
from typing import List, Dict, Any
import json

class RecommendationEngine:
    def __init__(self):
        # MongoDB connection
        mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/study')
        self.client = pymongo.MongoClient(mongo_uri)
        self.db = self.client['study']

        # Initialize vectorizers and models
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self.mlb = MultiLabelBinarizer()

        # Cache for recommendations
        self.user_cache = {}
        self.group_cache = {}
        self.cache_expiry = timedelta(hours=1)

        print("Recommendation Engine initialized")

    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Get user data from database"""
        user = self.db.users.find_one({'_id': user_id})
        if not user:
            return None

        return {
            'id': str(user['_id']),
            'interests': user.get('preferences', {}).get('interests', []),
            'skills_level': user.get('preferences', {}).get('skillsLevel', {}),
            'study_time_preference': user.get('preferences', {}).get('studyTimePreference', []),
            'joined_groups': [str(g) for g in user.get('joinedGroups', [])],
            'attended_sessions': [str(s) for s in user.get('attendedSessions', [])],
            'activity_score': user.get('activityScore', 0),
            'current_year': user.get('currentYear', '1st Year')
        }

    def _get_all_groups(self) -> List[Dict[str, Any]]:
        """Get all public groups from database"""
        groups = list(self.db.study_groups.find({'isPublic': True}))
        return [{
            'id': str(g['_id']),
            'name': g.get('name', ''),
            'description': g.get('description', ''),
            'subject': g.get('subject', ''),
            'subject_tags': g.get('subjectTags', []),
            'difficulty': g.get('difficulty', 'beginner'),
            'members_count': len(g.get('members', [])),
            'activity_score': g.get('activityScore', 0),
            'created_at': g.get('createdAt', datetime.now())
        } for g in groups]

    def _get_all_sessions(self) -> List[Dict[str, Any]]:
        """Get all public sessions from database"""
        sessions = list(self.db.sessions.find({'isPublic': True}))
        return [{
            'id': str(s['_id']),
            'title': s.get('title', ''),
            'description': s.get('description', ''),
            'subject': s.get('subject', ''),
            'date': s.get('date'),
            'start_time': s.get('startTime'),
            'max_participants': s.get('maxParticipants', 50),
            'participants_count': len(s.get('participants', [])),
            'group_id': str(s.get('group', '')) if s.get('group') else None
        } for s in sessions]

    def _content_similarity_score(self, user_interests: List[str], group_tags: List[str]) -> float:
        """Calculate content-based similarity between user interests and group tags"""
        if not user_interests or not group_tags:
            return 0.0

        # Combine all text for TF-IDF
        user_text = ' '.join(user_interests)
        group_text = ' '.join(group_tags)

        # Create TF-IDF vectors
        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform([user_text, group_text])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return float(similarity)
        except:
            # Fallback: simple Jaccard similarity
            user_set = set(user_interests)
            group_set = set(group_tags)
            intersection = len(user_set.intersection(group_set))
            union = len(user_set.union(group_set))
            return intersection / union if union > 0 else 0.0

    def _collaborative_score(self, user_id: str, group_id: str) -> float:
        """Calculate collaborative filtering score"""
        # Get users who joined this group
        group_users = self.db.study_groups.find_one({'_id': group_id}, {'members': 1})
        if not group_users:
            return 0.0

        similar_users = group_users.get('members', [])
        if user_id in similar_users:
            similar_users.remove(user_id)

        if not similar_users:
            return 0.0

        # Get interests of similar users
        similar_users_data = list(self.db.users.find(
            {'_id': {'$in': similar_users}},
            {'preferences.interests': 1}
        ))

        # Calculate similarity based on overlapping interests
        user_data = self._get_user_data(user_id)
        user_interests = set(user_data['interests'])

        total_similarity = 0.0
        count = 0

        for similar_user in similar_users_data:
            similar_interests = set(similar_user.get('preferences', {}).get('interests', []))
            if similar_interests:
                similarity = len(user_interests.intersection(similar_interests)) / len(user_interests.union(similar_interests))
                total_similarity += similarity
                count += 1

        return total_similarity / count if count > 0 else 0.0

    def _calculate_popularity_score(self, group: Dict[str, Any]) -> float:
        """Calculate popularity score based on members and activity"""
        members_score = min(group['members_count'] / 100, 1.0)  # Cap at 100 members
        activity_score = min(group['activity_score'] / 1000, 1.0)  # Normalize activity
        recency_score = 1.0  # Could be based on creation date

        return (members_score * 0.5 + activity_score * 0.3 + recency_score * 0.2)

    def _get_cold_start_recommendations(self, user_data: Dict[str, Any], limit: int) -> List[Dict[str, Any]]:
        """Recommendations for new users based on interests and popularity"""
        all_groups = self._get_all_groups()

        recommendations = []
        for group in all_groups:
            # Skip groups user already joined
            if group['id'] in user_data['joined_groups']:
                continue

            # Content similarity
            content_score = self._content_similarity_score(user_data['interests'], group['subject_tags'])

            # Popularity score
            popularity_score = self._calculate_popularity_score(group)

            # Combined score for cold start
            final_score = (content_score * 0.6) + (popularity_score * 0.4)

            recommendations.append({
                'group_id': group['id'],
                'name': group['name'],
                'subject': group['subject'],
                'difficulty': group['difficulty'],
                'members_count': group['members_count'],
                'score': round(final_score, 3)
            })

        # Sort by score and return top recommendations
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]

    def get_group_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Main method to get group recommendations for a user"""
        try:
            user_data = self._get_user_data(user_id)
            if not user_data:
                return []

            # Cold start for new users (no joined groups or low activity)
            if len(user_data['joined_groups']) < 2 or user_data['activity_score'] < 10:
                return self._get_cold_start_recommendations(user_data, limit)

            all_groups = self._get_all_groups()
            recommendations = []

            for group in all_groups:
                # Skip groups user already joined
                if group['id'] in user_data['joined_groups']:
                    continue

                # Content-based similarity
                content_score = self._content_similarity_score(user_data['interests'], group['subject_tags'])

                # Collaborative filtering score
                collaborative_score = self._collaborative_score(user_id, group['id'])

                # Popularity score
                popularity_score = self._calculate_popularity_score(group)

                # Final weighted score
                final_score = (content_score * 0.4) + (collaborative_score * 0.4) + (popularity_score * 0.2)

                recommendations.append({
                    'group_id': group['id'],
                    'name': group['name'],
                    'subject': group['subject'],
                    'difficulty': group['difficulty'],
                    'members_count': group['members_count'],
                    'score': round(final_score, 3)
                })

            # Sort by score and return top recommendations
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            return recommendations[:limit]

        except Exception as e:
            print(f"Error in get_group_recommendations: {e}")
            return []

    def get_session_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get session recommendations for a user"""
        try:
            user_data = self._get_user_data(user_id)
            if not user_data:
                return []

            all_sessions = self._get_all_sessions()
            recommendations = []

            for session in all_sessions:
                # Skip sessions user already attended
                if session['id'] in user_data['attended_sessions']:
                    continue

                # Skip full sessions
                if session['participants_count'] >= session['max_participants']:
                    continue

                # Content similarity with user interests
                content_score = self._content_similarity_score(user_data['interests'], [session['subject']])

                # Group-based score if session belongs to a group
                group_score = 0.0
                if session['group_id'] and session['group_id'] in user_data['joined_groups']:
                    group_score = 0.8  # Boost score for user's group sessions

                # Time preference matching (simplified)
                time_score = 0.5  # Could be improved with actual time preference matching

                final_score = (content_score * 0.5) + (group_score * 0.3) + (time_score * 0.2)

                recommendations.append({
                    'session_id': session['id'],
                    'title': session['title'],
                    'subject': session['subject'],
                    'date': session['date'].isoformat() if session['date'] else None,
                    'start_time': session['start_time'],
                    'participants_count': session['participants_count'],
                    'max_participants': session['max_participants'],
                    'score': round(final_score, 3)
                })

            # Sort by score and return top recommendations
            recommendations.sort(key=lambda x: x['score'], reverse=True)
            return recommendations[:limit]

        except Exception as e:
            print(f"Error in get_session_recommendations: {e}")
            return []

    def train_models(self) -> bool:
        """Train/update the recommendation models"""
        try:
            print("Training recommendation models...")

            # For now, just refresh caches and update vectorizers
            # In a full implementation, this would train ML models

            all_groups = self._get_all_groups()
            if all_groups:
                # Fit TF-IDF on all group tags
                all_tags = [' '.join(group['subject_tags']) for group in all_groups if group['subject_tags']]
                if all_tags:
                    self.tfidf_vectorizer.fit(all_tags)

            print("Model training completed successfully")
            return True

        except Exception as e:
            print(f"Error training models: {e}")
            return False
