import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import './Onboarding.css';

const INTERESTS = [
  'Mathematics',
  'Artificial Intelligence',
  'Data Structures',
  'Web Development',
  'Machine Learning',
  'Cyber Security',
  'Cloud Computing',
  'UI/UX Design',
  'Mobile App Development',
  'Competitive Programming',
  'English Communication',
  'Finance & Investing',
  'Data Science',
  'DevOps',
  'Blockchain',
  'Game Development',
  'Database Management',
  'Networking',
  'Software Testing',
  'Project Management'
];

const Onboarding = () => {
  const { user, token, verifyToken } = useAuth();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else if (prev.length < 10) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    
    if (!trimmed) {
      setError('Please enter an interest');
      return;
    }

    if (trimmed.length < 2) {
      setError('Interest must be at least 2 characters');
      return;
    }

    if (trimmed.length > 50) {
      setError('Interest must be less than 50 characters');
      return;
    }

    // Check if already exists (case-insensitive)
    const exists = selectedInterests.some(
      interest => interest.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setError('This interest is already added');
      return;
    }

    if (selectedInterests.length >= 10) {
      setError('Maximum 10 interests allowed');
      return;
    }

    setSelectedInterests(prev => [...prev, trimmed]);
    setCustomInterest('');
    setShowCustomInput(false);
    setError(null);
  };

  const handleRemoveInterest = (interest) => {
    setSelectedInterests(prev => prev.filter(i => i !== interest));
  };

  const handleSubmit = async () => {
    if (selectedInterests.length < 3) {
      setError('Please select at least 3 interests');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await usersAPI.setPreferences({ interests: selectedInterests });

      if (res.data?.success) {
        // Refresh user data to update onboarding status
        await verifyToken();
        navigate('/dashboard');
      } else {
        setError('Failed to save preferences');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          'Failed to save preferences';
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Choose what you may like</h1>
          <p>This helps us recommend better study groups & sessions for you</p>
        </div>

        <div className="interests-grid">
          {INTERESTS.map(interest => (
            <button
              key={interest}
              className={`interest-button ${selectedInterests.includes(interest) ? 'selected' : ''}`}
              onClick={() => toggleInterest(interest)}
              disabled={selectedInterests.length >= 10 && !selectedInterests.includes(interest)}
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="selection-info">
          <p>
            Selected: {selectedInterests.length}/10
            {selectedInterests.length < 3 && (
              <span className="warning"> (minimum 3 required)</span>
            )}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="onboarding-actions">
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={selectedInterests.length < 3 || loading}
          >
            {loading ? 'Saving...' : 'Continue to EduConnect'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
